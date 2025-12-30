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

  # The static library is built by the script_phase below
  s.vendored_libraries = "ios/build/liblingua_native.a"

  s.script_phase = {
    :name => 'Build Rust Library',
    :script => 'bash "${PODS_TARGET_SRCROOT}/ios/build.sh"',
    :execution_position => :before_compile,
    :input_files => ['${PODS_TARGET_SRCROOT}/rust/src/**/*.rs', '${PODS_TARGET_SRCROOT}/rust/Cargo.toml'],
    :output_files => ['${PODS_TARGET_SRCROOT}/ios/build/liblingua_native.a', '${PODS_TARGET_SRCROOT}/cpp/liblingua.h']
  }

  install_modules_dependencies(s)
end
