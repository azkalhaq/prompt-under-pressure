-- Database setup for Next.js Pup Project
-- This file sets up the unified session system for both Stroop tests and Chat interactions

-- Create user_sessions table (renamed from stroop_sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_stroop_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_trials INTEGER DEFAULT 0,
    total_prompts INTEGER DEFAULT 0,
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
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Create chat_interactions table
CREATE TABLE IF NOT EXISTS chat_interactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    prompt TEXT NOT NULL,
    response TEXT,
    model TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_usd DECIMAL(10, 6),
    api_call_id TEXT,
    raw_request JSONB,
    raw_respond JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_user_id ON stroop_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_session_id ON stroop_trials(session_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_trial_number ON stroop_trials(trial_number);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_user_id ON chat_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_session_id ON chat_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_created_at ON chat_interactions(created_at);

-- Migration script for existing data (if needed)
-- This will help migrate existing stroop_sessions to user_sessions
-- Run this only if you have existing data to migrate

-- ALTER TABLE stroop_sessions ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- ALTER TABLE stroop_sessions ADD COLUMN IF NOT EXISTS total_prompts INTEGER DEFAULT 0;
-- ALTER TABLE stroop_sessions RENAME COLUMN start_time TO start_stroop_time;
-- ALTER TABLE stroop_sessions RENAME TO user_sessions;
