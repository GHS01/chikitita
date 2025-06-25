-- Migration: Add advanced trainer settings
-- Date: 2024-12-19
-- Description: Add avatar, personality type, and custom personality fields to trainer_config table

-- Add new columns to trainer_config table
ALTER TABLE trainer_config 
ADD COLUMN IF NOT EXISTS trainer_avatar TEXT,
ADD COLUMN IF NOT EXISTS personality_type VARCHAR(20) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS custom_personality TEXT;

-- Add check constraint for personality_type
ALTER TABLE trainer_config 
ADD CONSTRAINT check_personality_type 
CHECK (personality_type IN ('default', 'motivator', 'sensei', 'warrior', 'empathetic', 'strategist', 'custom'));

-- Update existing records to have default personality type
UPDATE trainer_config 
SET personality_type = 'default' 
WHERE personality_type IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN trainer_config.trainer_avatar IS 'Base64 encoded image or URL for trainer avatar';
COMMENT ON COLUMN trainer_config.personality_type IS 'Predefined personality type: default, motivator, sensei, warrior, empathetic, strategist, custom';
COMMENT ON COLUMN trainer_config.custom_personality IS 'Custom personality description when personality_type is custom';
