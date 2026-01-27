-- Add monthly_goal column to subcategories table
-- This eliminates the need for the separate spending_goals table
-- Monthly goals are now directly attached to subcategories

-- Add the monthly_goal column to subcategories
ALTER TABLE subcategories
ADD COLUMN IF NOT EXISTS monthly_goal DECIMAL(12, 2);

-- Add check constraint to ensure positive goals
ALTER TABLE subcategories
ADD CONSTRAINT positive_monthly_goal CHECK (monthly_goal IS NULL OR monthly_goal > 0);

-- Add index for monthly_goal queries
CREATE INDEX IF NOT EXISTS idx_subcategories_monthly_goal ON subcategories(monthly_goal) WHERE monthly_goal IS NOT NULL;

-- Add comment
COMMENT ON COLUMN subcategories.monthly_goal IS 'Monthly budget goal for this subcategory (applies to both income and expense)';
