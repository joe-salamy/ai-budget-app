-- Add updated_at to categories and subcategories
-- Add deleted_at to spending_goals and saving_goals
-- Created: 2026-01-24

-- Add updated_at column to categories
ALTER TABLE categories ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add updated_at column to subcategories
ALTER TABLE subcategories ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add deleted_at column to spending_goals
ALTER TABLE spending_goals ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add deleted_at column to saving_goals
ALTER TABLE saving_goals ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create triggers for auto-updating updated_at on categories and subcategories
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for deleted_at columns
CREATE INDEX idx_spending_goals_deleted_at ON spending_goals(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_saving_goals_deleted_at ON saving_goals(deleted_at) WHERE deleted_at IS NULL;
