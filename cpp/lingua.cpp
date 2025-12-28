#include "lingua.h"
#include "liblingua.h"
#include "macros.h"
#include <string>
#include <vector>

namespace lingua {
namespace jsi = facebook::jsi;
namespace react = facebook::react;

// Wrapper class for LinguaDetector to manage as NativeState
class JSI_EXPORT LinguaDetectorWrapper : public jsi::NativeState {
public:
  LinguaDetectorWrapper(void *detector) : detector_ptr(detector) {}

  ~LinguaDetectorWrapper() {
    if (detector_ptr != nullptr) {
      lingua_detector_destroy(static_cast<LinguaDetector *>(detector_ptr));
      detector_ptr = nullptr;
    }
  }

  void *detector_ptr;
};

void install(jsi::Runtime &rt, std::shared_ptr<react::CallInvoker> invoker) {
  jsi::Object linguaModule = jsi::Object(rt);

  // createDetectorForAllLanguages
  auto createDetectorForAllLanguages =
      HOST_STATIC_FN("createDetectorForAllLanguages") {
    void *detector = lingua_detector_create_all();

    if (detector == nullptr) {
      throw jsi::JSError(rt, "Failed to create language detector");
    }

    auto wrapper = std::make_shared<LinguaDetectorWrapper>(detector);
    auto detectorObj = jsi::Object(rt);
    detectorObj.setNativeState(rt, wrapper);

    return detectorObj;
  });

  // createDetectorForLanguages
  auto createDetectorForLanguages =
      HOST_STATIC_FN("createDetectorForLanguages") {
    if (count < 1 || !args[0].isString()) {
      throw jsi::JSError(rt, "Language codes string required");
    }

    std::string langCodes = args[0].asString(rt).utf8(rt);
    const char *error = nullptr;

    void *detector =
        lingua_detector_create_from_languages(langCodes.c_str(), &error);

    if (detector == nullptr) {
      std::string errorMsg = "Failed to create detector";
      if (error != nullptr) {
        errorMsg += ": " + std::string(error);
      }
      throw jsi::JSError(rt, errorMsg);
    }

    auto wrapper = std::make_shared<LinguaDetectorWrapper>(detector);
    auto detectorObj = jsi::Object(rt);
    detectorObj.setNativeState(rt, wrapper);

    return detectorObj;
  });

  // detectLanguage
  auto detectLanguage = HOST_STATIC_FN("detectLanguage") {
    if (count < 2 || !args[0].isObject() || !args[1].isString()) {
      throw jsi::JSError(
          rt, "Invalid arguments: detector object and text string required");
    }

    auto detectorObj = args[0].asObject(rt);
    auto wrapper = detectorObj.getNativeState<LinguaDetectorWrapper>(rt);

    if (wrapper == nullptr || wrapper->detector_ptr == nullptr) {
      throw jsi::JSError(rt, "Invalid detector");
    }

    std::string text = args[1].asString(rt).utf8(rt);
    const char *error = nullptr;

    char *result = lingua_detect_language(
        static_cast<LinguaDetector *>(wrapper->detector_ptr), text.c_str(),
        &error);

    if (result == nullptr) {
      return jsi::Value::null();
    }

    std::string langCode(result);
    lingua_free_string(result);

    return jsi::String::createFromUtf8(rt, langCode);
  });

  // computeLanguageConfidence
  auto computeLanguageConfidence = HOST_STATIC_FN("computeLanguageConfidence") {
    if (count < 3 || !args[0].isObject() || !args[1].isString() ||
        !args[2].isString()) {
      throw jsi::JSError(
          rt, "Invalid arguments: detector, text, and language code required");
    }

    auto detectorObj = args[0].asObject(rt);
    auto wrapper = detectorObj.getNativeState<LinguaDetectorWrapper>(rt);

    if (wrapper == nullptr || wrapper->detector_ptr == nullptr) {
      throw jsi::JSError(rt, "Invalid detector");
    }

    std::string text = args[1].asString(rt).utf8(rt);
    std::string langCode = args[2].asString(rt).utf8(rt);
    const char *error = nullptr;

    double confidence = lingua_compute_language_confidence(
        static_cast<LinguaDetector *>(wrapper->detector_ptr), text.c_str(),
        langCode.c_str(), &error);

    return jsi::Value(confidence);
  });

  // computeLanguageConfidenceValues
  auto computeLanguageConfidenceValues =
      HOST_STATIC_FN("computeLanguageConfidenceValues") {
    if (count < 2 || !args[0].isObject() || !args[1].isString()) {
      throw jsi::JSError(rt, "Invalid arguments: detector and text required");
    }

    auto detectorObj = args[0].asObject(rt);
    auto wrapper = detectorObj.getNativeState<LinguaDetectorWrapper>(rt);

    if (wrapper == nullptr || wrapper->detector_ptr == nullptr) {
      throw jsi::JSError(rt, "Invalid detector");
    }

    std::string text = args[1].asString(rt).utf8(rt);
    const char *error = nullptr;
    int count_val = 0;

    ConfidenceValue *values = lingua_compute_language_confidence_values(
        static_cast<LinguaDetector *>(wrapper->detector_ptr), text.c_str(),
        &count_val, &error);

    if (values == nullptr || count_val == 0) {
      return jsi::Array(rt, 0);
    }

    jsi::Array result(rt, count_val);

    for (int i = 0; i < count_val; i++) {
      jsi::Object obj(rt);
      obj.setProperty(rt, "language",
                      jsi::String::createFromUtf8(rt, values[i].language_code));
      obj.setProperty(rt, "confidence", jsi::Value(values[i].confidence));
      result.setValueAtIndex(rt, i, std::move(obj));
    }

    lingua_free_confidence_values(values, count_val);

    return result;
  });

  linguaModule.setProperty(rt, "createDetectorForAllLanguages",
                           std::move(createDetectorForAllLanguages));
  linguaModule.setProperty(rt, "createDetectorForLanguages",
                           std::move(createDetectorForLanguages));
  linguaModule.setProperty(rt, "detectLanguage", std::move(detectLanguage));
  linguaModule.setProperty(rt, "computeLanguageConfidence",
                           std::move(computeLanguageConfidence));
  linguaModule.setProperty(rt, "computeLanguageConfidenceValues",
                           std::move(computeLanguageConfidenceValues));

  rt.global().setProperty(rt, "__LinguaProxy", std::move(linguaModule));
}

} // namespace lingua
