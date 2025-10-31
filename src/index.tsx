import Lingua from './NativeLingua';

// Language Detector type
export type LanguageDetector = {
  __nativeState: unknown;
};

// Confidence value result
export type LanguageConfidence = {
  language: string;
  confidence: number;
};

// Internal proxy that gets injected by JSI
type LinguaProxy = {
  createDetectorForAllLanguages: () => LanguageDetector;
  createDetectorForLanguages: (languages: string) => LanguageDetector;
  detectLanguage: (detector: LanguageDetector, text: string) => string | null;
  computeLanguageConfidence: (
    detector: LanguageDetector,
    text: string,
    languageCode: string
  ) => number;
  computeLanguageConfidenceValues: (
    detector: LanguageDetector,
    text: string
  ) => LanguageConfidence[];
};

declare global {
  var __LinguaProxy: LinguaProxy | undefined;
}

// Install the JSI bindings
const errorMsg = Lingua.install();

if (errorMsg != null) {
  console.error(`Lingua could not be installed: ${errorMsg}`);
}

const proxy = globalThis.__LinguaProxy;

if (proxy == null) {
  console.error(
    'Lingua could not install JSI functions. Please check the native module implementation.'
  );
}

/**
 * Creates a language detector for all supported languages
 */
export function createDetectorForAllLanguages(): LanguageDetector {
  if (!proxy) {
    throw new Error('Lingua JSI proxy not available');
  }
  return proxy.createDetectorForAllLanguages();
}

/**
 * Creates a language detector for specific languages
 * @param languages Array of ISO 639-1 language codes (e.g., ['en', 'fr', 'de'])
 */
export function createDetectorForLanguages(
  languages: string[]
): LanguageDetector {
  if (!proxy) {
    throw new Error('Lingua JSI proxy not available');
  }
  const langString = languages.join(',');
  return proxy.createDetectorForLanguages(langString);
}

/**
 * Detects the language of the given text
 * @param detector Language detector instance
 * @param text Text to analyze
 * @returns ISO 639-1 language code (e.g., 'en') or null if detection failed
 */
export function detectLanguage(
  detector: LanguageDetector,
  text: string
): string | null {
  if (!proxy) {
    throw new Error('Lingua JSI proxy not available');
  }
  return proxy.detectLanguage(detector, text);
}

/**
 * Computes the confidence value for a specific language
 * @param detector Language detector instance
 * @param text Text to analyze
 * @param languageCode ISO 639-1 language code (e.g., 'en')
 * @returns Confidence value between 0.0 and 1.0
 */
export function computeLanguageConfidence(
  detector: LanguageDetector,
  text: string,
  languageCode: string
): number {
  if (!proxy) {
    throw new Error('Lingua JSI proxy not available');
  }
  return proxy.computeLanguageConfidence(detector, text, languageCode);
}

/**
 * Computes confidence values for all languages
 * @param detector Language detector instance
 * @param text Text to analyze
 * @returns Array of language confidence values, sorted by confidence (descending)
 */
export function computeLanguageConfidenceValues(
  detector: LanguageDetector,
  text: string
): LanguageConfidence[] {
  if (!proxy) {
    throw new Error('Lingua JSI proxy not available');
  }
  return proxy.computeLanguageConfidenceValues(detector, text);
}
