ARCHS_IOS = aarch64-apple-ios aarch64-apple-ios-sim
ARCHS_ANDROID = aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
LIB_FILE = liblingua_native.a
DYLIB = liblingua_native.so
XCFRAMEWORK = liblingua_native.xcframework

all: ios android

# Generate header only (fast, for development)
header:
	mkdir -p generated/include
	cargo build --lib
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

# iOS Build

.PHONY: $(ARCHS_IOS)
$(ARCHS_IOS): %:
	cargo build --target $@ --release

package-xcframework: $(ARCHS_IOS)
	mkdir -p generated/include
	xcodebuild -create-xcframework \
		-library target/aarch64-apple-ios/release/$(LIB_FILE) \
		-headers generated/include \
		-library target/aarch64-apple-ios-sim/release/$(LIB_FILE) \
		-headers generated/include \
		-output generated/$(XCFRAMEWORK)

copy-ios:
	cp -rf generated/*.xcframework ../ios
	cp -f generated/include/liblingua.h ../cpp/
	@echo "✅ iOS xcframework and headers copied"

ios-build:
	cargo build --release --target aarch64-apple-ios
	cargo build --release --target aarch64-apple-ios-sim

# Android Build

.PHONY: $(ARCHS_ANDROID)
$(ARCHS_ANDROID): %:
	cargo ndk --target $@ --platform 31 build --release

android-build:
	cargo ndk --target aarch64-linux-android --platform 31 build --release
	cargo ndk --target armv7-linux-androideabi --platform 31 build --release
	cargo ndk --target i686-linux-android --platform 31 build --release
	cargo ndk --target x86_64-linux-android --platform 31 build --release

copy-android:
	# Copy header
	mkdir -p ../android/src/main/jni/include
	cp -rf generated/include/* ../android/src/main/jni/include
	# Copy per architecture generated .a files
	mkdir -p ../android/jniLibs/x86
	cp target/i686-linux-android/release/$(LIB_FILE) ../android/jniLibs/x86

	mkdir -p ../android/jniLibs/x86_64
	cp target/x86_64-linux-android/release/$(LIB_FILE) ../android/jniLibs/x86_64

	mkdir -p ../android/jniLibs/armeabi-v7a
	cp target/armv7-linux-androideabi/release/$(LIB_FILE) ../android/jniLibs/armeabi-v7a

	mkdir -p ../android/jniLibs/arm64-v8a
	cp target/aarch64-linux-android/release/$(LIB_FILE) ../android/jniLibs/arm64-v8a
	@echo "✅ Android libraries copied"

.PHONY: all ios android clean notify lint fix ios-build android-build copy-ios copy-android package-xcframework header
