/**
 * Non-AI translation logic using static dictionary
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * This provides translations without any AI/LLM calls
 */

import { 
  FULL_DICTIONARY_HE_EN, 
  FULL_DICTIONARY_EN_HE,
  DICTIONARY_STATS 
} from './translation-dictionary.ts';

// ============================================
// Types
// ============================================

export interface TranslationResult {
  original: string;
  translated: string;
  coverage: number; // Percentage of text that was translated
  untranslated_words: string[]; // Words that weren't in dictionary
  word_count: number;
  translated_word_count: number;
}

export interface BatchTranslationResult {
  results: TranslationResult[];
  total_coverage: number;
  dictionary_stats: typeof DICTIONARY_STATS;
}

// ============================================
// Core Translation Logic
// ============================================

/**
 * Hebrew prefixes that can attach to words
 * These are common prepositions/conjunctions that attach as prefixes
 */
const HEBREW_PREFIXES: Record<string, string> = {
  'ב': 'in ',
  'ה': 'the ',
  'ו': 'and ',
  'ל': 'to ',
  'מ': 'from ',
  'כ': 'like ',
  'ש': 'that ',
};

/**
 * Try to translate a word by stripping Hebrew prefixes
 */
function translateWithPrefixHandling(word: string): { translated: string; matched: boolean } {
  // First try direct match
  if (FULL_DICTIONARY_HE_EN[word]) {
    return { translated: FULL_DICTIONARY_HE_EN[word], matched: true };
  }
  
  // Try stripping one prefix
  if (word.length > 2) {
    const firstChar = word[0];
    const rest = word.slice(1);
    
    if (HEBREW_PREFIXES[firstChar] && FULL_DICTIONARY_HE_EN[rest]) {
      return { 
        translated: HEBREW_PREFIXES[firstChar] + FULL_DICTIONARY_HE_EN[rest], 
        matched: true 
      };
    }
    
    // Try stripping two prefixes (e.g., "וב" = "and in")
    if (word.length > 3) {
      const secondChar = word[1];
      const restAfterTwo = word.slice(2);
      
      if (HEBREW_PREFIXES[firstChar] && HEBREW_PREFIXES[secondChar] && FULL_DICTIONARY_HE_EN[restAfterTwo]) {
        return {
          translated: HEBREW_PREFIXES[firstChar] + HEBREW_PREFIXES[secondChar] + FULL_DICTIONARY_HE_EN[restAfterTwo],
          matched: true
        };
      }
    }
  }
  
  return { translated: word, matched: false };
}

/**
 * Translate Hebrew text to English using dictionary
 */
export function translateHebrewToEnglish(text: string): TranslationResult {
  if (!text || text.trim() === '') {
    return {
      original: text,
      translated: text,
      coverage: 100,
      untranslated_words: [],
      word_count: 0,
      translated_word_count: 0,
    };
  }

  let translated = text;
  let matchedLength = 0;
  const untranslated: Set<string> = new Set();
  
  // Sort keys by length (longest first) to prevent partial matches
  const sortedKeys = Object.keys(FULL_DICTIONARY_HE_EN)
    .sort((a, b) => b.length - a.length);
  
  // Track which parts of the text have been translated
  const translatedRanges: Array<{ start: number; end: number }> = [];
  
  // First pass: replace multi-word phrases (longest first)
  for (const hebrewTerm of sortedKeys) {
    const englishTerm = FULL_DICTIONARY_HE_EN[hebrewTerm];
    
    // Create regex that matches whole words (with Hebrew word boundaries)
    const regex = new RegExp(
      `(^|[\\s,.:;!?()\\[\\]{}])${escapeRegex(hebrewTerm)}($|[\\s,.:;!?()\\[\\]{}])`,
      'g'
    );
    
    let match;
    while ((match = regex.exec(translated)) !== null) {
      const start = match.index + match[1].length;
      const end = start + hebrewTerm.length;
      
      // Check if this range overlaps with already translated text
      const overlaps = translatedRanges.some(
        range => !(end <= range.start || start >= range.end)
      );
      
      if (!overlaps) {
        translatedRanges.push({ start, end });
        matchedLength += hebrewTerm.length;
      }
    }
    
    // Perform the replacement
    translated = translated.replace(regex, `$1${englishTerm}$2`);
  }
  
  // Second pass: handle remaining Hebrew words with prefix stripping
  const words = translated.split(/(\s+|[,.:;!?()[\]{}])/);
  const processedWords: string[] = [];
  
  for (const word of words) {
    // Skip empty strings and whitespace/punctuation
    if (!word || /^[\s,.:;!?()[\]{}]+$/.test(word)) {
      processedWords.push(word);
      continue;
    }
    
    // Check if word contains Hebrew characters
    if (/[\u0590-\u05FF]/.test(word)) {
      const { translated: translatedWord, matched } = translateWithPrefixHandling(word);
      processedWords.push(translatedWord);
      
      if (matched) {
        matchedLength += word.length;
      } else {
        untranslated.add(word);
      }
    } else {
      processedWords.push(word);
    }
  }
  
  translated = processedWords.join('');
  
  // Calculate coverage
  const originalHebrewLength = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const coverage = originalHebrewLength > 0 
    ? Math.round((matchedLength / originalHebrewLength) * 100)
    : 100;
  
  // Count words
  const originalWords = text.split(/\s+/).filter(w => w.length > 0);
  const translatedWordCount = originalWords.length - untranslated.size;
  
  return {
    original: text,
    translated: cleanTranslatedText(translated),
    coverage: Math.min(coverage, 100),
    untranslated_words: Array.from(untranslated),
    word_count: originalWords.length,
    translated_word_count: translatedWordCount,
  };
}

