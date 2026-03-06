-- Add description field to supplements table for detailed Weekly Wellness information
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_supplements_active ON supplements(is_active);

-- Update existing supplements with descriptions
UPDATE supplements 
SET description = '매주 바뀌는 프리미엄 건강기능식품 1회분 제공'
WHERE description IS NULL;

-- Add comments
COMMENT ON COLUMN supplements.description IS 'Detailed description of the weekly wellness supplement';
