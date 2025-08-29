/**
 * Text analysis utilities for calculating prompt metrics
 */

/**
 * Calculate word count in a text
 */
export function calculateWordCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate character count in a text
 */
export function calculateCharCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.length;
}

/**
 * Calculate unique vocabulary count in a text
 */
export function calculateVocabCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  const uniqueWords = new Set(words);
  return uniqueWords.size;
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: 0.39 × (total words ÷ total sentences) + 11.8 × (total syllables ÷ total words) - 15.59
 */
export function calculateFleschKincaid(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Count sentences (simple approach: split by sentence endings)
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  const sentenceCount = sentences.length || 1; // Avoid division by zero
  
  // Count words
  const wordCount = calculateWordCount(text);
  if (wordCount === 0) return 0;
  
  // Count syllables (simplified approach)
  const syllableCount = countSyllables(text);
  
  // Calculate Flesch-Kincaid Grade Level
  const fk = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;
  
  // Return rounded to 2 decimal places, minimum 0
  return Math.max(0, Math.round(fk * 100) / 100);
}

/**
 * Count syllables in text (simplified approach)
 */
function countSyllables(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  return words.reduce((total, word) => total + countWordSyllables(word), 0);
}

/**
 * Count syllables in a single word (simplified approach)
 */
function countWordSyllables(word: string): number {
  if (!word || word.length === 0) return 0;
  // Remove silent 'e' at the end
  const processedWord = word.replace(/e$/, '');
  
  // Count vowel groups (consonant-vowel-consonant patterns)
  const vowelGroups = processedWord.match(/[aeiouy]+/g);
  if (!vowelGroups) return 1; // At least 1 syllable
  
  return Math.max(1, vowelGroups.length);
}

/**
 * Calculate all text metrics for a prompt
 */
export function calculateTextMetrics(text: string) {
  return {
    word_count: calculateWordCount(text),
    char_count: calculateCharCount(text),
    vocab_count: calculateVocabCount(text),
    readability_fk: calculateFleschKincaid(text)
  };
}
