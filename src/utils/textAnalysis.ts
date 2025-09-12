/**
 * Text analysis utilities for calculating prompt metrics
 */

import readability from 'text-readability';

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
  try {
    return readability.fleschKincaidGrade(text);
  } catch {
    return 0;
  }
}

/**
 * Calculate all text metrics for a prompt
 */
export function calculateTextMetrics(text: string) {
  const word_count = calculateWordCount(text);
  const char_count = calculateCharCount(text);
  const vocab_count = calculateVocabCount(text);

  // Initialize all metrics with default values
  let letter_count = 0;
  let syllable_count = 0;
  let sentence_count = 0;
  let average_sentence_length = 0;
  let average_syllable_per_word = 0;
  let average_character_per_word = 0;
  let average_letter_per_word = 0;
  let average_sentence_per_word = 0;
  let flesch_reading_ease = 0;
  let flesch_reading_ease_grade = 0;
  let flesch_kincaid_grade = 0;
  let poly_syllable_count = 0;
  let smog_index = 0;
  let coleman_liau_index = 0;
  let automated_readability_index = 0;
  let dale_chall_readability_score = 0;
  let dale_chall_grade = 0;
  let difficult_words = 0;
  let linsear_write_formula = 0;
  let gunning_fog = 0;
  let lix_score = 0;
  let rix_score = 0;
  let text_standard_score = 0;
  let text_standard_grade = '';
  let text_median_score = 0;

  try { letter_count = readability.letterCount(text) ?? 0; } catch {}
  try { syllable_count = readability.syllableCount(text) ?? 0; } catch {}
  try { sentence_count = readability.sentenceCount(text) ?? 0; } catch {}
  try { average_sentence_length = readability.averageSentenceLength(text) ?? 0; } catch {}
  try { average_syllable_per_word = readability.averageSyllablePerWord(text) ?? 0; } catch {}
  try { average_character_per_word = readability.averageCharacterPerWord(text) ?? 0; } catch {}
  try { average_letter_per_word = readability.averageLetterPerWord(text) ?? 0; } catch {}
  try { average_sentence_per_word = readability.averageSentencePerWord(text) ?? 0; } catch {}
  try { flesch_reading_ease = readability.fleschReadingEase(text) ?? 0; } catch {}
  try { flesch_reading_ease_grade = readability.fleschReadingEaseToGrade(flesch_reading_ease) ?? 0; } catch {}
  try { flesch_kincaid_grade = readability.fleschKincaidGrade(text) ?? 0; } catch {}
  try { poly_syllable_count = readability.polySyllableCount(text) ?? 0; } catch {}
  try { smog_index = readability.smogIndex(text) ?? 0; } catch {}
  try { coleman_liau_index = readability.colemanLiauIndex(text) ?? 0; } catch {}
  try { automated_readability_index = readability.automatedReadabilityIndex(text) ?? 0; } catch {}
  try { dale_chall_readability_score = readability.daleChallReadabilityScore(text) ?? 0; } catch {}
  try { dale_chall_grade = readability.daleChallToGrade(dale_chall_readability_score) ?? 0; } catch {}
  try { difficult_words = readability.difficultWords(text) ?? 0; } catch {}
  try { linsear_write_formula = readability.linsearWriteFormula(text) ?? 0; } catch {}
  try { gunning_fog = readability.gunningFog(text) ?? 0; } catch {}
  try { lix_score = readability.lix(text) ?? 0; } catch {}
  try { rix_score = readability.rix(text) ?? 0; } catch {}
  try { 
    const textStandard = readability.textStandard(text, true);
    text_standard_score = typeof textStandard === 'number' ? textStandard : 0;
    const textStandardGrade = readability.textStandard(text, false);
    text_standard_grade = typeof textStandardGrade === 'string' ? textStandardGrade : '';
  } catch {}
  try { text_median_score = readability.textMedian(text) ?? 0; } catch {}

  return {
    word_count,
    char_count,
    vocab_count,
    letter_count,
    syllable_count,
    sentence_count,
    average_sentence_length,
    average_syllable_per_word,
    average_character_per_word,
    average_letter_per_word,
    average_sentence_per_word,
    flesch_reading_ease,
    flesch_reading_ease_grade,
    flesch_kincaid_grade,
    poly_syllable_count,
    smog_index,
    coleman_liau_index,
    automated_readability_index,
    dale_chall_readability_score,
    dale_chall_grade,
    difficult_words,
    linsear_write_formula,
    gunning_fog,
    lix_score,
    rix_score,
    text_standard_score,
    text_standard_grade,
    text_median_score
  };
}

/**
 * Heuristic CARE prompt-quality metrics based on NN/g CARE framework
 * CARE: Context, Ask, Rules, Examples
 * Returns discrete scores (0-2) for core dimensions and supporting booleans/counters.
 */
