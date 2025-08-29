-- Stroop Test Database Setup
-- Run these SQL commands in your Supabase SQL editor

-- Create stroop_sessions table
CREATE TABLE IF NOT EXISTS stroop_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    total_trials INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stroop_trials table
CREATE TABLE IF NOT EXISTS stroop_trials (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    trial_number INTEGER NOT NULL,
    instruction TEXT NOT NULL CHECK (instruction IN ('word', 'color')),
    text TEXT NOT NULL,
    text_color TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('consistent', 'inconsistent')),
    iti INTEGER NOT NULL,
    reaction_time INTEGER,
    correctness BOOLEAN,
    user_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES stroop_sessions(session_id) ON DELETE CASCADE
);

-- Add user_answer column to existing stroop_trials table (if table already exists)
ALTER TABLE stroop_trials ADD COLUMN IF NOT EXISTS user_answer TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stroop_sessions_user_id ON stroop_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_stroop_sessions_session_id ON stroop_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_user_id ON stroop_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_session_id ON stroop_trials(session_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_trial_number ON stroop_trials(trial_number);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE stroop_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stroop_trials ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (uncomment if using RLS)
-- CREATE POLICY "Users can view their own sessions" ON stroop_sessions
--     FOR SELECT USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can insert their own sessions" ON stroop_sessions
--     FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can update their own sessions" ON stroop_sessions
--     FOR UPDATE USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can view their own trials" ON stroop_trials
--     FOR SELECT USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can insert their own trials" ON stroop_trials
--     FOR INSERT WITH CHECK (auth.uid()::text = user_id);
