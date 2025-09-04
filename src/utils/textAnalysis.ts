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
import rs from 'text-readability';

export function calculateFleschKincaid(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  try {
    const grade = rs.fleschKincaidGrade(text);
    if (!isFinite(grade)) return 0;
    return Math.max(0, Math.round(grade * 100) / 100);
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

  let flesch_reading_ease = 0;
  let flesch_kincaid_grade = 0;
  let coleman_liau_index = 0;
  let automated_readability_index = 0;
  let dale_chall_readability_score = 0;
  let difficult_words = 0;
  let linsear_write_formula = 0;
  let gunning_fog = 0;

  try { flesch_reading_ease = Number.isFinite(rs.fleschReadingEase(text)) ? Math.round(rs.fleschReadingEase(text) * 100) / 100 : 0; } catch {}
  try { flesch_kincaid_grade = Number.isFinite(rs.fleschKincaidGrade(text)) ? Math.round(rs.fleschKincaidGrade(text) * 100) / 100 : 0; } catch {}
  try { coleman_liau_index = Number.isFinite(rs.colemanLiauIndex?.(text)) ? Math.round((rs.colemanLiauIndex as (t: string)=>number)(text) * 100) / 100 : 0; } catch {}
  try { automated_readability_index = Number.isFinite(rs.automatedReadabilityIndex?.(text)) ? Math.round((rs.automatedReadabilityIndex as (t: string)=>number)(text) * 100) / 100 : 0; } catch {}
  try { dale_chall_readability_score = Number.isFinite(rs.daleChallReadabilityScore?.(text)) ? Math.round((rs.daleChallReadabilityScore as (t: string)=>number)(text) * 100) / 100 : 0; } catch {}
  try { difficult_words = typeof rs.difficultWords === 'function' ? rs.difficultWords(text) as number : 0; } catch {}
  try { linsear_write_formula = Number.isFinite(rs.linsearWriteFormula?.(text)) ? Math.round((rs.linsearWriteFormula as (t: string)=>number)(text) * 100) / 100 : 0; } catch {}
  try { gunning_fog = Number.isFinite(rs.gunningFog?.(text)) ? Math.round((rs.gunningFog as (t: string)=>number)(text) * 100) / 100 : 0; } catch {}

  return {
    word_count,
    char_count,
    vocab_count,
    flesch_reading_ease,
    flesch_kincaid_grade,
    coleman_liau_index,
    automated_readability_index,
    dale_chall_readability_score,
    difficult_words,
    linsear_write_formula,
    gunning_fog
  };
}
