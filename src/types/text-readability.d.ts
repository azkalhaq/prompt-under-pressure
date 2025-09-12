declare module 'text-readability' {
  /**
   * Main Readability class interface with all text analysis methods
   */
  interface Readability {
    // Basic text counting methods
    charCount(text: string, ignoreSpaces?: boolean): number;
    letterCount(text: string, ignoreSpaces?: boolean): number;
    removePunctuation(text: string): string;
    lexiconCount(text: string, removePunctuation?: boolean): number;
    syllableCount(text: string, lang?: string): number;
    sentenceCount(text: string): number;
    
    // Average calculation methods
    averageSentenceLength(text: string): number;
    averageSyllablePerWord(text: string): number;
    averageCharacterPerWord(text: string): number;
    averageLetterPerWord(text: string): number;
    averageSentencePerWord(text: string): number;
    
    // Flesch Reading Ease methods
    fleschReadingEase(text: string): number;
    fleschReadingEaseToGrade(score: number): number;
    fleschKincaidGrade(text: string): number;
    
    // Syllable analysis methods
    polySyllableCount(text: string): number;
    
    // Readability index methods
    smogIndex(text: string): number;
    colemanLiauIndex(text: string): number;
    automatedReadabilityIndex(text: string): number;
    linsearWriteFormula(text: string): number;
    
    // Difficult words analysis
    presentTense(word: string): string;
    difficultWords(text: string, syllableThreshold?: number): number;
    difficultWordsSet(text: string, syllableThreshold?: number): Set<string>;
    
    // Dale-Chall readability
    daleChallReadabilityScore(text: string): number;
    daleChallToGrade(score: number): number;
    
    // Gunning Fog index
    gunningFog(text: string): number;
    
    // LIX and RIX readability measures
    lix(text: string): number;
    rix(text: string): number;
    
    // Composite readability methods
    textStandard(text: string, floatOutput?: boolean | null): number | string;
    textMedian(text: string): number;
  }

  /**
   * Static methods available on the Readability class
   */
  interface ReadabilityStatic {
    getGradeSuffix(grade: number): string;
    split(text: string): string[];
  }

  /**
   * Combined interface that includes both instance and static methods
   */
  interface ReadabilityInstance extends Readability, ReadabilityStatic {}

  const readability: ReadabilityInstance;
  export default readability;
}
