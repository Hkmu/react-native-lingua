#import "Lingua.h"
#import "../cpp/lingua.h"
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>

using namespace facebook;

@implementation Lingua {
  bool _didInstall;
  std::weak_ptr<react::CallInvoker> _callInvoker;
}

RCT_EXPORT_MODULE()

- (void)installJSIBindingsWithRuntime:(jsi::Runtime &)runtime {
  auto callInvoker = _callInvoker.lock();
  if (callInvoker == nullptr) {
    throw std::runtime_error("CallInvoker is missing");
  }

  lingua::install(runtime, callInvoker);
  _didInstall = true;
}

// This function triggers the initialization of the turbo module
- (NSString *)install {
  if (_didInstall) {
    return nil;
  } else {
    return @"JSI Bindings could not be installed!";
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  _callInvoker = params.jsInvoker;
  return std::make_shared<facebook::react::NativeLinguaSpecJSI>(params);
}

@end
