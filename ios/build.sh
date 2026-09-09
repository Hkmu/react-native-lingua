#!/bin/bash
set -e

# Setup path to rust/cargo
# Xcode doesn't load .zshrc/.bashrc, so we need to find cargo manually if not in PATH
CARGO_PATH="$HOME/.cargo/bin"

if [ ! -x "$CARGO_PATH/cargo" ]; then
    echo "error: Rust not found at $CARGO_PATH. Please install Rust: https://rustup.rs"
    exit 1
fi

# Move to rust directory
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
TOOLS_DIR="$SCRIPT_DIR/../rust"
cd "$TOOLS_DIR"

# Cargo artifacts go to a shared cache outside the package so that
# reinstalling or patching the npm dependency never strands gigabytes of
# build output inside node_modules. Override with the standard CARGO_TARGET_DIR.
CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$HOME/.cache/react-native-lingua/rust-target}"
export CARGO_TARGET_DIR

# Optional language subset (lingua feature names), e.g. LINGUA_LANGUAGES="english,chinese".
# Empty means all 75 languages.
FEATURE_ARGS=""
if [ -n "$LINGUA_LANGUAGES" ]; then
    FEATURE_ARGS="--no-default-features --features $LINGUA_LANGUAGES"
fi

echo "Building Rust library for ARCHS=$ARCHS PLATFORM_NAME=$PLATFORM_NAME"

# Find a reasonable PATH that doesn't include Xcode toolchain paths that might interfere
# We need: cargo, rustup, basic system utilities
CLEAN_PATH="/usr/bin:/bin:/usr/sbin:/sbin:$CARGO_PATH"

# Run cargo in a clean environment to avoid Xcode's iOS-targeted env vars
# affecting host build scripts (which need macOS SDK, not iOS SDK)
run_cargo() {
    env -i \
        HOME="$HOME" \
        PATH="$CLEAN_PATH" \
        USER="$USER" \
        TERM="${TERM:-xterm}" \
        RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}" \
        CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}" \
        CARGO_TARGET_DIR="$CARGO_TARGET_DIR" \
        "$CARGO_PATH/cargo" "$@"
}

run_rustup() {
    env -i \
        HOME="$HOME" \
        PATH="$CLEAN_PATH" \
        USER="$USER" \
        RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}" \
        CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}" \
        "$CARGO_PATH/rustup" "$@"
}

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
    run_rustup target add "$TARGET"

    # NOTE: $FEATURE_ARGS is intentionally unquoted (word splitting is wanted)
    run_cargo build --release --target "$TARGET" --lib $FEATURE_ARGS
    LIBS+=("$CARGO_TARGET_DIR/$TARGET/release/liblingua_native.a")
done

# Ensure header is generated and copied
HEADER_PATH="generated/include/liblingua.h"
# If header doesn't exist (maybe built fresh), force generation
if [ ! -f "$HEADER_PATH" ]; then
    echo "Header generated/include/liblingua.h missing, forcing generation..."
    mkdir -p generated/include
    # Force build.rs to run by updating mtime of main source
    touch src/lib.rs
    run_cargo build --lib $FEATURE_ARGS
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
