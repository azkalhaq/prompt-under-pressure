declare module 'text-readability' {
  interface Readability {
    fleschReadingEase(text: string): number;
    fleschKincaidGrade(text: string): number;
    colemanLiauIndex(text: string): number;
    automatedReadabilityIndex(text: string): number;
    daleChallReadabilityScore(text: string): number;
    difficultWords(text: string): number;
    linsearWriteFormula(text: string): number;
    gunningFog(text: string): number;
    charCount(text: string, ignoreSpaces?: boolean): number;
    letterCount(text: string, ignoreSpaces?: boolean): number;
    lexiconCount(text: string, removePunctuation?: boolean): number;
    sentenceCount(text: string): number;
    syllableCount(text: string): number;
    averageSyllablesPerWord(text: string): number;
    averageWordsPerSentence(text: string): number;
    averageCharactersPerWord(text: string): number;
    averageCharactersPerSentence(text: string): number;
    averageSyllablesPerSentence(text: string): number;
    averageSentencesPerParagraph(text: string): number;
    averageWordsPerParagraph(text: string): number;
    averageCharactersPerParagraph(text: string): number;
    averageSyllablesPerParagraph(text: string): number;
    averageParagraphsPerText(text: string): number;
    averageWordsPerText(text: string): number;
    averageSentencesPerText(text: string): number;
    averageCharactersPerText(text: string): number;
    averageSyllablesPerText(text: string): number;
    averageReadabilityScore(text: string): number;
  }

  const readability: Readability;
  export default readability;
}
