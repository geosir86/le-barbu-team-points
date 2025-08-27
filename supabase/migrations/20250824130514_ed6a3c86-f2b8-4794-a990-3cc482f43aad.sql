-- Fix the RPC function to use 'spend' instead of 'redeem' for transaction_type
CREATE OR REPLACE FUNCTION approve_reward_redemption(
  redemption_id UUID,
  manager_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    -- 3. THIRD: Create employee event - Fixed transaction_type
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
      'spend'  -- Changed from 'redeem' to 'spend'
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