# react-native-lingua

An accurate natural language detection library for React Native, powered by [lingua-rs](https://github.com/pemistahl/lingua-rs).

## Features

- 🎯 **Highly Accurate**: Uses advanced n-gram models (1-5) for superior detection accuracy
- 📦 **75 Languages**: Supports detection of 75 languages
- ⚡ **Fast**: Built with Rust and JSI for optimal performance
- 🔒 **Type-Safe**: Full TypeScript support
- 📱 **Cross-Platform**: Works on iOS and Android
- 🌐 **Offline**: No internet connection required

## Installation

```sh
pnpm add react-native-lingua
# or
npm install react-native-lingua
```

or

```sh
yarn add react-native-lingua
```

### iOS

```sh
cd ios && pod install
```

### Android

No additional steps required. The native module will be built automatically.

## Building the Native Module

Before using the library, you need to build the Rust native module:

### Prerequisites

1. Install Rust toolchain:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Install required tools:

```sh
# For iOS builds
cargo install cargo-lipo

# For Android builds
cargo install cargo-ndk
```

3. Install Android NDK (for Android builds):
   - Set `ANDROID_SDK_ROOT`, `ANDROID_HOME`, and `ANDROID_NDK_HOME` environment variables
   - Recommended NDK version: 26.1.10909125

### Build Commands

```sh
cd src

# Build for iOS
make ios

# Build for Android
make android

# Build for both platforms
make all
```

## Usage

### Basic Language Detection

```typescript
import {
  createDetectorForAllLanguages,
  createDetectorForLanguages,
  detectLanguage,
} from 'react-native-lingua';

// Create a detector for all supported languages
const detector = createDetectorForAllLanguages();

// Detect language
const language = detectLanguage(detector, 'Hello, how are you?');
console.log(language); // 'en'

// Or create a detector for specific languages (faster and more accurate)
const specificDetector = createDetectorForLanguages(['en', 'fr', 'de', 'es']);
const lang = detectLanguage(specificDetector, 'Bonjour le monde');
console.log(lang); // 'fr'
```

### Language Confidence

Get confidence scores to understand how certain the detection is:

```typescript
import {
  createDetectorForLanguages,
  computeLanguageConfidence,
  computeLanguageConfidenceValues,
} from 'react-native-lingua';

const detector = createDetectorForLanguages(['en', 'fr', 'de', 'es']);

// Get confidence for a specific language
const confidence = computeLanguageConfidence(detector, 'Hello world', 'en');
console.log(confidence); // 0.95

// Get confidence values for all languages
const confidences = computeLanguageConfidenceValues(detector, 'Hello world');

console.log(confidences);
// [
//   { language: 'en', confidence: 0.95 },
//   { language: 'fr', confidence: 0.03 },
//   { language: 'de', confidence: 0.01 },
//   { language: 'es', confidence: 0.01 }
// ]
```

### Supported Languages

The library supports 75 languages using ISO 639-1 codes. Some examples:

```typescript
const commonLanguages = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'ru', // Russian
  'ja', // Japanese
  'zh', // Chinese
  'ko', // Korean
  'ar', // Arabic
  'hi', // Hindi
  // ... and 63 more
];
```

For a complete list of supported languages, see the [lingua-rs documentation](https://docs.rs/lingua/latest/lingua/enum.Language.html).

## API Reference

### `createDetectorForAllLanguages()`

Creates a language detector that can detect any of the 75 supported languages.

**Returns:** `LanguageDetector`

**Note:** Loading all languages consumes significant memory (~1 GB). Consider using `createDetectorForLanguages()` if you know which languages to expect.

### `createDetectorForLanguages(languages: string[])`

Creates a language detector for specific languages.

**Parameters:**

- `languages: string[]` - Array of ISO 639-1 language codes

**Returns:** `LanguageDetector`

**Example:**

```typescript
const detector = createDetectorForLanguages(['en', 'fr', 'de']);
```

### `detectLanguage(detector: LanguageDetector, text: string)`

Detects the language of the given text.

**Parameters:**

- `detector: LanguageDetector` - Language detector instance
- `text: string` - Text to analyze

**Returns:** `string | null` - ISO 639-1 language code or null if detection failed

**Example:**

```typescript
const lang = detectLanguage(detector, 'Hello world'); // 'en'
```

### `computeLanguageConfidence(detector: LanguageDetector, text: string, languageCode: string)`

Computes the confidence value for a specific language.

**Parameters:**

- `detector: LanguageDetector` - Language detector instance
- `text: string` - Text to analyze
- `languageCode: string` - ISO 639-1 language code

**Returns:** `number` - Confidence value between 0.0 and 1.0

**Example:**

```typescript
const confidence = computeLanguageConfidence(detector, 'Hello world', 'en'); // 0.95
```

### `computeLanguageConfidenceValues(detector: LanguageDetector, text: string)`

Computes confidence values for all languages in the detector.

**Parameters:**

- `detector: LanguageDetector` - Language detector instance
- `text: string` - Text to analyze

**Returns:** `LanguageConfidence[]` - Array of `{ language: string, confidence: number }` sorted by confidence (descending)

**Example:**

```typescript
const confidences = computeLanguageConfidenceValues(detector, 'Hello');
// [{ language: 'en', confidence: 0.95 }, ...]
```

## Performance Tips

1. **Use specific languages**: Create detectors with only the languages you need for better performance and accuracy
2. **Reuse detectors**: Create detector instances once and reuse them
3. **Memory usage**: The detector with all languages uses ~1 GB of memory. Use specific language sets to reduce memory footprint

## How It Works

This library wraps the Rust [lingua-rs](https://github.com/pemistahl/lingua-rs) library using:

1. **Rust FFI**: C-compatible FFI bindings for the lingua library
2. **C++ JSI**: JavaScript Interface for direct communication with JavaScript
3. **React Native TurboModule**: Modern architecture for optimal performance

The detection uses both rule-based and statistical Naive Bayes methods with n-grams of sizes 1-5, providing high accuracy even for short text snippets.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
