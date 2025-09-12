-- Migration script to add comprehensive text-readability metrics to chat_interactions table
-- This script adds all the missing text-readability columns from the main.test.js file
-- Run this script if you have an existing database with the old chat_interactions schema

-- Add basic text analysis metrics
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS letter_count INT;
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS syllable_count INT;
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS sentence_count INT;

-- Add average calculation metrics
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS average_sentence_length NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS average_syllable_per_word NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS average_character_per_word NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS average_letter_per_word NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS average_sentence_per_word NUMERIC(6,2);

-- Add additional readability index metrics
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS flesch_reading_ease_grade NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS poly_syllable_count INT;
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS smog_index NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS dale_chall_grade NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS lix_score NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS rix_score NUMERIC(6,2);

-- Add composite readability metrics
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS text_standard_score NUMERIC(6,2);
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS text_standard_grade TEXT;
ALTER TABLE chat_interactions ADD COLUMN IF NOT EXISTS text_median_score NUMERIC(6,2);

-- Add comments to document the new columns
COMMENT ON COLUMN chat_interactions.letter_count IS 'Number of letters (excluding punctuation)';
COMMENT ON COLUMN chat_interactions.syllable_count IS 'Number of syllables in prompt';
COMMENT ON COLUMN chat_interactions.sentence_count IS 'Number of sentences in prompt';
COMMENT ON COLUMN chat_interactions.average_sentence_length IS 'Average words per sentence';
COMMENT ON COLUMN chat_interactions.average_syllable_per_word IS 'Average syllables per word';
COMMENT ON COLUMN chat_interactions.average_character_per_word IS 'Average characters per word';
COMMENT ON COLUMN chat_interactions.average_letter_per_word IS 'Average letters per word';
COMMENT ON COLUMN chat_interactions.average_sentence_per_word IS 'Average sentences per word';
COMMENT ON COLUMN chat_interactions.flesch_reading_ease_grade IS 'Flesch Reading Ease converted to grade level';
COMMENT ON COLUMN chat_interactions.poly_syllable_count IS 'Count of polysyllabic words (3+ syllables)';
COMMENT ON COLUMN chat_interactions.smog_index IS 'SMOG Index readability measure';
COMMENT ON COLUMN chat_interactions.dale_chall_grade IS 'Dale-Chall score converted to grade level';
COMMENT ON COLUMN chat_interactions.lix_score IS 'LIX Readability Measure';
COMMENT ON COLUMN chat_interactions.rix_score IS 'RIX Readability Measure';
COMMENT ON COLUMN chat_interactions.text_standard_score IS 'Overall readability consensus score (numeric)';
COMMENT ON COLUMN chat_interactions.text_standard_grade IS 'Overall readability consensus grade (string)';
COMMENT ON COLUMN chat_interactions.text_median_score IS 'Median readability score across all indices';

-- Create indexes for the new columns that might be frequently queried
CREATE INDEX IF NOT EXISTS idx_chat_interactions_letter_count ON chat_interactions(letter_count);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_syllable_count ON chat_interactions(syllable_count);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_sentence_count ON chat_interactions(sentence_count);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_smog_index ON chat_interactions(smog_index);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_lix_score ON chat_interactions(lix_score);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_rix_score ON chat_interactions(rix_score);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_text_standard_score ON chat_interactions(text_standard_score);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_text_median_score ON chat_interactions(text_median_score);

-- Verify the migration was successful
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chat_interactions' 
    AND column_name IN (
        'letter_count', 'syllable_count', 'sentence_count',
        'average_sentence_length', 'average_syllable_per_word', 'average_character_per_word',
        'average_letter_per_word', 'average_sentence_per_word',
        'flesch_reading_ease_grade', 'poly_syllable_count', 'smog_index',
        'dale_chall_grade', 'lix_score', 'rix_score',
        'text_standard_score', 'text_standard_grade', 'text_median_score'
    )
ORDER BY column_name;
