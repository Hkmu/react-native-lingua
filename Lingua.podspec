require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Lingua"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/Hkmu/react-native-lingua/.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}", "cpp/**/*.{hpp,cpp,c,h}"
  s.private_header_files = "ios/**/*.h"
  s.vendored_frameworks = "ios/*.xcframework"

  # Build Rust library from source during pod install
  s.prepare_command = <<-CMD
    set -e
    
    # Check if Rust is installed
    if ! command -v cargo &> /dev/null; then
      echo "[ERROR] Rust is not installed."
      echo "Please install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
      exit 1
    fi
    
    # Check if iOS targets are installed
    if ! rustup target list --installed | grep -q "aarch64-apple-ios"; then
      echo "[ERROR] iOS Rust targets not installed."
      echo "Please run: rustup target add aarch64-apple-ios aarch64-apple-ios-sim"
      exit 1
    fi
    
    # Clean previous builds
    rm -rf rust/generated/liblingua_native.xcframework
    rm -rf ios/liblingua_native.xcframework
    
    # Build the xcframework
    cd rust
    make header
    
    # Build for iOS targets
    echo "[INFO] Building Rust library for iOS..."
    cargo build --release --target aarch64-apple-ios
    cargo build --release --target aarch64-apple-ios-sim
    
    # Create xcframework
    mkdir -p generated/include
    xcodebuild -create-xcframework \
      -library target/aarch64-apple-ios/release/liblingua_native.a \
      -headers generated/include \
      -library target/aarch64-apple-ios-sim/release/liblingua_native.a \
      -headers generated/include \
      -output generated/liblingua_native.xcframework
    
    # Copy to ios directory
    cp -rf generated/liblingua_native.xcframework ../ios/
    cp -f generated/include/liblingua.h ../cpp/
    
    echo "[SUCCESS] Rust library built successfully"
  CMD

  install_modules_dependencies(s)
end
