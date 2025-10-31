package com.lingua

import android.util.Log

object JNIOnLoad {
  private const val TAG = "Lingua"
  private var isInitialized = false

  @Synchronized
  fun initializeNative() {
    if (isInitialized) return
    try {
      System.loadLibrary("lingua")
      isInitialized = true
    } catch (e: Throwable) {
      Log.e(TAG, "Failed to load lingua native library.", e)
      throw e
    }
  }
}
