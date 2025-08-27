-- Fix RLS Policy for reward_redemptions to allow managers to approve
DROP POLICY IF EXISTS "Employees can cancel own pending requests" ON reward_redemptions;

CREATE POLICY "Employees can cancel own pending requests" ON reward_redemptions
FOR UPDATE
USING (
  (employee_id::text = current_setting('app.current_employee_id', true)) 
  AND status = 'pending'
)
WITH CHECK (
  -- Allow employees to only cancel/keep pending AND allow managers everything
  ((employee_id::text = current_setting('app.current_employee_id', true)) 
   AND status = ANY(ARRAY['cancelled', 'pending'])) 
  OR is_manager()
);

-- Create atomic RPC function for reward redemption approval
CREATE OR REPLACE FUNCTION approve_reward_redemption(
  redemption_id UUID,
  manager_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  redemption_record reward_redemptions%ROWTYPE;
  result JSON;
BEGIN
  -- Check if user is manager
  IF NOT is_manager() THEN
    RAISE EXCEPTION 'Unauthorized: Only managers can approve redemptions';
  END IF;

  -- Find the pending redemption request
  SELECT * INTO redemption_record 
  FROM reward_redemptions 
  WHERE id = redemption_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Redemption request not found or already processed';
  END IF;

  -- Atomic transaction with correct order
  BEGIN
    -- 1. FIRST: Update redemption status to approved
    UPDATE reward_redemptions 
    SET 
      status = 'approved',
      approved_at = NOW(),
      approved_by = 'manager',
      manager_comment = manager_notes
    WHERE id = redemption_id;

    -- 2. SECOND: Deduct points from employee (only after approval)
    UPDATE employees 
    SET 
      points_balance = points_balance - redemption_record.points_cost,
      updated_at = NOW()
    WHERE id = redemption_record.employee_id;

    -- 3. THIRD: Create employee event
    INSERT INTO employee_events (
      employee_id,
      event_type,
      points,
      description,
      created_by,
      transaction_type
    ) VALUES (
      redemption_record.employee_id,
      'reward_redemption',
      -redemption_record.points_cost,
      'Εξαργύρωση ανταμοιβής: ' || redemption_record.reward_name,
      'manager',
      'redeem'
    );

    result := json_build_object(
      'success', true,
      'message', 'Reward redemption approved successfully'
    );

  EXCEPTION WHEN OTHERS THEN
    -- Automatic rollback on any error
    RAISE EXCEPTION 'Failed to approve redemption: %', SQLERRM;
  END;

  RETURN result;
END;
$$;

-- Create atomic RPC function for reward redemption rejection
CREATE OR REPLACE FUNCTION reject_reward_redemption(
  redemption_id UUID,
  manager_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  redemption_record reward_redemptions%ROWTYPE;
  result JSON;
BEGIN
  -- Check if user is manager
  IF NOT is_manager() THEN
    RAISE EXCEPTION 'Unauthorized: Only managers can reject redemptions';
  END IF;

  -- Find the pending redemption request
  SELECT * INTO redemption_record 
  FROM reward_redemptions 
  WHERE id = redemption_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Redemption request not found or already processed';
  END IF;

  -- Update redemption status to rejected (no points deduction)
  UPDATE reward_redemptions 
  SET 
    status = 'rejected',
    decided_at = NOW(),
    approved_by = 'manager',
    manager_comment = manager_notes
  WHERE id = redemption_id;

  result := json_build_object(
    'success', true,
    'message', 'Reward redemption rejected successfully'
  );

  RETURN result;
END;
$$;