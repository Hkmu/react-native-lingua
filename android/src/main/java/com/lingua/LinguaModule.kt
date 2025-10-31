package com.lingua

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl

@DoNotStrip
@Keep
@OptIn(FrameworkAPI::class)
@Suppress("KotlinJniMissingFunction")
@ReactModule(name = LinguaModule.NAME)
class LinguaModule(reactContext: ReactApplicationContext) :
  NativeLinguaSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun install(): String? {
    try {
      // Get jsi::Runtime pointer
      val jsContext = reactApplicationContext.javaScriptContextHolder
        ?: return "ReactApplicationContext.javaScriptContextHolder is null!"

      // Get CallInvokerHolder
      val callInvokerHolder = reactApplicationContext.jsCallInvokerHolder as? CallInvokerHolderImpl
        ?: return "ReactApplicationContext.jsCallInvokerHolder is null!"

      installNativeJsi(jsContext.get(), callInvokerHolder)

      return null
    } catch (e: Throwable) {
      return e.message
    }
  }

  private external fun installNativeJsi(jsRuntimePointer: Long, callInvokerHolder: CallInvokerHolderImpl)

  companion object {
    const val NAME = "Lingua"

    init {
      JNIOnLoad.initializeNative()
    }
  }
}
