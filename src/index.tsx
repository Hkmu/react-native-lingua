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

// Options for creating a language detector
export type DetectorOptions = {
  /**
   * Minimum relative distance threshold (0.0 - 0.99).
   * When set, the detector requires that the top language candidate's confidence
   * be sufficiently higher than the second-best candidate. If the distance is
   * too small, detection returns null instead of a potentially wrong guess.
   * This helps with ambiguous text (e.g., short phrases in related languages).
   * Set to -1 or omit to disable (default behavior).
   */
  minimumRelativeDistance?: number;
};

// Internal proxy that gets injected by JSI
type LinguaProxy = {
  createDetectorForAllLanguages: (
    minRelativeDistance: number
  ) => LanguageDetector;
  createDetectorForLanguages: (
    languages: string,
    minRelativeDistance: number
  ) => LanguageDetector;
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
 * @param options Optional configuration for the detector
 */
export function createDetectorForAllLanguages(
  options?: DetectorOptions
): LanguageDetector {
  if (!proxy) {
    throw new Error('Lingua JSI proxy not available');
  }
  const minRelativeDistance = options?.minimumRelativeDistance ?? -1.0;
  return proxy.createDetectorForAllLanguages(minRelativeDistance);
}

/**
 * Creates a language detector for specific languages
 * @param languages Array of ISO 639-1 language codes (e.g., ['en', 'fr', 'de'])
 * @param options Optional configuration for the detector
 */
export function createDetectorForLanguages(
  languages: string[],
  options?: DetectorOptions
): LanguageDetector {
  if (!proxy) {
    throw new Error('Lingua JSI proxy not available');
  }
  const langString = languages.join(',');
  const minRelativeDistance = options?.minimumRelativeDistance ?? -1.0;
  return proxy.createDetectorForLanguages(langString, minRelativeDistance);
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
