-- Migration to add structural quality metrics (likert scale) to chat_interactions and user_sessions tables
-- This migration adds 11 likert scale columns for evaluating prompt structural quality

-- Add structural quality columns to chat_interactions table
ALTER TABLE chat_interactions 
ADD COLUMN IF NOT EXISTS task_intent_specification SMALLINT,
ADD COLUMN IF NOT EXISTS goal_objective_articulation SMALLINT,
ADD COLUMN IF NOT EXISTS persona_role_definition SMALLINT,
ADD COLUMN IF NOT EXISTS step_by_step_decomposition SMALLINT,
ADD COLUMN IF NOT EXISTS chain_of_thought_structure SMALLINT,
ADD COLUMN IF NOT EXISTS context_provisioning SMALLINT,
ADD COLUMN IF NOT EXISTS reference_use SMALLINT,
ADD COLUMN IF NOT EXISTS example_use SMALLINT,
ADD COLUMN IF NOT EXISTS tonality_writing_style SMALLINT,
ADD COLUMN IF NOT EXISTS output_format_specification SMALLINT,
ADD COLUMN IF NOT EXISTS information_hierarchy SMALLINT,
-- Add comment columns for justifications
ADD COLUMN IF NOT EXISTS task_intent_specification_comment TEXT,
ADD COLUMN IF NOT EXISTS goal_objective_articulation_comment TEXT,
ADD COLUMN IF NOT EXISTS persona_role_definition_comment TEXT,
ADD COLUMN IF NOT EXISTS step_by_step_decomposition_comment TEXT,
ADD COLUMN IF NOT EXISTS chain_of_thought_structure_comment TEXT,
ADD COLUMN IF NOT EXISTS context_provisioning_comment TEXT,
ADD COLUMN IF NOT EXISTS reference_use_comment TEXT,
ADD COLUMN IF NOT EXISTS example_use_comment TEXT,
ADD COLUMN IF NOT EXISTS tonality_writing_style_comment TEXT,
ADD COLUMN IF NOT EXISTS output_format_specification_comment TEXT,
ADD COLUMN IF NOT EXISTS information_hierarchy_comment TEXT;

-- Add aggregate structural quality columns to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS avg_task_intent_specification NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_goal_objective_articulation NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_persona_role_definition NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_step_by_step_decomposition NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_chain_of_thought_structure NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_context_provisioning NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_reference_use NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_example_use NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_tonality_writing_style NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_output_format_specification NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS avg_information_hierarchy NUMERIC(6,2);

-- Add indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_chat_interactions_task_intent_specification ON chat_interactions(task_intent_specification);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_goal_objective_articulation ON chat_interactions(goal_objective_articulation);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_persona_role_definition ON chat_interactions(persona_role_definition);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_step_by_step_decomposition ON chat_interactions(step_by_step_decomposition);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_chain_of_thought_structure ON chat_interactions(chain_of_thought_structure);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_context_provisioning ON chat_interactions(context_provisioning);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_reference_use ON chat_interactions(reference_use);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_example_use ON chat_interactions(example_use);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_tonality_writing_style ON chat_interactions(tonality_writing_style);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_output_format_specification ON chat_interactions(output_format_specification);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_information_hierarchy ON chat_interactions(information_hierarchy);

-- Add comments to document the new columns
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

-- Add comments for comment columns
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
