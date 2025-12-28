# Publishing to NPM

## Pre-requisites

Users who install this package need:

- Rust toolchain installed (`rustup`)
- `cargo-ndk` for Android builds (`cargo install cargo-ndk`)
- iOS/Android build targets added:
  ```bash
  rustup target add aarch64-apple-ios aarch64-apple-ios-sim
  rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
  ```

## How It Works

The Rust library and C header are built from source when users install the package:

- **iOS**: `pod install` runs `make header && make ios` (generates header first, then builds xcframework)
- **Android**: Gradle runs `buildRustHeader` task before native build (generates header, then builds libraries)
- **Header file**: `cpp/liblingua.h` is auto-generated during build and NOT committed to git

## Publishing

```bash
pnpm release
```

This will:

1. Bump version
2. Build TypeScript
3. Publish to NPM (includes Rust source code)
4. Create GitHub release

## Important Notes

1. **No pre-built binaries in NPM** - Library is built from source on user's machine
2. **No generated header in git** - `cpp/liblingua.h` is auto-generated, gitignored, and excluded from NPM
3. **Rust source is included** - The `rust/` directory is published to NPM
4. **Users need Rust toolchain** - Document this requirement in README
5. **First build takes time** - Rust compilation can take a few minutes
6. **Header always fresh** - Generated from Rust source during each build, no sync issues
