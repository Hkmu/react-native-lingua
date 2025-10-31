# Quick Start

## Build the native libraries first:

```bash
# Navigate to Rust source directory
cd src

# Build for both iOS and Android
make all

# Or build individually:
# make ios      # For iOS only
# make android  # For Android only
```

## Then run the example:

```bash
cd example

# Install dependencies
pnpm install

# For iOS
cd ios && pod install && cd ..
pnpm ios

# For Android
pnpm android
```

## Required tools:

- Rust toolchain (rustup)
- cargo-ndk (for Android: `cargo install cargo-ndk`)
- Android NDK 26.1.10909125
- Xcode (for iOS)
- Node.js & pnpm

## Environment variables (for Android):

```bash
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/26.1.10909125
```

See [SETUP.md](SETUP.md) for detailed instructions.
