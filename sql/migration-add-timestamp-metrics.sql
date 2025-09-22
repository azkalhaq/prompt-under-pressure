-- Migration script to add timestamp metrics to chat_interactions table
-- Run this script to add the new timestamp columns to existing databases

-- Add the new timestamp columns
ALTER TABLE chat_interactions 
ADD COLUMN IF NOT EXISTS first_response_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS latency INTEGER;


-- Add comments to document the new columns
COMMENT ON COLUMN chat_interactions.first_response_time IS 'Time when first response chunk received from OpenAI API';
COMMENT ON COLUMN chat_interactions.latency IS 'API latency in milliseconds (time from request to first response)';
