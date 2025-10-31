use lingua::{IsoCode639_1, Language, LanguageDetector, LanguageDetectorBuilder};
use std::ffi::{c_char, CStr, CString};
use std::os::raw::c_int;
use std::ptr;
use std::str::FromStr;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref GLOBAL_ERROR: Mutex<Option<String>> = Mutex::new(None);
}

// Error handling
// Helper function for internal use
unsafe fn set_error_internal(err: *mut *const c_char, error_message: &str) {
    let mut global_error = GLOBAL_ERROR.lock().unwrap();
    *global_error = Some(error_message.to_string());

    if !err.is_null() {
        // Point to the stored error string in GLOBAL_ERROR
        if let Some(ref error_str) = *global_error {
            *err = error_str.as_ptr() as *const c_char;
        }
    }
}

// Exported C function (not actually used, but needed for header generation)
#[no_mangle]
pub unsafe extern "C" fn set_error(err: *mut *const c_char, error_message: *const c_char) {
    if error_message.is_null() {
        return;
    }
    let c_str = CStr::from_ptr(error_message);
    if let Ok(s) = c_str.to_str() {
        set_error_internal(err, s);
    }
}

#[no_mangle]
pub extern "C" fn get_error() -> *const c_char {
    let global_error = GLOBAL_ERROR.lock().unwrap();
    match &*global_error {
        Some(err) => err.as_ptr() as *const c_char,
        None => ptr::null(),
    }
}

// LanguageDetector opaque pointer type
pub struct LinguaDetector {
    detector: LanguageDetector,
}

/// Creates a language detector with all languages
#[no_mangle]
pub extern "C" fn lingua_detector_create_all() -> *mut LinguaDetector {
    let detector = LanguageDetectorBuilder::from_all_languages().build();
    Box::into_raw(Box::new(LinguaDetector { detector }))
}

/// Creates a language detector with specific languages
/// languages: comma-separated ISO 639-1 codes (e.g., "en,fr,de,es")
#[no_mangle]
pub unsafe extern "C" fn lingua_detector_create_from_languages(
    languages: *const c_char,
    error: *mut *const c_char,
) -> *mut LinguaDetector {
    if languages.is_null() {
        set_error_internal(error, "languages parameter is null");
        return ptr::null_mut();
    }

    let c_str = CStr::from_ptr(languages);
    let lang_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => {
            set_error_internal(error, "Invalid UTF-8 in languages parameter");
            return ptr::null_mut();
        }
    };

    let lang_codes: Vec<&str> = lang_str.split(',').map(|s| s.trim()).collect();
    let mut selected_iso_codes = Vec::new();

    for code in lang_codes {
        let upper_code = code.to_uppercase();
        match IsoCode639_1::from_str(&upper_code) {
            Ok(iso_code) => selected_iso_codes.push(iso_code),
            Err(_) => {
                let error_msg = format!("Invalid language code: {}", code);
                set_error_internal(error, &error_msg);
                return ptr::null_mut();
            }
        }
    }

    if selected_iso_codes.is_empty() {
        set_error_internal(error, "No valid languages provided");
        return ptr::null_mut();
    }

    let detector = LanguageDetectorBuilder::from_iso_codes_639_1(&selected_iso_codes).build();
    Box::into_raw(Box::new(LinguaDetector { detector }))
}

/// Detects the language of the given text
/// Returns the ISO 639-1 code (e.g., "en") or null if detection failed
#[no_mangle]
pub unsafe extern "C" fn lingua_detect_language(
    detector: *const LinguaDetector,
    text: *const c_char,
    error: *mut *const c_char,
) -> *mut c_char {
    if detector.is_null() {
        set_error_internal(error, "detector is null");
        return ptr::null_mut();
    }

    if text.is_null() {
        set_error_internal(error, "text is null");
        return ptr::null_mut();
    }

    let detector = &(*detector).detector;
    let c_str = CStr::from_ptr(text);
    let text_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => {
            set_error_internal(error, "Invalid UTF-8 in text");
            return ptr::null_mut();
        }
    };

    match detector.detect_language_of(text_str) {
        Some(language) => {
            let iso_code = language.iso_code_639_1().to_string().to_lowercase();
            match CString::new(iso_code) {
                Ok(c_string) => c_string.into_raw(),
                Err(_) => {
                    set_error_internal(error, "Failed to create C string");
                    ptr::null_mut()
                }
            }
        }
        None => ptr::null_mut(),
    }
}

