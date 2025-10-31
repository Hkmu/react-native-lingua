# React Native Lingua Setup Guide

This guide walks you through building and using the react-native-lingua library.

## Prerequisites

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install Cargo Tools

```bash
# For Android builds
cargo install cargo-ndk

# For iOS builds (only needed on macOS)
# cargo-lipo is deprecated, we use direct cargo build instead
```

### 3. Android Setup (if building for Android)

Set the following environment variables in your `~/.zshrc` or `~/.bash_profile`:

```bash
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/26.1.10909125
```

Then reload your shell: `source ~/.zshrc`

## Building the Native Libraries

Navigate to the `src` directory:

```bash
cd src
```

### Build for iOS

```bash
make ios
```

This will:
1. Build the Rust library for iOS architectures (aarch64-apple-ios, aarch64-apple-ios-sim)
2. Generate C headers using cbindgen
3. Create an xcframework
4. Copy it to the ios/ directory

### Build for Android

```bash
make android
```

This will:
1. Build the Rust library for Android architectures (arm64-v8a, armeabi-v7a, x86, x86_64)
2. Generate C headers
3. Copy libraries to android/jniLibs/
4. Copy headers to android/src/main/jni/include/

### Build for Both Platforms

```bash
make all
```

## Installing in Your React Native Project

### iOS

```bash
cd example/ios
pod install
```

### Android

No additional steps - Gradle will build the native module automatically.

## Running the Example

```bash
cd example
pnpm install

# For iOS
pnpm ios

# For Android
pnpm android
```

## Architecture Overview

```
react-native-lingua/
├── src/                    # Rust source
│   ├── Cargo.toml         # Rust dependencies (lingua 1.7.2)
│   ├── build.rs           # Build script (cbindgen)
│   ├── Makefile           # Build automation
│   └── src/
│       └── lib.rs         # Rust FFI bindings
├── cpp/                    # C++ JSI layer
│   ├── lingua.h
│   ├── lingua.cpp         # JSI bindings
│   └── macros.h
├── ios/                    # iOS native code
│   ├── Lingua.h
│   ├── Lingua.mm          # Obj-C++ bridge
│   └── *.xcframework      # Built Rust library
├── android/                # Android native code
│   ├── CMakeLists.txt     # CMake build config
│   ├── cpp-adapter.cpp    # JNI bridge
│   ├── jniLibs/           # Built Rust libraries
│   └── src/main/java/
│       └── com/lingua/
│           ├── LinguaModule.kt
│           ├── LinguaPackage.kt
│           └── JNIOnLoad.kt
└── src/                    # JavaScript/TypeScript API
    ├── index.tsx
    └── NativeLingua.ts
```

## Data Flow

1. **JavaScript → TypeScript API** (`src/index.tsx`)
2. **TypeScript → JSI Proxy** (via `global.__LinguaProxy`)
3. **JSI → C++ Layer** (`cpp/lingua.cpp`)
4. **C++ → Rust FFI** (`src/src/lib.rs`)
5. **Rust → lingua-rs** (Rust library)

## Troubleshooting

### Build Errors

If you get Rust compilation errors:
```bash
cd src
cargo clean
cargo check
```

### iOS Build Issues

If xcframework is not found:
```bash
cd src
make clean
make ios
cd ../example/ios
pod install
```

### Android Build Issues

If native libraries are missing:
```bash
cd src
make clean
make android
cd ../example/android
./gradlew clean
```

### Memory Issues

The lingua library with all languages uses ~1 GB of memory. For production use, create detectors with only the languages you need:

```typescript
// Instead of this:
const detector = createDetectorForAllLanguages();

// Use this:
const detector = createDetectorForLanguages(['en', 'fr', 'de', 'es']);
```

## Testing

You can test the language detection in the example app:

```typescript
import {
  createDetectorForLanguages,
  detectLanguage,
} from 'react-native-lingua';

const detector = createDetectorForLanguages(['en', 'fr', 'de', 'es']);

const testTexts = [
  'Hello, how are you?',                    // en
  'Bonjour, comment allez-vous?',          // fr
  'Hallo, wie geht es dir?',               // de
  'Hola, ¿cómo estás?',                    // es
];

testTexts.forEach(text => {
  const lang = detectLanguage(detector, text);
  console.log(`"${text}" => ${lang}`);
});
```

## Next Steps

1. Build the native libraries (`cd src && make all`)
2. Install dependencies (`cd example && pnpm install`)
3. Install iOS pods (`cd example/ios && pod install`)
4. Run the example app (`pnpm ios` or `pnpm android`)
5. Integrate into your own React Native project!

## Support

For issues or questions:
- Check the [README.md](README.md) for API documentation
- Review the [lingua-rs documentation](https://docs.rs/lingua/latest/lingua/)
- Open an issue on GitHub
