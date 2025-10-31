#include "lingua.h"
#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <typeinfo>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
namespace jni = facebook::jni;

// This file uses fbjni for cleaner JNI bindings
struct LinguaModule : jni::JavaClass<LinguaModule> {
  static constexpr auto kJavaDescriptor = "Lcom/lingua/LinguaModule;";

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("installNativeJsi", LinguaModule::installNativeJsi),
    });
  }

private:
  static void
  installNativeJsi(jni::alias_ref<jni::JObject> thiz, jlong jsiRuntimePtr,
                   jni::alias_ref<react::CallInvokerHolder::javaobject>
                       jsCallInvokerHolder) {
    auto jsiRuntime = reinterpret_cast<jsi::Runtime *>(jsiRuntimePtr);
    auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();

    lingua::install(*jsiRuntime, jsCallInvoker);
  }
};

JNIEXPORT jint JNI_OnLoad(JavaVM *vm, void *) {
  return jni::initialize(vm, [] { LinguaModule::registerNatives(); });
}
