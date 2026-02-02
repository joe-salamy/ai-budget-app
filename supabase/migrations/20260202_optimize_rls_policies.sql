-- Optimize RLS Policies for Performance
-- Fix: Auth RLS Initialization Plan warnings
-- Created: 2026-02-02
--
-- Issue: auth.uid() calls in RLS policies are re-evaluated for each row
-- Solution: Wrap auth.uid() in SELECT subquery: (select auth.uid())
-- This causes the function to be evaluated once instead of per-row
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- USER PREFERENCES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- ACCOUNTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;

CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own and system categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own non-system categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own non-system categories" ON categories;

CREATE POLICY "Users can view own and system categories"
  ON categories FOR SELECT
  USING ((select auth.uid()) = user_id OR (is_system = true AND user_id IS NULL));

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id AND is_system = false);

CREATE POLICY "Users can update own non-system categories"
  ON categories FOR UPDATE
  USING ((select auth.uid()) = user_id AND is_system = false)
  WITH CHECK ((select auth.uid()) = user_id AND is_system = false);

CREATE POLICY "Users can delete own non-system categories"
  ON categories FOR DELETE
  USING ((select auth.uid()) = user_id AND is_system = false);

-- ============================================================================
-- SUBCATEGORIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own and system subcategories" ON subcategories;
DROP POLICY IF EXISTS "Users can insert own subcategories" ON subcategories;
DROP POLICY IF EXISTS "Users can update own non-system subcategories" ON subcategories;
DROP POLICY IF EXISTS "Users can delete own non-system subcategories" ON subcategories;

CREATE POLICY "Users can view own and system subcategories"
  ON subcategories FOR SELECT
  USING ((select auth.uid()) = user_id OR (is_system = true AND user_id IS NULL));

CREATE POLICY "Users can insert own subcategories"
  ON subcategories FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id AND is_system = false);

CREATE POLICY "Users can update own non-system subcategories"
  ON subcategories FOR UPDATE
  USING ((select auth.uid()) = user_id AND is_system = false)
  WITH CHECK ((select auth.uid()) = user_id AND is_system = false);

CREATE POLICY "Users can delete own non-system subcategories"
  ON subcategories FOR DELETE
  USING ((select auth.uid()) = user_id AND is_system = false);

-- ============================================================================
-- TRANSACTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- SPENDING GOALS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own spending goals" ON spending_goals;
DROP POLICY IF EXISTS "Users can insert own spending goals" ON spending_goals;
DROP POLICY IF EXISTS "Users can update own spending goals" ON spending_goals;
DROP POLICY IF EXISTS "Users can delete own spending goals" ON spending_goals;

CREATE POLICY "Users can view own spending goals"
  ON spending_goals FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own spending goals"
  ON spending_goals FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own spending goals"
  ON spending_goals FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own spending goals"
  ON spending_goals FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- AI CORRECTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own ai corrections" ON ai_corrections;
DROP POLICY IF EXISTS "Users can insert own ai corrections" ON ai_corrections;
DROP POLICY IF EXISTS "Users can update own ai corrections" ON ai_corrections;
DROP POLICY IF EXISTS "Users can delete own ai corrections" ON ai_corrections;

CREATE POLICY "Users can view own ai corrections"
  ON ai_corrections FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own ai corrections"
  ON ai_corrections FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own ai corrections"
  ON ai_corrections FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own ai corrections"
  ON ai_corrections FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CHAT SESSIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CHAT MESSAGES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON chat_messages;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  USING ((select auth.uid()) = user_id);
