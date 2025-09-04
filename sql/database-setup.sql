-- Database setup for Next.js Pup Project
-- This file sets up the unified session system for both Stroop tests and Chat interactions

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,                         -- surrogate key
    user_id VARCHAR(128) UNIQUE NOT NULL,             -- unique user identifier (generated unique id based on n alphanumeric char - configurable)
    email VARCHAR(255) UNIQUE,                        -- user's email address
    username VARCHAR(255) UNIQUE,                     -- username (optional, default value use email)
    name VARCHAR(255),                                -- fullname
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),    -- record creation time
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()     -- record update time
);

-- Create user_sessions table (renamed from stroop_sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,                         -- surrogate key
    user_id VARCHAR(128) NOT NULL,                    -- anonymised or app user id
    session_id VARCHAR(128) UNIQUE NOT NULL,          -- session identifier
    route_path TEXT,                                  -- route path accessed (e.g., '/', '/task-2')
    query_params TEXT,                                 -- query params accessed (e.g., '?audio=1')
    utm_source VARCHAR(255),                           -- UTM source parameter for tracking
    audio BOOLEAN DEFAULT FALSE,                       -- audio parameter (true if audio=1 in query)
    session_start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    task_start_time TIMESTAMPTZ,                      -- when scenario started (Get Started button clicked)
    start_stroop_time TIMESTAMPTZ,                    -- when stroop test startedf
    end_time TIMESTAMPTZ,                             -- when session ended
    total_trials INTEGER DEFAULT 0,                   -- number of stroop trials completed
    total_prompts INTEGER DEFAULT 0,                  -- number of chat interactions completed
    submitted_result TEXT,                            -- final text submitted by the user
    confidence INTEGER,                               -- confidence level of the user's submission
    submit_time TIMESTAMPTZ,                          -- when submission was made
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),     -- record creation time
    -- Browser fingerprinting fields for duplicate detection
    user_agent TEXT,                                  -- browser user agent string
    language VARCHAR(10),                             -- browser language
    platform VARCHAR(50),                             -- operating system platform
    screen_width INTEGER,                             -- screen width
    screen_height INTEGER,                            -- screen height
    timezone VARCHAR(50),                             -- user's timezone
    ip_address INET                                   -- IP address
);

-- Create stroop_trials table
CREATE TABLE IF NOT EXISTS stroop_trials (
    id BIGSERIAL PRIMARY KEY,                         -- surrogate key
    user_id VARCHAR(128) NOT NULL,                    -- anonymised or app user id
    session_id VARCHAR(128) NOT NULL,                 -- session identifier
    trial_number INTEGER NOT NULL,                    -- sequential trial number in session
    instruction VARCHAR(32) NOT NULL CHECK (instruction IN ('word', 'color')),
    text VARCHAR(64) NOT NULL,                        -- displayed word (RED, BLUE, GREEN, YELLOW)
    text_color VARCHAR(32) NOT NULL,                  -- color of the text
    condition VARCHAR(32) NOT NULL CHECK (condition IN ('consistent', 'inconsistent')),
    iti INTEGER NOT NULL,                             -- inter-trial interval in milliseconds
    reaction_time INTEGER,                            -- response time in milliseconds
    correctness BOOLEAN,                              -- whether response was correct
    user_answer VARCHAR(32),                          -- user's selected answer
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),    -- record creation time
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Create chat_interactions table
CREATE TABLE IF NOT EXISTS chat_interactions (
    id BIGSERIAL PRIMARY KEY,                         -- surrogate key

    -- user related data
    user_id VARCHAR(128) NOT NULL,                    -- anonymised or app user id 
    session_id VARCHAR(128) NOT NULL,                 -- session identifier

    -- interaction specified data
    prompting_time_ms INT,                            -- ms to compose the prompt
    scenario VARCHAR(24) NOT NULL,                    -- 'baseline' | 'dual_task' | 'under_stress' | 'time_pressure' | 'cognitive_load' (derived from page)
    task_code VARCHAR(64),                            -- from ?task= query param; NULL if absent
    prompt_index_no INT NOT NULL,                     -- order within same session (1..N)
    prompt TEXT NOT NULL,                             -- user-entered text
    response TEXT,                                    -- LLM response text

    -- prompt metrics / quality
    word_count INT,                                   -- number of words in prompt
    char_count INT,                                   -- number of characters in prompt
    vocab_count INT,                                  -- unique vocabulary count in prompt
    -- prompt readability metrics
    flesch_reading_ease NUMERIC(6,2),                 -- Flesch Reading Ease (prompt)
    flesch_kincaid_grade NUMERIC(6,2),                -- Flesch–Kincaid Grade (prompt)
    coleman_liau_index NUMERIC(6,2),                  -- Coleman-Liau Index (prompt)
    automated_readability_index NUMERIC(6,2),         -- Automated Readability Index (prompt)
    dale_chall_readability_score NUMERIC(6,2),        -- Dale-Chall Readability Score (prompt)
    difficult_words INT,                              -- Difficult words count (prompt)
    linsear_write_formula NUMERIC(6,2),               -- Linsear Write Formula (prompt)
    gunning_fog NUMERIC(6,2),                         -- Gunning Fog Index (prompt)

    -- user reaction
    reaction VARCHAR(8) CHECK (reaction IN ('up','down')),

    -- CARE prompt quality metrics (heuristic 0-2 unless noted)
    care_context_score SMALLINT,                      -- presence/quality of Context
    care_ask_score SMALLINT,                          -- presence/quality of Ask
    care_rules_score SMALLINT,                        -- presence/quality of Rules
    care_examples_score SMALLINT,                     -- presence/quality of Examples
    care_specificity_score SMALLINT,                  -- specificity of constraints
    care_measurability_score SMALLINT,                -- measurable criteria provided
    care_verifiability_score SMALLINT,                -- output verifiable via schema/rubric
    care_ambiguity_count INT,                         -- count of vague terms detected (lower is better)
    care_output_format_specified BOOLEAN,             -- explicit output format/schema provided
    care_role_specified BOOLEAN,                      -- role/persona specified
    care_quantity_specified BOOLEAN,                  -- number of outputs/options specified
    care_has_citations BOOLEAN,                       -- contains URLs/citation requirement
    
    -- OpenAI related
    api_call_id VARCHAR(128),                         -- provider's call id (e.g., "chatcmpl-...")
    role_used VARCHAR(32),                                 -- role used ('system'|'user'|'assistant'|'tool', etc.)
    model VARCHAR(64),                                -- model name (e.g., 'gpt-4o', 'gpt-5')
    token_input INT,                                  -- prompt_tokens from API usage
    token_output INT,                                 -- completion_tokens from API usage
    token_total INT GENERATED ALWAYS AS               -- computed total tokens
                 (COALESCE(token_input,0) + COALESCE(token_output,0)) STORED,
    cost_input NUMERIC(10,6),                         -- $ cost of input tokens
    cost_output NUMERIC(10,6),                        -- $ cost of output tokens
    cost_total NUMERIC(10,6) GENERATED ALWAYS AS      -- computed total cost (USD)
                 (COALESCE(cost_input,0) + COALESCE(cost_output,0)) STORED,
    finish_reason VARCHAR(32),                        -- API finish reason ('stop','length',...)
    raw_response JSONB,                               -- raw JSON response from provider
    raw_request JSONB,                                -- raw JSON request payload sent

    -- timestamp related
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),    -- record creation time

    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_utm_source ON user_sessions(utm_source);
