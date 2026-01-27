-- Optional migration script to copy existing spending_goals data to subcategories.monthly_goal
-- This script helps migrate from the old spending_goals table to the new monthly_goal column
--
-- NOTE: This migration only handles monthly goals. If you have goals with other periods
-- (weekly, quarterly, annual), you'll need to manually convert them or keep the spending_goals table.

-- Copy monthly spending goals to subcategories
UPDATE subcategories s
SET monthly_goal = sg.amount
FROM spending_goals sg
WHERE s.id = sg.subcategory_id
  AND sg.period = 'monthly'
  AND sg.deleted_at IS NULL
  AND s.deleted_at IS NULL
  AND s.monthly_goal IS NULL; -- Only update if not already set

-- You can optionally soft-delete the migrated spending goals after verifying the migration
-- Uncomment the following line if you want to do this:
-- UPDATE spending_goals SET deleted_at = now() WHERE period = 'monthly';

-- Note: The spending_goals table is NOT being dropped in this migration
-- If you want to completely remove it, you can do so manually after ensuring
-- you no longer need the historical data or non-monthly goals
