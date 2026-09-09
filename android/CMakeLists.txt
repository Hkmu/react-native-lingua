cmake_minimum_required(VERSION 3.9.0)
project(lingua)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Find all C++ files
file(GLOB_RECURSE cpp_files RELATIVE ${CMAKE_SOURCE_DIR}
  "../cpp/**.cpp"
  "../cpp/**.h"
)

add_library(${CMAKE_PROJECT_NAME} SHARED
  ${cpp_files}
  cpp-adapter.cpp
)

# Specifies a path to native header files
include_directories(
  ../cpp
  ../rust/generated/include
)

# Link the lingua_native static library.
# LINGUA_LIB_DIR is passed by build.gradle pointing outside the npm package;
# the in-package jniLibs/ directory remains the default for manual builds.
set(LINGUA_LIB_DIR "${CMAKE_CURRENT_SOURCE_DIR}/jni" CACHE PATH "Directory containing per-ABI liblingua_native.a")
cmake_path(SET LINGUA_LIB_PATH ${LINGUA_LIB_DIR}/${ANDROID_ABI}/liblingua_native.a NORMALIZE)
add_library(lingua_native STATIC IMPORTED)
set_target_properties(lingua_native PROPERTIES IMPORTED_LOCATION ${LINGUA_LIB_PATH})

target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src/main/jni/include)

find_library(LOG_LIB log)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
  target_link_libraries(
    ${CMAKE_PROJECT_NAME}
    lingua_native
    ${LOG_LIB}
    ReactAndroid::reactnative
    ReactAndroid::jsi
    fbjni::fbjni
  )
else()
  target_link_libraries(
    ${CMAKE_PROJECT_NAME}
    ${LOG_LIB}
    lingua_native
    fbjni::fbjni
    ReactAndroid::jsi
    ReactAndroid::turbomodulejsijni
    ReactAndroid::react_nativemodule_core
    android
  )
endif()