CREATE INDEX IF NOT EXISTS idx_user_sessions_audio ON user_sessions(audio);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_user_id ON stroop_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_session_id ON stroop_trials(session_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_trial_number ON stroop_trials(trial_number);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_user_id ON chat_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_session_id ON chat_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_created_at ON chat_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_scenario ON chat_interactions(scenario);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_task_code ON chat_interactions(task_code);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_prompt_index_no ON chat_interactions(prompt_index_no);

-- Migration script for existing data (if needed)
-- This will help migrate existing stroop_sessions to user_sessions
-- Run this only if you have existing data to migrate

-- ALTER TABLE stroop_sessions ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- ALTER TABLE stroop_sessions ADD COLUMN IF NOT EXISTS total_prompts INTEGER DEFAULT 0;
-- ALTER TABLE stroop_sessions RENAME COLUMN start_time TO start_stroop_time;
-- ALTER TABLE stroop_sessions RENAME TO user_sessions;

-- Migration script for chat_interactions table (run this if you have existing data)
-- This will migrate the old chat_interactions schema to the new one

-- Step 1: Create new table with new schema
-- CREATE TABLE chat_interactions_new (
--     id BIGSERIAL PRIMARY KEY,
--     user_id VARCHAR(128) NOT NULL,
--     session_id VARCHAR(128) NOT NULL,
--     prompting_time_ms INT,
--     scenario VARCHAR(24) NOT NULL DEFAULT 'baseline',
--     task_code VARCHAR(64),
--     prompt_index_no INT NOT NULL DEFAULT 1,
--     prompt TEXT NOT NULL,
--     response TEXT,
--     word_count INT,
--     char_count INT,
--     vocab_count INT,
--     readability_fk NUMERIC(6,2),
--     api_call_id VARCHAR(128),
--     role VARCHAR(32),
--     model VARCHAR(64),
--     token_input INT,
--     token_output INT,
--     token_total INT GENERATED ALWAYS AS (COALESCE(token_input,0) + COALESCE(token_output,0)) STORED,
--     cost_input NUMERIC(10,6),
--     cost_output NUMERIC(10,6),
--     cost_total NUMERIC(10,6) GENERATED ALWAYS AS (COALESCE(cost_input,0) + COALESCE(cost_output,0)) STORED,
--     finish_reason VARCHAR(32),
--     raw_response JSONB,
--     raw_request JSONB,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--     FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
-- );

-- Step 2: Migrate data from old table to new table
-- INSERT INTO chat_interactions_new (
--     user_id, session_id, prompt, response, role, model, 
--     token_input, token_output, cost_input, cost_output,
--     api_call_id, raw_request, raw_response, created_at
-- )
-- SELECT 
--     user_id, session_id, prompt, response, role, model,
--     tokens_input, tokens_output, 
--     CASE WHEN cost_usd IS NOT NULL THEN cost_usd * 0.5 ELSE NULL END as cost_input,
--     CASE WHEN cost_usd IS NOT NULL THEN cost_usd * 0.5 ELSE NULL END as cost_output,
--     api_call_id, raw_request, raw_respond, created_at
-- FROM chat_interactions;

-- Step 3: Drop old table and rename new table
-- DROP TABLE chat_interactions;
-- ALTER TABLE chat_interactions_new RENAME TO chat_interactions;

-- Step 4: Recreate indexes
-- CREATE INDEX IF NOT EXISTS idx_chat_interactions_user_id ON chat_interactions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_chat_interactions_session_id ON chat_interactions(session_id);
-- CREATE INDEX IF NOT EXISTS idx_chat_interactions_created_at ON chat_interactions(created_at);
-- CREATE INDEX IF NOT EXISTS idx_chat_interactions_scenario ON chat_interactions(scenario);
-- CREATE INDEX IF NOT EXISTS idx_chat_interactions_task_code ON chat_interactions(task_code);
-- CREATE INDEX IF NOT EXISTS idx_chat_interactions_prompt_index_no ON chat_interactions(prompt_index_no);
