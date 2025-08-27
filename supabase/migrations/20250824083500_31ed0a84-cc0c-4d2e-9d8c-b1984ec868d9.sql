-- Re-enable RLS on reward_redemptions now that we fixed the manager approval issue
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;