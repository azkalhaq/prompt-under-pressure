-- Migration: Add new scenario types to existing database
-- Run this script to update the database schema to support new scenario types

-- Update the scenario column constraint to allow new scenario types
-- Note: This assumes you're using PostgreSQL. Adjust for your database system.

-- First, drop the existing constraint if it exists
ALTER TABLE chat_interactions DROP CONSTRAINT IF EXISTS chat_interactions_scenario_check;

-- Add the new constraint with all scenario types
ALTER TABLE chat_interactions ADD CONSTRAINT chat_interactions_scenario_check 
    CHECK (scenario IN ('baseline', 'dual_task', 'under_stress', 'time_pressure', 'cognitive_load'));

-- Update the comment to reflect the new scenario types
COMMENT ON COLUMN chat_interactions.scenario IS 'baseline | dual_task | under_stress | time_pressure | cognitive_load (derived from page)';
