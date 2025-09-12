# Text-Readability Metrics Database Migration

This document describes the comprehensive text-readability metrics that have been added to the `chat_interactions` table, based on all the metrics available in the `text-readability` package's test file.

## Overview

The migration adds **18 new columns** to the `chat_interactions` table to capture all available text-readability metrics from the `text-readability` npm package.

## New Columns Added

### Basic Text Analysis Metrics
- `letter_count` (INT) - Number of letters (excluding punctuation)
- `syllable_count` (INT) - Number of syllables in prompt
- `sentence_count` (INT) - Number of sentences in prompt

### Average Calculation Metrics
- `average_sentence_length` (NUMERIC(6,2)) - Average words per sentence
- `average_syllable_per_word` (NUMERIC(6,2)) - Average syllables per word
- `average_character_per_word` (NUMERIC(6,2)) - Average characters per word
- `average_letter_per_word` (NUMERIC(6,2)) - Average letters per word
- `average_sentence_per_word` (NUMERIC(6,2)) - Average sentences per word

### Additional Readability Index Metrics
- `flesch_reading_ease_grade` (NUMERIC(6,2)) - Flesch Reading Ease converted to grade level
- `poly_syllable_count` (INT) - Count of polysyllabic words (3+ syllables)
- `smog_index` (NUMERIC(6,2)) - SMOG Index readability measure
- `dale_chall_grade` (NUMERIC(6,2)) - Dale-Chall score converted to grade level
- `lix_score` (NUMERIC(6,2)) - LIX Readability Measure
- `rix_score` (NUMERIC(6,2)) - RIX Readability Measure

### Composite Readability Metrics
- `text_standard_score` (NUMERIC(6,2)) - Overall readability consensus score (numeric)
- `text_standard_grade` (TEXT) - Overall readability consensus grade (string)
- `text_median_score` (NUMERIC(6,2)) - Median readability score across all indices

## Files Modified

### 1. Database Schema
- **File**: `sql/database-setup.sql`
- **Changes**: Added all 18 new columns to the `chat_interactions` table definition

### 2. Migration Script
- **File**: `sql/migration-add-text-readability-metrics.sql`
- **Purpose**: Adds new columns to existing databases
- **Features**: 
  - Uses `ADD COLUMN IF NOT EXISTS` for safe execution
  - Adds column comments for documentation
  - Creates indexes on frequently queried columns
  - Includes verification query

### 3. TypeScript Interface
- **File**: `src/lib/chat-interactions.ts`
- **Changes**: 
  - Updated `ChatInteractionData` interface with all new metrics
  - Updated `insertChatInteraction` function to handle new columns

### 4. Text Analysis Utility
- **File**: `src/utils/textAnalysis.ts`
- **Changes**: 
  - Updated `calculateTextMetrics` function to calculate all new metrics
  - Added proper error handling for each metric calculation
  - Handles both numeric and string return types for `textStandard`

## Usage

### Running the Migration

For existing databases, run the migration script:

```sql
-- Run this script on your existing database
\i sql/migration-add-text-readability-metrics.sql
```

### Using the New Metrics

The `calculateTextMetrics` function now returns all available metrics:

```typescript
import { calculateTextMetrics } from '@/utils/textAnalysis';

const metrics = calculateTextMetrics("Your prompt text here");

// All metrics are now available:
console.log(metrics.letter_count);
console.log(metrics.syllable_count);
console.log(metrics.smog_index);
console.log(metrics.lix_score);
console.log(metrics.text_standard_grade);
// ... and many more
```

### Database Insertion

The `insertChatInteraction` function automatically handles all new metrics:

```typescript
import { insertChatInteraction } from '@/lib/chat-interactions';

await insertChatInteraction({
  // ... existing fields
  ...calculateTextMetrics(promptText),
  // ... other fields
});
```

## Metrics Mapping

| Test File Method | Database Column | Type | Description |
|------------------|-----------------|------|-------------|
| `charCount()` | `char_count` | INT | Characters in text |
| `letterCount()` | `letter_count` | INT | Letters (no punctuation) |
| `lexiconCount()` | `word_count` | INT | Word count |
| `syllableCount()` | `syllable_count` | INT | Syllable count |
| `sentenceCount()` | `sentence_count` | INT | Sentence count |
| `averageSentenceLength()` | `average_sentence_length` | NUMERIC(6,2) | Avg words/sentence |
| `averageSyllablePerWord()` | `average_syllable_per_word` | NUMERIC(6,2) | Avg syllables/word |
| `averageCharacterPerWord()` | `average_character_per_word` | NUMERIC(6,2) | Avg chars/word |
| `averageLetterPerWord()` | `average_letter_per_word` | NUMERIC(6,2) | Avg letters/word |
| `averageSentencePerWord()` | `average_sentence_per_word` | NUMERIC(6,2) | Avg sentences/word |
| `fleschReadingEase()` | `flesch_reading_ease` | NUMERIC(6,2) | Flesch Reading Ease |
| `fleschReadingEaseToGrade()` | `flesch_reading_ease_grade` | NUMERIC(6,2) | Flesch grade level |
| `fleschKincaidGrade()` | `flesch_kincaid_grade` | NUMERIC(6,2) | Flesch-Kincaid grade |
| `polySyllableCount()` | `poly_syllable_count` | INT | Polysyllabic words |
| `smogIndex()` | `smog_index` | NUMERIC(6,2) | SMOG Index |
| `colemanLiauIndex()` | `coleman_liau_index` | NUMERIC(6,2) | Coleman-Liau Index |
| `automatedReadabilityIndex()` | `automated_readability_index` | NUMERIC(6,2) | ARI |
| `daleChallReadabilityScore()` | `dale_chall_readability_score` | NUMERIC(6,2) | Dale-Chall score |
| `daleChallToGrade()` | `dale_chall_grade` | NUMERIC(6,2) | Dale-Chall grade |
| `difficultWords()` | `difficult_words` | INT | Difficult words count |
| `linsearWriteFormula()` | `linsear_write_formula` | NUMERIC(6,2) | Linsear Write |
| `gunningFog()` | `gunning_fog` | NUMERIC(6,2) | Gunning Fog Index |
| `lix()` | `lix_score` | NUMERIC(6,2) | LIX measure |
| `rix()` | `rix_score` | NUMERIC(6,2) | RIX measure |
| `textStandard(text, true)` | `text_standard_score` | NUMERIC(6,2) | Consensus score |
| `textStandard(text, false)` | `text_standard_grade` | TEXT | Consensus grade |
| `textMedian()` | `text_median_score` | NUMERIC(6,2) | Median score |

## Indexes Created

The migration creates indexes on frequently queried columns:
- `letter_count`
- `syllable_count`
- `sentence_count`
- `smog_index`
- `lix_score`
- `rix_score`
- `text_standard_score`
- `text_median_score`

## Verification

After running the migration, you can verify it was successful by checking the column count:

```sql
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'chat_interactions';
```

The `chat_interactions` table should now have significantly more columns than before the migration.