export function calculateCareMetrics(text: string) {
  if (!text || typeof text !== 'string') {
    return {
      care_context_score: 0,
      care_ask_score: 0,
      care_rules_score: 0,
      care_examples_score: 0,
      care_specificity_score: 0,
      care_measurability_score: 0,
      care_verifiability_score: 0,
      care_ambiguity_count: 0,
      care_output_format_specified: false,
      care_role_specified: false,
      care_quantity_specified: false,
      care_has_citations: false,
    };
  }

  const lower = text.toLowerCase();

  // Context signals
  const contextSignals = [
    'user', 'audience', 'customer', 'persona', 'based in', 'locale', 'working on', 'project',
    'platform', 'web', 'mobile', 'app', 'ecommerce', 'login', 'screen', 'domain', 'industry', 'goal', 'success', 'background', 'context'
  ];
  const contextHits = contextSignals.filter(s => lower.includes(s)).length;
  const care_context_score = contextHits >= 5 ? 2 : contextHits >= 2 ? 1 : 0;

  // Ask signals (role, outputs, steps, format)
  const askSignals = [
    'generate', 'write', 'create', 'produce', 'return', 'provide', 'follow these steps', 'steps:', 'format:', 'present', 'rank'
  ];
  const askHits = askSignals.filter(s => lower.includes(s)).length;
  const care_ask_score = askHits >= 4 ? 2 : askHits >= 2 ? 1 : 0;

  // Rules signals
  const rulesSignals = [
    'guidelines', "don't", 'do not', 'avoid', 'must', 'should', 'tone', 'style', 'no more than', 'max', 'limit', 'constraints'
  ];
  const rulesHits = rulesSignals.filter(s => lower.includes(s)).length;
  const care_rules_score = rulesHits >= 4 ? 2 : rulesHits >= 2 ? 1 : 0;

  // Examples signals
  const examplesSignals = ['examples:', 'example:', 'good example', 'bad example', 'avoid ... like'];
  const examplesHits = examplesSignals.filter(s => lower.includes(s)).length;
  const care_examples_score = examplesHits >= 2 ? 2 : examplesHits >= 1 ? 1 : 0;

  // Specificity: presence of concrete nouns and constraints (numbers, exact targets)
  const numberMatches = lower.match(/\b\d+\b/g) || [];
  const constraintSignals = ['exact', 'specific', 'table', 'json', 'columns', 'fields', 'schema', 'section'];
  const specificityHits = numberMatches.length + constraintSignals.filter(s => lower.includes(s)).length;
  const care_specificity_score = specificityHits >= 4 ? 2 : specificityHits >= 2 ? 1 : 0;

  // Measurability: explicit measurable constraints
  const measSignals = ['no more than', 'at most', 'at least', 'characters', 'sentences', '<=', '>=', '<', '>', 'limit to'];
  const measHits = measSignals.filter(s => lower.includes(s)).length + numberMatches.length;
  const care_measurability_score = measHits >= 5 ? 2 : measHits >= 2 ? 1 : 0;

  // Verifiability: schema/format or rubric present
  const verifSignals = ['json', 'schema', 'table', 'markdown table', 'columns', 'fields', 'validate', 'rubric'];
  const verifHits = verifSignals.filter(s => lower.includes(s)).length;
  const care_verifiability_score = verifHits >= 3 ? 2 : verifHits >= 1 ? 1 : 0;

  // Ambiguity: count vague terms
  const vagueTerms = [
    'optimize', 'improve', 'nice', 'good', 'bad', 'better', 'best', 'simple', 'easily', 'quickly', 'sufficient', 'robust', 'intuitive'
  ];
  const care_ambiguity_count = vagueTerms.reduce((count, term) => count + ((lower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length), 0);

  // Output format specified
  const care_output_format_specified = verifSignals.some(s => lower.includes(s));

  // Role specified
  const roleSignals = ['you are a', 'act as', "you're a", 'role:', 'Your role'];
  const care_role_specified = roleSignals.some(s => lower.includes(s));

  // Quantity specified
  const quantitySignals = ['options', 'variations', 'list', 'top', 'rank'];
  const qtyNumbers = numberMatches.length;
  const care_quantity_specified = qtyNumbers > 0 && quantitySignals.some(s => lower.includes(s));

  // Citations or URLs present
  const care_has_citations = /(https?:\/\/)/.test(text);

  return {
    care_context_score,
    care_ask_score,
    care_rules_score,
    care_examples_score,
    care_specificity_score,
    care_measurability_score,
    care_verifiability_score,
    care_ambiguity_count,
    care_output_format_specified,
    care_role_specified,
    care_quantity_specified,
    care_has_citations,
  };
}
