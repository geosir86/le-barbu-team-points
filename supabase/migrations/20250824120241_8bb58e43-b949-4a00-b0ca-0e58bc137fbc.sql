-- Delete the problematic old pending request that couldn't be cancelled due to RLS permissions
DELETE FROM reward_redemptions 
WHERE id = 'd5309c81-5569-4de6-99e8-45c3b92b3d12' 
  AND employee_id = 'fc1791f0-62bf-4494-9e16-de4380794eee' 
  AND status = 'pending';