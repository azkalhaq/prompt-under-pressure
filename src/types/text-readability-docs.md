# Text-Readability TypeScript Definitions

This file provides comprehensive TypeScript type definitions for the `text-readability` npm package.

## Available Methods

### Basic Text Analysis
- `charCount(text, ignoreSpaces?)` - Count characters in text
- `letterCount(text, ignoreSpaces?)` - Count letters (excluding punctuation)
- `removePunctuation(text)` - Remove punctuation from text
- `lexiconCount(text, removePunctuation?)` - Count words in text
- `syllableCount(text, lang?)` - Count syllables in text
- `sentenceCount(text)` - Count sentences in text

### Average Calculations
- `averageSentenceLength(text)` - Average words per sentence
- `averageSyllablePerWord(text)` - Average syllables per word
- `averageCharacterPerWord(text)` - Average characters per word
- `averageLetterPerWord(text)` - Average letters per word
- `averageSentencePerWord(text)` - Average sentences per word

### Readability Indices
- `fleschReadingEase(text)` - Flesch Reading Ease score (0-100)
- `fleschKincaidGrade(text)` - Flesch-Kincaid Grade Level
- `colemanLiauIndex(text)` - Coleman-Liau Index
- `automatedReadabilityIndex(text)` - Automated Readability Index
- `smogIndex(text)` - SMOG Index
- `linsearWriteFormula(text)` - Linsear Write Formula
- `daleChallReadabilityScore(text)` - Dale-Chall Readability Score
- `gunningFog(text)` - Gunning Fog Index
- `lix(text)` - LIX Readability Measure
- `rix(text)` - RIX Readability Measure

### Grade Conversion
- `fleschReadingEaseToGrade(score)` - Convert Flesch score to grade level
- `daleChallToGrade(score)` - Convert Dale-Chall score to grade level

### Difficult Words Analysis
- `difficultWords(text, syllableThreshold?)` - Count difficult words
- `difficultWordsSet(text, syllableThreshold?)` - Get set of difficult words
- `presentTense(word)` - Convert word to present tense
- `polySyllableCount(text)` - Count polysyllabic words

### Composite Methods
- `textStandard(text, floatOutput?)` - Overall readability consensus
- `textMedian(text)` - Median readability score

### Static Methods
- `getGradeSuffix(grade)` - Get ordinal suffix (st, nd, rd, th)
- `split(text)` - Split text into words

## Usage Example

```typescript
import readability from 'text-readability';

const text = "This is a sample text for analysis.";

// Basic counts
const wordCount = readability.lexiconCount(text);
const sentenceCount = readability.sentenceCount(text);

// Readability scores
const fleschScore = readability.fleschReadingEase(text);
const gradeLevel = readability.fleschKincaidGrade(text);

// Composite analysis
const overallGrade = readability.textStandard(text);
const medianScore = readability.textMedian(text);
```

## Return Types

- Most methods return `number` for scores and counts
- `textStandard()` returns `number | string` depending on `floatOutput` parameter
- `difficultWordsSet()` returns `Set<string>`
- `removePunctuation()` returns `string`
- `presentTense()` returns `string`
- `getGradeSuffix()` returns `string`
- `split()` returns `string[]`
