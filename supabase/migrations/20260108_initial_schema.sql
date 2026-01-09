-- AI Budget App - Initial Database Schema
-- Phase 1: Database Schema & Backend Setup
-- Created: 2026-01-08

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE account_type AS ENUM ('asset', 'liability');
CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE goal_period AS ENUM ('weekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE ai_personality AS ENUM ('professional', 'friendly', 'stern');
CREATE TYPE chat_role AS ENUM ('user', 'assistant');

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Preferences Table
-- Stores user-specific settings and preferences
-- ----------------------------------------------------------------------------
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_personality ai_personality NOT NULL DEFAULT 'friendly',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ----------------------------------------------------------------------------
-- Accounts Table
-- Stores user's financial accounts (bank accounts, credit cards, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  initial_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_account_name_per_user UNIQUE(user_id, name, deleted_at)
);

-- ----------------------------------------------------------------------------
-- Categories Table
-- Top-level categorization for transactions (income/expense)
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type category_type NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_category_name_per_user UNIQUE(user_id, name, deleted_at)
);

-- ----------------------------------------------------------------------------
-- Subcategories Table
-- Detailed categorization under parent categories
-- ----------------------------------------------------------------------------
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_subcategory_name_per_user UNIQUE(user_id, name, deleted_at)
);

-- ----------------------------------------------------------------------------
-- Transactions Table
-- Individual financial transactions
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  comment TEXT,
  is_initial_balance BOOLEAN NOT NULL DEFAULT false,
  is_transfer BOOLEAN NOT NULL DEFAULT false,
  transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  ai_suggested BOOLEAN NOT NULL DEFAULT false,
  user_corrected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- Spending Goals Table
-- Budget goals for specific subcategories
-- ----------------------------------------------------------------------------
CREATE TABLE spending_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  period goal_period NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT positive_goal_amount CHECK (amount > 0)
);

-- ----------------------------------------------------------------------------
-- Saving Goals Table
-- Long-term savings targets
-- ----------------------------------------------------------------------------
CREATE TABLE saving_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2),
  target_date DATE,
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT at_least_one_target CHECK (target_amount IS NOT NULL OR target_date IS NOT NULL)
);

-- ----------------------------------------------------------------------------
-- AI Corrections Table
-- Stores user corrections to AI categorization suggestions
-- Used to improve future AI predictions
-- ----------------------------------------------------------------------------
CREATE TABLE ai_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_name TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  ai_suggested_subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  user_corrected_subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Chat Sessions Table
-- Stores AI chatbot conversation sessions
-- ----------------------------------------------------------------------------
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Chat Messages Table
-- Individual messages within chat sessions
-- ----------------------------------------------------------------------------
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  function_calls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User Preferences
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Accounts
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_deleted_at ON accounts(deleted_at) WHERE deleted_at IS NULL;

-- Categories
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;

-- Subcategories
CREATE INDEX idx_subcategories_user_id ON subcategories(user_id);
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_deleted_at ON subcategories(deleted_at) WHERE deleted_at IS NULL;

-- Transactions (most frequently queried)
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_subcategory_id ON transactions(subcategory_id);
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_lookup ON transactions(user_id, account_id, name) WHERE deleted_at IS NULL;

-- Spending Goals
CREATE INDEX idx_spending_goals_user_id ON spending_goals(user_id);
CREATE INDEX idx_spending_goals_subcategory_id ON spending_goals(subcategory_id);

-- Saving Goals
CREATE INDEX idx_saving_goals_user_id ON saving_goals(user_id);
CREATE INDEX idx_saving_goals_account_id ON saving_goals(account_id);

-- AI Corrections
CREATE INDEX idx_ai_corrections_user_id ON ai_corrections(user_id);
CREATE INDEX idx_ai_corrections_account_id ON ai_corrections(account_id);
CREATE INDEX idx_ai_corrections_lookup ON ai_corrections(user_id, account_id, transaction_name);

-- Chat Sessions
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

-- Chat Messages
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spending_goals_updated_at BEFORE UPDATE ON spending_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saving_goals_updated_at BEFORE UPDATE ON saving_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user_preferences row on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_preferences IS 'User-specific settings and AI preferences';
COMMENT ON TABLE accounts IS 'Financial accounts (assets and liabilities)';
COMMENT ON TABLE categories IS 'Top-level transaction categories';
COMMENT ON TABLE subcategories IS 'Detailed transaction subcategories';
COMMENT ON TABLE transactions IS 'Individual financial transactions';
COMMENT ON TABLE spending_goals IS 'Budget goals for subcategories';
COMMENT ON TABLE saving_goals IS 'Long-term savings targets';
COMMENT ON TABLE ai_corrections IS 'User corrections to AI categorization for learning';
COMMENT ON TABLE chat_sessions IS 'AI chatbot conversation sessions';
COMMENT ON TABLE chat_messages IS 'Individual messages in chat sessions';

COMMENT ON COLUMN transactions.name IS 'Transaction description (merchant/payee name), NOT account or category name';
COMMENT ON COLUMN transactions.amount IS 'Positive for income, negative for expenses';
COMMENT ON COLUMN transactions.is_initial_balance IS 'True if this transaction represents the account starting balance';
COMMENT ON COLUMN transactions.is_transfer IS 'True if this is a transfer between accounts';
COMMENT ON COLUMN transactions.ai_suggested IS 'True if AI auto-categorized this transaction';
COMMENT ON COLUMN transactions.user_corrected IS 'True if user overrode AI suggestion';