/**
 * Translate English text to Hebrew using dictionary
 */
export function translateEnglishToHebrew(text: string): TranslationResult {
  if (!text || text.trim() === '') {
    return {
      original: text,
      translated: text,
      coverage: 100,
      untranslated_words: [],
      word_count: 0,
      translated_word_count: 0,
    };
  }

  let translated = text;
  let matchedLength = 0;
  const untranslated: Set<string> = new Set();
  
  // Sort keys by length (longest first)
  const sortedKeys = Object.keys(FULL_DICTIONARY_EN_HE)
    .sort((a, b) => b.length - a.length);
  
  for (const englishTerm of sortedKeys) {
    const hebrewTerm = FULL_DICTIONARY_EN_HE[englishTerm];
    
    // Case-insensitive matching for English
    const regex = new RegExp(
      `(^|[\\s,.:;!?()\\[\\]{}])${escapeRegex(englishTerm)}($|[\\s,.:;!?()\\[\\]{}])`,
      'gi'
    );
    
    const matches = translated.match(regex);
    if (matches) {
      matchedLength += matches.join('').replace(/[\s,.:;!?()[\]{}]/g, '').length;
    }
    
    translated = translated.replace(regex, `$1${hebrewTerm}$2`);
  }
  
  // Calculate coverage (for English, count alphabetic characters)
  const originalEnglishLength = (text.match(/[a-zA-Z]/g) || []).length;
  const coverage = originalEnglishLength > 0 
    ? Math.round((matchedLength / originalEnglishLength) * 100)
    : 100;
  
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  return {
    original: text,
    translated: cleanTranslatedText(translated),
    coverage: Math.min(coverage, 100),
    untranslated_words: Array.from(untranslated),
    word_count: words.length,
    translated_word_count: 0, // Would need more complex tracking
  };
}

/**
 * Batch translate multiple texts
 */
export function batchTranslate(
  texts: string[],
  direction: 'he-en' | 'en-he'
): BatchTranslationResult {
  const translateFn = direction === 'he-en' 
    ? translateHebrewToEnglish 
    : translateEnglishToHebrew;
  
  const results = texts.map(text => translateFn(text));
  
  // Calculate total coverage
  const totalOriginalLength = results.reduce((sum, r) => sum + r.word_count, 0);
  const totalTranslatedLength = results.reduce((sum, r) => sum + r.translated_word_count, 0);
  const totalCoverage = totalOriginalLength > 0
    ? Math.round((totalTranslatedLength / totalOriginalLength) * 100)
    : 100;
  
  return {
    results,
    total_coverage: totalCoverage,
    dictionary_stats: DICTIONARY_STATS,
  };
}

// ============================================
// Specialized Translation Functions
// ============================================

/**
 * Translate a property title
 */
export function translatePropertyTitle(title: string): TranslationResult {
  return translateHebrewToEnglish(title);
}

/**
 * Translate a property description
 */
export function translatePropertyDescription(description: string): TranslationResult {
  return translateHebrewToEnglish(description);
}

/**
 * Translate a neighborhood name
 */
export function translateNeighborhood(neighborhood: string): string {
  // Direct lookup first
  const directMatch = FULL_DICTIONARY_HE_EN[neighborhood];
  if (directMatch) return directMatch;
  
  // Try normalized version
  const normalized = neighborhood.trim();
  const normalizedMatch = FULL_DICTIONARY_HE_EN[normalized];
  if (normalizedMatch) return normalizedMatch;
  
  // Fall back to full translation
  const result = translateHebrewToEnglish(neighborhood);
  return result.translated;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clean up translated text
 */
function cleanTranslatedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\s([,.:;!?])/g, '$1')  // Remove space before punctuation
    .replace(/([,.:;!?])\s*([,.:;!?])/g, '$1$2')  // Clean double punctuation
    .trim();
}

/**
 * Check if text is primarily Hebrew
 */
export function isHebrewText(text: string): boolean {
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  return hebrewChars > englishChars;
}

/**
 * Get dictionary statistics
 */
export function getDictionaryStats(): typeof DICTIONARY_STATS {
  return DICTIONARY_STATS;
}

/**
 * Check if a term exists in dictionary
 */
export function isInDictionary(term: string, direction: 'he-en' | 'en-he'): boolean {
  const dict = direction === 'he-en' ? FULL_DICTIONARY_HE_EN : FULL_DICTIONARY_EN_HE;
  return term.toLowerCase() in dict || term in dict;
}

/**
 * Get all untranslated Hebrew words from a text
 */
export function findUntranslatedWords(text: string): string[] {
  const result = translateHebrewToEnglish(text);
  return result.untranslated_words;
}
