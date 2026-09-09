COMMA := ,

# Cargo artifacts go to a shared cache outside the package so that
# reinstalling or patching the npm dependency never strands gigabytes of
# build output inside node_modules. Override with the standard
# CARGO_TARGET_DIR if you prefer another location.
ifeq ($(OS),Windows_NT)
ifdef LOCALAPPDATA
CARGO_TARGET_DIR ?= $(LOCALAPPDATA)/react-native-lingua/rust-target
else
CARGO_TARGET_DIR ?= $(USERPROFILE)/react-native-lingua/rust-target
endif
else
CARGO_TARGET_DIR ?= $(HOME)/.cache/react-native-lingua/rust-target
endif
export CARGO_TARGET_DIR

# Android static libs are copied here for CMake to link against. Gradle
# passes -DLINGUA_LIB_DIR pointing at the same location.
JNI_LIB_DIR ?= $(CARGO_TARGET_DIR)/jni

# Android triples to build. Gradle passes the app's reactNativeArchitectures
# (mapped to triples); the default covers arm64 devices and x86_64 emulators.
ANDROID_ABIS ?= aarch64-linux-android x86_64-linux-android

# Optional comma-separated language subset, e.g. LINGUA_LANGUAGES=english,chinese
# (lingua feature names). Empty means all 75 languages.
ifneq ($(strip $(LINGUA_LANGUAGES)),)
CARGO_FEATURES = --no-default-features --features $(LINGUA_LANGUAGES)
endif

ARCHS_IOS = aarch64-apple-ios aarch64-apple-ios-sim
LIB_FILE = liblingua_native.a
XCFRAMEWORK = liblingua_native.xcframework

all: ios android

# Generate header only (fast, for development)
header:
	mkdir -p generated/include
	cargo build --lib $(CARGO_FEATURES)
	cp -f generated/include/liblingua.h ../cpp/
	@echo "✅ Header generated and copied to cpp/"

ios: clean header ios-build package-xcframework copy-ios notify

android: header android-build copy-android notify

notify:
	@echo "🟢 Build Completed!"

lint:
	cargo clippy --all-features --all-targets -- --no-deps -D warnings

fix:
	cargo clippy --all-targets --all-features --fix --allow-dirty --allow-staged
	cargo fmt --all

clean:
	rm -rf generated/$(XCFRAMEWORK)
	rm -rf ../ios/$(XCFRAMEWORK)

# Also remove cargo artifacts: target/ is the legacy in-package location,
# cargo clean follows CARGO_TARGET_DIR (the redirected cache).
clean-all: clean
	rm -rf target
	cargo clean

# iOS Build

.PHONY: $(ARCHS_IOS)
$(ARCHS_IOS): %:
	cargo build --target $@ --release $(CARGO_FEATURES)

package-xcframework: $(ARCHS_IOS)
	mkdir -p generated/include
	xcodebuild -create-xcframework \
		-library $(CARGO_TARGET_DIR)/aarch64-apple-ios/release/$(LIB_FILE) \
		-headers generated/include \
		-library $(CARGO_TARGET_DIR)/aarch64-apple-ios-sim/release/$(LIB_FILE) \
		-headers generated/include \
		-output generated/$(XCFRAMEWORK)

copy-ios:
	cp -rf generated/*.xcframework ../ios
	cp -f generated/include/liblingua.h ../cpp/
	@echo "✅ iOS xcframework and headers copied"

ios-build:
	cargo build --release --target aarch64-apple-ios $(CARGO_FEATURES)
	cargo build --release --target aarch64-apple-ios-sim $(CARGO_FEATURES)

# Android Build

.PHONY: $(ANDROID_ABIS)
$(ANDROID_ABIS): %:
	cargo ndk --target $@ --platform 31 build --release $(CARGO_FEATURES)

android-build: $(ANDROID_ABIS)

copy-android:
	# Copy header
	mkdir -p ../android/src/main/jni/include
	cp -rf generated/include/* ../android/src/main/jni/include
	# Copy the static lib per ABI for CMake to link
	for triple in $(ANDROID_ABIS); do \
		case $$triple in \
			aarch64-linux-android) abi=arm64-v8a ;; \
			armv7-linux-androideabi) abi=armeabi-v7a ;; \
			i686-linux-android) abi=x86 ;; \
			x86_64-linux-android) abi=x86_64 ;; \
			*) echo "unknown android triple: $$triple"; exit 1 ;; \
		esac; \
		mkdir -p $(JNI_LIB_DIR)/$$abi; \
		cp -f $(CARGO_TARGET_DIR)/$$triple/release/$(LIB_FILE) $(JNI_LIB_DIR)/$$abi/ ; \
	done
	@echo "✅ Android libraries copied"

.PHONY: all ios android clean clean-all notify lint fix ios-build android-build copy-ios copy-android package-xcframework header
