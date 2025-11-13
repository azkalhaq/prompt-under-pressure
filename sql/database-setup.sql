-- Database setup for Next.js Pup Project
-- This file sets up the unified session system for both Stroop tests and Chat interactions

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,                         -- surrogate key
    user_id VARCHAR(128) UNIQUE NOT NULL,             -- unique user identifier (generated unique id based on n alphanumeric char - configurable)
    email VARCHAR(255) UNIQUE,                        -- user's email address
    username VARCHAR(255) UNIQUE,                     -- username (optional, default value use email)
    name VARCHAR(255),                                -- fullname
    passcode VARCHAR(6) NOT NULL,                     -- 6-digit random passcode (auto-generated)
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
    -- aggregated structural quality metrics (likert 1-5 averages unless noted)
    avg_task_intent_specification NUMERIC(6,2),       -- average task intent specification score across prompts
    avg_goal_objective_articulation NUMERIC(6,2),     -- average goal/objective articulation score across prompts
    avg_persona_role_definition NUMERIC(6,2),         -- average persona/role definition score across prompts
    avg_step_by_step_decomposition NUMERIC(6,2),      -- average step-by-step decomposition score across prompts
    avg_chain_of_thought_structure NUMERIC(6,2),      -- average chain-of-thought structure score across prompts
    avg_context_provisioning NUMERIC(6,2),            -- average context provisioning score across prompts
    avg_reference_use NUMERIC(6,2),                   -- average reference use score across prompts
    avg_example_use NUMERIC(6,2),                     -- average example use score across prompts
    avg_tonality_writing_style NUMERIC(6,2),          -- average tonality/writing style score across prompts
    avg_output_format_specification NUMERIC(6,2),     -- average output format specification score across prompts
    avg_information_hierarchy NUMERIC(6,2),           -- average information hierarchy score across prompts
    session_prompt_strategy_classification TEXT,      -- dominant prompt strategy classification across session
    session_prompt_strategy_justification TEXT,       -- justification for session-level classification
    submitted_result TEXT,                            -- final text submitted by the user
    confidence INTEGER,                               -- confidence level of the user's submission
    audio_code VARCHAR(255),                          -- audio code entered by user during submission
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
    scenario VARCHAR(24) NOT NULL CHECK (scenario IN ('baseline', 'dual_task', 'under_stress', 'time_pressure', 'cognitive_load')), -- derived from page
    task_code VARCHAR(64),                            -- from ?task= query param; NULL if absent
    prompt_index_no INT NOT NULL,                     -- order within same session (1..N)
    prompt TEXT NOT NULL,                             -- user-entered text
    response TEXT,                                    -- LLM response text

    -- prompt metrics / quality
    word_count INT,                                   -- number of words in prompt
    char_count INT,                                   -- number of characters in prompt
    vocab_count INT,                                  -- unique vocabulary count in prompt
    
    -- basic text analysis metrics
    letter_count INT,                                 -- number of letters (excluding punctuation)
    syllable_count INT,                               -- number of syllables in prompt
    sentence_count INT,                               -- number of sentences in prompt
    
    -- average calculation metrics
    average_sentence_length NUMERIC(6,2),             -- average words per sentence
    average_syllable_per_word NUMERIC(6,2),           -- average syllables per word
    average_character_per_word NUMERIC(6,2),          -- average characters per word
    average_letter_per_word NUMERIC(6,2),             -- average letters per word
    average_sentence_per_word NUMERIC(6,2),           -- average sentences per word
    
    -- readability index metrics
    flesch_reading_ease NUMERIC(6,2),                 -- Flesch Reading Ease (prompt)
    flesch_reading_ease_grade NUMERIC(6,2),           -- Flesch Reading Ease converted to grade level
    flesch_kincaid_grade NUMERIC(6,2),                -- Flesch–Kincaid Grade (prompt)
    poly_syllable_count INT,                          -- count of polysyllabic words (3+ syllables)
    smog_index NUMERIC(6,2),                          -- SMOG Index (prompt)
    coleman_liau_index NUMERIC(6,2),                  -- Coleman-Liau Index (prompt)
    automated_readability_index NUMERIC(6,2),         -- Automated Readability Index (prompt)
    dale_chall_readability_score NUMERIC(6,2),        -- Dale-Chall Readability Score (prompt)
    dale_chall_grade NUMERIC(6,2),                    -- Dale-Chall score converted to grade level
    difficult_words INT,                              -- Difficult words count (prompt)
    linsear_write_formula NUMERIC(6,2),               -- Linsear Write Formula (prompt)
    gunning_fog NUMERIC(6,2),                         -- Gunning Fog Index (prompt)
    lix_score NUMERIC(6,2),                           -- LIX Readability Measure (prompt)
    rix_score NUMERIC(6,2),                           -- RIX Readability Measure (prompt)
    
    -- composite readability metrics
    text_standard_score NUMERIC(6,2),                 -- Overall readability consensus score
    text_standard_grade TEXT,                         -- Overall readability consensus grade (string)
    text_median_score NUMERIC(6,2),                   -- Median readability score across all indices

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
    
    -- structural quality metrics (Likert 1-5 unless noted)
    task_intent_specification SMALLINT,               -- Likert (1-5): clarity of task intent
    goal_objective_articulation SMALLINT,             -- Likert (1-5): clarity of goal/objective
    persona_role_definition SMALLINT,                 -- Likert (1-5): presence of persona/role
    step_by_step_decomposition SMALLINT,              -- Likert (1-5): decomposes task into steps
    chain_of_thought_structure SMALLINT,              -- Likert (1-5): encourages reasoning before answer
    context_provisioning SMALLINT,                    -- Likert (1-5): provides relevant background
    reference_use SMALLINT,                           -- Likert (1-5): uses references/examples
    example_use SMALLINT,                             -- Likert (1-5): includes concrete examples
    tonality_writing_style SMALLINT,                  -- Likert (1-5): specifies tone or style
    output_format_specification SMALLINT,             -- Likert (1-5): describes expected output format
    information_hierarchy SMALLINT,                   -- Likert (1-5): organizes info clearly

    -- structural quality annotations
    prompt_strategy_classification TEXT,              -- auto-detected prompt strategy label
    prompt_strategy_justification TEXT,               -- explanation for strategy classification
    task_intent_specification_comment TEXT,           -- justification for task intent score
    goal_objective_articulation_comment TEXT,         -- justification for goal/objective score
    persona_role_definition_comment TEXT,             -- justification for persona/role score
    step_by_step_decomposition_comment TEXT,          -- justification for decomposition score
    chain_of_thought_structure_comment TEXT,          -- justification for reasoning score
    context_provisioning_comment TEXT,                -- justification for context score
    reference_use_comment TEXT,                       -- justification for reference use score
    example_use_comment TEXT,                         -- justification for example use score
    tonality_writing_style_comment TEXT,              -- justification for tone/style score
    output_format_specification_comment TEXT,         -- justification for format specification score
    information_hierarchy_comment TEXT,               -- justification for information hierarchy score
    
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
    first_response_time TIMESTAMPTZ,                  -- time when first response chunk received from OpenAI API
    latency INTEGER,                                   -- API latency in milliseconds (time from request to first response)

    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_passcode ON users(passcode);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_user_id ON stroop_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_stroop_trials_session_id ON stroop_trials(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_user_id ON chat_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_session_id ON chat_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_created_at ON chat_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_scenario ON chat_interactions(scenario);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_task_code ON chat_interactions(task_code);

-- Column documentation
COMMENT ON COLUMN chat_interactions.scenario IS 'baseline | dual_task | under_stress | time_pressure | cognitive_load (derived from page)';
COMMENT ON COLUMN chat_interactions.prompting_time_ms IS 'Milliseconds the participant spent composing the prompt before sending';
COMMENT ON COLUMN chat_interactions.task_code IS 'Task code captured from ?task= query parameter';
COMMENT ON COLUMN chat_interactions.prompt_index_no IS 'Sequential index of the prompt within the session (1..N)';
COMMENT ON COLUMN chat_interactions.prompt IS 'Raw user-entered prompt text';
COMMENT ON COLUMN chat_interactions.response IS 'LLM response text returned to the user';
COMMENT ON COLUMN chat_interactions.word_count IS 'Number of whitespace-delimited words in the prompt';
COMMENT ON COLUMN chat_interactions.char_count IS 'Number of characters in the prompt';
COMMENT ON COLUMN chat_interactions.vocab_count IS 'Count of unique vocabulary terms in the prompt';
COMMENT ON COLUMN chat_interactions.first_response_time IS 'Time when first response chunk received from OpenAI API';
COMMENT ON COLUMN chat_interactions.latency IS 'API latency in milliseconds (time from request to first response)';
COMMENT ON COLUMN chat_interactions.letter_count IS 'Number of letters (excluding punctuation)';
COMMENT ON COLUMN chat_interactions.syllable_count IS 'Number of syllables in prompt';
COMMENT ON COLUMN chat_interactions.sentence_count IS 'Number of sentences in prompt';
COMMENT ON COLUMN chat_interactions.average_sentence_length IS 'Average words per sentence';
COMMENT ON COLUMN chat_interactions.average_syllable_per_word IS 'Average syllables per word';
COMMENT ON COLUMN chat_interactions.average_character_per_word IS 'Average characters per word';
COMMENT ON COLUMN chat_interactions.average_letter_per_word IS 'Average letters per word';
COMMENT ON COLUMN chat_interactions.average_sentence_per_word IS 'Average sentences per word';
COMMENT ON COLUMN chat_interactions.flesch_reading_ease IS 'Flesch Reading Ease score for the prompt';
COMMENT ON COLUMN chat_interactions.flesch_reading_ease_grade IS 'Flesch Reading Ease converted to grade level';
COMMENT ON COLUMN chat_interactions.flesch_kincaid_grade IS 'Flesch-Kincaid Grade Level for the prompt';
COMMENT ON COLUMN chat_interactions.poly_syllable_count IS 'Count of polysyllabic words (3+ syllables)';
COMMENT ON COLUMN chat_interactions.smog_index IS 'SMOG Index readability measure';
COMMENT ON COLUMN chat_interactions.dale_chall_grade IS 'Dale-Chall score converted to grade level';
COMMENT ON COLUMN chat_interactions.dale_chall_readability_score IS 'Dale-Chall readability score (numeric)';
COMMENT ON COLUMN chat_interactions.coleman_liau_index IS 'Coleman-Liau readability index';
COMMENT ON COLUMN chat_interactions.automated_readability_index IS 'Automated Readability Index value';
COMMENT ON COLUMN chat_interactions.linsear_write_formula IS 'Linsear Write readability formula score';
COMMENT ON COLUMN chat_interactions.gunning_fog IS 'Gunning Fog Index readability score';
COMMENT ON COLUMN chat_interactions.difficult_words IS 'Count of difficult words per Dale-Chall rules';
COMMENT ON COLUMN chat_interactions.lix_score IS 'LIX Readability Measure';
COMMENT ON COLUMN chat_interactions.rix_score IS 'RIX Readability Measure';
COMMENT ON COLUMN chat_interactions.text_standard_score IS 'Overall readability consensus score (numeric)';
COMMENT ON COLUMN chat_interactions.text_standard_grade IS 'Overall readability consensus grade (string)';
COMMENT ON COLUMN chat_interactions.text_median_score IS 'Median readability score across all indices';
COMMENT ON COLUMN chat_interactions.task_intent_specification IS 'Likert scale (1-5): Does the prompt clearly specify what the AI should do?';
COMMENT ON COLUMN chat_interactions.goal_objective_articulation IS 'Likert scale (1-5): Does it express the intended outcome or goal?';
COMMENT ON COLUMN chat_interactions.persona_role_definition IS 'Likert scale (1-5): Does it define a role or perspective for the AI to adopt?';
COMMENT ON COLUMN chat_interactions.step_by_step_decomposition IS 'Likert scale (1-5): Does it break the task into sub-steps or logical parts?';
COMMENT ON COLUMN chat_interactions.chain_of_thought_structure IS 'Likert scale (1-5): Does it encourage reasoning or explanation before the answer?';
COMMENT ON COLUMN chat_interactions.context_provisioning IS 'Likert scale (1-5): Does it provide relevant background or situational context?';
COMMENT ON COLUMN chat_interactions.reference_use IS 'Likert scale (1-5): Does it include references to external material, examples, or previous turns?';
COMMENT ON COLUMN chat_interactions.example_use IS 'Likert scale (1-5): Does it demonstrate what the expected response should look like?';
COMMENT ON COLUMN chat_interactions.tonality_writing_style IS 'Likert scale (1-5): Does it specify tone, style, or emotional intent?';
COMMENT ON COLUMN chat_interactions.output_format_specification IS 'Likert scale (1-5): Does it define the expected output structure or format?';
COMMENT ON COLUMN chat_interactions.information_hierarchy IS 'Likert scale (1-5): Is information organized clearly and logically within the prompt?';
COMMENT ON COLUMN chat_interactions.prompt_strategy_classification IS 'Automatically classified prompt strategy/technique used (e.g., zero-shot, few-shot, CoT, ReAct, etc.)';
COMMENT ON COLUMN chat_interactions.prompt_strategy_justification IS 'Short justification for the prompt strategy classification';
COMMENT ON COLUMN chat_interactions.task_intent_specification_comment IS 'Brief justification for task intent specification score';
COMMENT ON COLUMN chat_interactions.goal_objective_articulation_comment IS 'Brief justification for goal/objective articulation score';
COMMENT ON COLUMN chat_interactions.persona_role_definition_comment IS 'Brief justification for persona/role definition score';
COMMENT ON COLUMN chat_interactions.step_by_step_decomposition_comment IS 'Brief justification for step-by-step decomposition score';
COMMENT ON COLUMN chat_interactions.chain_of_thought_structure_comment IS 'Brief justification for chain-of-thought structure score';
COMMENT ON COLUMN chat_interactions.context_provisioning_comment IS 'Brief justification for context provisioning score';
COMMENT ON COLUMN chat_interactions.reference_use_comment IS 'Brief justification for reference use score';
COMMENT ON COLUMN chat_interactions.example_use_comment IS 'Brief justification for example use score';
COMMENT ON COLUMN chat_interactions.tonality_writing_style_comment IS 'Brief justification for tonality/writing style score';
COMMENT ON COLUMN chat_interactions.output_format_specification_comment IS 'Brief justification for output format specification score';
COMMENT ON COLUMN chat_interactions.information_hierarchy_comment IS 'Brief justification for information hierarchy score';
COMMENT ON COLUMN chat_interactions.reaction IS 'User feedback reaction to the response (up or down)';
COMMENT ON COLUMN chat_interactions.api_call_id IS 'Provider-assigned identifier for the API call (e.g., chatcmpl-...)';
COMMENT ON COLUMN chat_interactions.role_used IS 'Primary assistant role used when generating the response';
COMMENT ON COLUMN chat_interactions.model IS 'LLM model name used for the interaction';
COMMENT ON COLUMN chat_interactions.token_input IS 'Prompt tokens reported by the API';
COMMENT ON COLUMN chat_interactions.token_output IS 'Completion tokens reported by the API';
COMMENT ON COLUMN chat_interactions.token_total IS 'Total tokens (input + output) reported by the API';
COMMENT ON COLUMN chat_interactions.cost_input IS 'USD cost attributed to input tokens';
COMMENT ON COLUMN chat_interactions.cost_output IS 'USD cost attributed to output tokens';
COMMENT ON COLUMN chat_interactions.cost_total IS 'Total USD cost (input + output tokens)';
COMMENT ON COLUMN chat_interactions.finish_reason IS 'API-provided finish reason for the completion';
COMMENT ON COLUMN chat_interactions.raw_response IS 'Raw JSON response payload from the model provider';
COMMENT ON COLUMN chat_interactions.raw_request IS 'Raw JSON request payload sent to the model provider';
COMMENT ON COLUMN chat_interactions.created_at IS 'Timestamp when the chat interaction record was created';
COMMENT ON COLUMN user_sessions.avg_task_intent_specification IS 'Average task intent specification score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_goal_objective_articulation IS 'Average goal/objective articulation score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_persona_role_definition IS 'Average persona/role definition score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_step_by_step_decomposition IS 'Average step-by-step decomposition score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_chain_of_thought_structure IS 'Average chain-of-thought structure score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_context_provisioning IS 'Average context provisioning score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_reference_use IS 'Average reference use score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_example_use IS 'Average example use score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_tonality_writing_style IS 'Average tonality/writing style score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_output_format_specification IS 'Average output format specification score across all prompts in session';
COMMENT ON COLUMN user_sessions.avg_information_hierarchy IS 'Average information hierarchy score across all prompts in session';
COMMENT ON COLUMN user_sessions.session_prompt_strategy_classification IS 'Most common prompt strategy classification used across the session';
COMMENT ON COLUMN user_sessions.session_prompt_strategy_justification IS 'Justification for the session-level prompt strategy classification';

-- Migration script for existing data (if needed)
-- This will help migrate existing stroop_sessions to user_sessions
-- Run this only if you have existing data to migrate

-- ALTER TABLE stroop_sessions ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- ALTER TABLE stroop_sessions ADD COLUMN IF NOT EXISTS total_prompts INTEGER DEFAULT 0;
-- ALTER TABLE stroop_sessions RENAME COLUMN start_time TO start_stroop_time;
-- ALTER TABLE stroop_sessions RENAME TO user_sessions;

-- Migration script to add passcode column to existing users table
-- Run this if you have existing users without passcode
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS passcode VARCHAR(6);
-- CREATE INDEX IF NOT EXISTS idx_users_passcode ON users(passcode);
-- 
-- -- Update existing users with random 6-digit passcodes
-- UPDATE users 
-- SET passcode = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
-- WHERE passcode IS NULL;
-- 
-- -- Make passcode NOT NULL after populating existing records
-- ALTER TABLE users ALTER COLUMN passcode SET NOT NULL;

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
