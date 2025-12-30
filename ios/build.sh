#!/bin/bash
set -e

# Setup path to rust/cargo
# Xcode doesn't load .zshrc/.bashrc, so we need to find cargo manually if not in PATH
export PATH="$HOME/.cargo/bin:$PATH"

if ! command -v cargo &> /dev/null; then
    echo "error: Rust not found. Please install Rust: https://rustup.rs"
    exit 1
fi

# Move to rust directory
TOOLS_DIR=$(cd "$(dirname "$0")/../rust" && pwd)
cd "$TOOLS_DIR"

echo "Building Rust library for ARCHS=$ARCHS PLATFORM_NAME=$PLATFORM_NAME"

LIBS=()

for ARCH in $ARCHS; do
    TARGET=""
    if [ "$PLATFORM_NAME" == "iphoneos" ]; then
        if [ "$ARCH" == "arm64" ]; then
            TARGET="aarch64-apple-ios"
        fi
    elif [ "$PLATFORM_NAME" == "iphonesimulator" ]; then
        if [ "$ARCH" == "arm64" ]; then
            TARGET="aarch64-apple-ios-sim"
        elif [ "$ARCH" == "x86_64" ]; then
            TARGET="x86_64-apple-ios"
        fi
    fi

    if [ -z "$TARGET" ]; then
        echo "warning: Unknown arch $ARCH for platform $PLATFORM_NAME, skipping"
        continue
    fi

    echo "Building for $TARGET"
    # Ensure target is added
    rustup target add "$TARGET"

    cargo build --release --target "$TARGET" --lib
    LIBS+=("target/$TARGET/release/liblingua_native.a")
done

# Ensure header is generated and copied
HEADER_PATH="generated/include/liblingua.h"
# If header doesn't exist (maybe built fresh), force generation
if [ ! -f "$HEADER_PATH" ]; then
    echo "Header generated/include/liblingua.h missing, forcing generation..."
    mkdir -p generated/include
    # Force build.rs to run by updating mtime of main source
    touch src/lib.rs
    cargo build --lib
fi

echo "Copying header to cpp/"
cp -f "$HEADER_PATH" "../cpp/liblingua.h"

# Link with Lipo
mkdir -p "../ios/build"
OUTPUT_LIB="../ios/build/liblingua_native.a"
rm -f "$OUTPUT_LIB"

if [ ${#LIBS[@]} -eq 0 ]; then
    echo "error: No libraries built for ARCHS=$ARCHS"
    exit 1
fi

echo "Creating universal library at $OUTPUT_LIB from ${LIBS[@]}"
lipo -create "${LIBS[@]}" -output "$OUTPUT_LIB"
