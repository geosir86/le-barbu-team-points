-- Add missing fields to rewards_catalog table
ALTER TABLE rewards_catalog 
ADD COLUMN type text DEFAULT 'other' CHECK (type IN ('cash', 'dayoff', 'other')),
ADD COLUMN stock integer DEFAULT null;

-- Add missing fields to reward_redemptions table  
ALTER TABLE reward_redemptions
ADD COLUMN reward_id uuid REFERENCES rewards_catalog(id),
ADD COLUMN manager_id uuid REFERENCES employees(id),
ADD COLUMN manager_comment text,
ADD COLUMN delivered_code text,
ADD COLUMN created_at timestamp with time zone DEFAULT now(),
ADD COLUMN decided_at timestamp with time zone;

-- Rename redeemed_at to created_at for consistency
ALTER TABLE reward_redemptions RENAME COLUMN redeemed_at TO temp_redeemed_at;

-- Update existing records to use created_at
UPDATE reward_redemptions SET created_at = temp_redeemed_at WHERE created_at IS NULL;

-- Drop the old column
ALTER TABLE reward_redemptions DROP COLUMN temp_redeemed_at;

-- Add type enum to employee_events for better point transaction tracking
ALTER TABLE employee_events 
ADD COLUMN transaction_type text DEFAULT 'earn' CHECK (transaction_type IN ('earn', 'redeem', 'adjustment'));

-- Create index for better performance on redemption queries
CREATE INDEX idx_reward_redemptions_employee_status ON reward_redemptions(employee_id, status);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status) WHERE status = 'pending';