/// Computes the confidence value for a specific language
#[no_mangle]
pub unsafe extern "C" fn lingua_compute_language_confidence(
    detector: *const LinguaDetector,
    text: *const c_char,
    language_code: *const c_char,
    error: *mut *const c_char,
) -> f64 {
    if detector.is_null() || text.is_null() || language_code.is_null() {
        set_error_internal(error, "null parameter");
        return 0.0;
    }

    let detector = &(*detector).detector;
    let text_str = CStr::from_ptr(text).to_str().unwrap_or("");
    let lang_str = CStr::from_ptr(language_code).to_str().unwrap_or("");

    // Convert the ISO code string to a Language enum
    // We need to iterate through all possible languages and match
    let all_languages = Language::all();
    let language = all_languages
        .into_iter()
        .find(|lang| {
            lang.iso_code_639_1()
                .to_string()
                .eq_ignore_ascii_case(lang_str)
        })
        .unwrap_or_else(|| {
            set_error_internal(error, "Invalid language code");
            Language::English // Default fallback, but we return 0.0 anyway
        });

    if language == Language::English && !lang_str.eq_ignore_ascii_case("en") {
        return 0.0; // Error was already set
    }

    detector.compute_language_confidence(text_str, language)
}

/// Result structure for confidence values
#[repr(C)]
pub struct ConfidenceValue {
    pub language_code: *mut c_char,
    pub confidence: f64,
}

/// Computes confidence values for all languages
/// Returns an array of ConfidenceValue structs and sets the count
#[no_mangle]
pub unsafe extern "C" fn lingua_compute_language_confidence_values(
    detector: *const LinguaDetector,
    text: *const c_char,
    count: *mut c_int,
    error: *mut *const c_char,
) -> *mut ConfidenceValue {
    if detector.is_null() || text.is_null() || count.is_null() {
        set_error_internal(error, "null parameter");
        return ptr::null_mut();
    }

    let detector = &(*detector).detector;
    let text_str = match CStr::from_ptr(text).to_str() {
        Ok(s) => s,
        Err(_) => {
            set_error_internal(error, "Invalid UTF-8");
            return ptr::null_mut();
        }
    };

    let confidence_values = detector.compute_language_confidence_values(text_str);
    *count = confidence_values.len() as c_int;

    let mut results: Vec<ConfidenceValue> = Vec::with_capacity(confidence_values.len());

    for (language, confidence) in confidence_values {
        let iso_code = language.iso_code_639_1().to_string().to_lowercase();
        if let Ok(c_string) = CString::new(iso_code) {
            results.push(ConfidenceValue {
                language_code: c_string.into_raw(),
                confidence,
            });
        }
    }

    let ptr = results.as_mut_ptr();
    std::mem::forget(results);
    ptr
}

/// Frees a string allocated by lingua
#[no_mangle]
pub unsafe extern "C" fn lingua_free_string(s: *mut c_char) {
    if !s.is_null() {
        let _ = CString::from_raw(s);
    }
}

/// Frees the confidence values array
#[no_mangle]
pub unsafe extern "C" fn lingua_free_confidence_values(values: *mut ConfidenceValue, count: c_int) {
    if !values.is_null() {
        for i in 0..count {
            let value = &mut *values.offset(i as isize);
            if !value.language_code.is_null() {
                let _ = CString::from_raw(value.language_code);
            }
        }
        let _ = Vec::from_raw_parts(values, count as usize, count as usize);
    }
}

/// Destroys the detector and frees memory
#[no_mangle]
pub unsafe extern "C" fn lingua_detector_destroy(detector: *mut LinguaDetector) {
    if !detector.is_null() {
        let _ = Box::from_raw(detector);
    }
}
