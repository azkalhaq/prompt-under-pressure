-- Add user_answer column to existing stroop_trials table
-- Run this in your Supabase SQL editor if you already have the stroop_trials table

ALTER TABLE stroop_trials ADD COLUMN IF NOT EXISTS user_answer TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stroop_trials' AND column_name = 'user_answer';
