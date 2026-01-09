-- AI Budget App - Row Level Security Policies
-- Phase 1: Database Schema & Backend Setup
-- Created: 2026-01-08
--
-- SECURITY MODEL:
-- - Users can only access their own data
-- - System categories/subcategories (is_system=true) are readable by all authenticated users
-- - System categories/subcategories cannot be modified or deleted by users
-- - All policies use auth.uid() to ensure user isolation

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PREFERENCES POLICIES
-- ============================================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences (auto-created by trigger, but policy needed)
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ACCOUNTS POLICIES
-- ============================================================================

-- Users can view their own accounts
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own accounts (soft delete via deleted_at)
CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

-- Users can view their own categories AND system categories (where user_id IS NULL)
CREATE POLICY "Users can view own and system categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id OR (is_system = true AND user_id IS NULL));

-- Users can insert their own categories (not system categories)
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can update their own non-system categories
CREATE POLICY "Users can update own non-system categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can delete their own non-system categories
CREATE POLICY "Users can delete own non-system categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- ============================================================================
-- SUBCATEGORIES POLICIES
-- ============================================================================

-- Users can view their own subcategories AND system subcategories (where user_id IS NULL)
CREATE POLICY "Users can view own and system subcategories"
  ON subcategories FOR SELECT
  USING (auth.uid() = user_id OR (is_system = true AND user_id IS NULL));

-- Users can insert their own subcategories (not system subcategories)
CREATE POLICY "Users can insert own subcategories"
  ON subcategories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can update their own non-system subcategories
CREATE POLICY "Users can update own non-system subcategories"
  ON subcategories FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can delete their own non-system subcategories
CREATE POLICY "Users can delete own non-system subcategories"
  ON subcategories FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- ============================================================================
-- TRANSACTIONS POLICIES
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own transactions (soft delete via deleted_at)
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SPENDING GOALS POLICIES
-- ============================================================================

-- Users can view their own spending goals
CREATE POLICY "Users can view own spending goals"
  ON spending_goals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own spending goals
CREATE POLICY "Users can insert own spending goals"
  ON spending_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own spending goals
CREATE POLICY "Users can update own spending goals"
  ON spending_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own spending goals
CREATE POLICY "Users can delete own spending goals"
  ON spending_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SAVING GOALS POLICIES
-- ============================================================================

-- Users can view their own saving goals
CREATE POLICY "Users can view own saving goals"
  ON saving_goals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saving goals
CREATE POLICY "Users can insert own saving goals"
  ON saving_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saving goals
CREATE POLICY "Users can update own saving goals"
  ON saving_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saving goals
CREATE POLICY "Users can delete own saving goals"
  ON saving_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI CORRECTIONS POLICIES
-- ============================================================================

-- Users can view their own AI corrections
CREATE POLICY "Users can view own ai corrections"
  ON ai_corrections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own AI corrections
CREATE POLICY "Users can insert own ai corrections"
  ON ai_corrections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI corrections
CREATE POLICY "Users can update own ai corrections"
  ON ai_corrections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own AI corrections
CREATE POLICY "Users can delete own ai corrections"
  ON ai_corrections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHAT SESSIONS POLICIES
-- ============================================================================

-- Users can view their own chat sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own chat sessions
CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHAT MESSAGES POLICIES
-- ============================================================================

-- Users can view their own chat messages
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own chat messages
CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat messages
CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chat messages
CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after applying policies to verify RLS is working:
--
-- 1. Verify all tables have RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = true;
--
-- 2. List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public';
--
-- 3. Test cross-user access (should return 0 rows):
-- -- As user A, try to access user B's data:
-- SELECT * FROM transactions WHERE user_id != auth.uid();
