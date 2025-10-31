import { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import {
  createDetectorForLanguages,
  detectLanguage,
  computeLanguageConfidenceValues,
  type LanguageDetector,
  type LanguageConfidence,
} from 'react-native-lingua';

const SAMPLE_TEXTS = [
  { text: 'Hello, how are you today?', expected: 'en' },
  { text: 'Bonjour, comment allez-vous?', expected: 'fr' },
  { text: 'Hola, ¿cómo estás?', expected: 'es' },
  { text: 'Hallo, wie geht es dir?', expected: 'de' },
  { text: 'Ciao, come stai?', expected: 'it' },
  { text: 'Olá, como você está?', expected: 'pt' },
  { text: 'Привет, как дела?', expected: 'ru' },
  { text: 'こんにちは、元気ですか？', expected: 'ja' },
  { text: '你好，你好吗？', expected: 'zh' },
  { text: '안녕하세요, 잘 지내세요?', expected: 'ko' },
];

const COMMON_LANGUAGES = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ru',
  'ja',
  'zh',
  'ko',
  'ar',
  'hi',
  'nl',
  'sv',
  'nb', // Norwegian Bokmål (not 'no')
  'da',
  'fi',
  'pl',
  'tr',
  'he',
];

export default function App() {
  const [detector, setDetector] = useState<LanguageDetector | null>(null);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [confidences, setConfidences] = useState<LanguageConfidence[]>([]);
  const [testResults, setTestResults] = useState<
    Array<{
      text: string;
      detected: string | null;
      expected: string;
      correct: boolean;
    }>
  >([]);

  useEffect(() => {
    initializeDetector();
  }, []);

  const initializeDetector = async () => {
    try {
      console.log('Creating language detector...');
      const det = createDetectorForLanguages(COMMON_LANGUAGES);
      setDetector(det);
      console.log('Language detector created successfully');
      setLoading(false);
    } catch (error) {
      console.error('Failed to create detector:', error);
      setLoading(false);
    }
  };

  const handleDetectLanguage = () => {
    if (!detector || !customText.trim()) return;

    try {
      const lang = detectLanguage(detector, customText);
      setDetectedLanguage(lang);

      const conf = computeLanguageConfidenceValues(detector, customText);
      setConfidences(conf.slice(0, 5));
    } catch (error) {
      console.error('Detection error:', error);
    }
  };

  const runAllTests = () => {
    if (!detector) return;

    const results = SAMPLE_TEXTS.map((sample) => {
      const detected = detectLanguage(detector, sample.text);
      return {
        text: sample.text,
        detected,
        expected: sample.expected,
        correct: detected === sample.expected,
      };
    });

    setTestResults(results);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Initializing language detector...
        </Text>
      </SafeAreaView>
    );
  }

  if (!detector) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Failed to initialize detector</Text>
      </SafeAreaView>
    );
  }

  const passedTests = testResults.filter((r) => r.correct).length;
  const totalTests = testResults.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>🌍 Lingua Language Detector</Text>
        <Text style={styles.subtitle}>
          Supports {COMMON_LANGUAGES.length} languages
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Try It Out</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter text in any language..."
            value={customText}
            onChangeText={setCustomText}
            multiline
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleDetectLanguage}
            disabled={!customText.trim()}
          >
            <Text style={styles.buttonText}>Detect Language</Text>
          </TouchableOpacity>

          {detectedLanguage && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Detected Language:</Text>
              <Text style={styles.resultValue}>
                {detectedLanguage.toUpperCase()}
              </Text>
            </View>
          )}

          {confidences.length > 0 && (
            <View style={styles.confidenceBox}>
              <Text style={styles.confidenceTitle}>Confidence Scores:</Text>
              {confidences.map((conf, idx) => (
                <View key={idx} style={styles.confidenceRow}>
                  <Text style={styles.confidenceLang}>
                    {conf.language.toUpperCase()}
                  </Text>
                  <View style={styles.confidenceBarContainer}>
                    <View
                      style={[
                        styles.confidenceBar,
                        { width: `${conf.confidence * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceValue}>
                    {(conf.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automated Tests</Text>
          <TouchableOpacity style={styles.button} onPress={runAllTests}>
            <Text style={styles.buttonText}>Run All Tests</Text>
          </TouchableOpacity>

          {testResults.length > 0 && (
            <>
              <View style={styles.testSummary}>
                <Text style={styles.testSummaryText}>
                  Passed: {passedTests} / {totalTests} (
                  {((passedTests / totalTests) * 100).toFixed(0)}%)
                </Text>
              </View>

              {testResults.map((result, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.testResult,
                    result.correct ? styles.testPass : styles.testFail,
                  ]}
                >
                  <Text style={styles.testText} numberOfLines={1}>
                    {result.text}
                  </Text>
                  <View style={styles.testDetails}>
                    <Text style={styles.testLabel}>
                      Expected: {result.expected.toUpperCase()}
                    </Text>
                    <Text style={styles.testLabel}>
                      Got: {result.detected?.toUpperCase() || 'null'}
                    </Text>
                    <Text
                      style={[
                        styles.testStatus,
                        result.correct ? styles.statusPass : styles.statusFail,
                      ]}
                    >
                      {result.correct ? '✓ PASS' : '✗ FAIL'}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by lingua-rs • {COMMON_LANGUAGES.length} languages
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  confidenceBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  confidenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLang: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  confidenceBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  confidenceValue: {
    width: 50,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  testSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 12,
  },
  testSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    textAlign: 'center',
  },
  testResult: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  testPass: {
    backgroundColor: '#f1f8f4',
    borderColor: '#4caf50',
  },
  testFail: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  testText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testLabel: {
    fontSize: 12,
    color: '#666',
  },
  testStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusPass: {
    color: '#4caf50',
  },
  statusFail: {
    color: '#f44336',
  },
  footer: {
    marginTop: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
});
