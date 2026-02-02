-- Add Missing Foreign Key Indexes
-- Fix: Unindexed foreign keys performance warnings
-- Created: 2026-02-02
--
-- Issue: Foreign key columns without indexes can cause performance issues
-- Solution: Add indexes to foreign key columns for faster joins and lookups
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

-- ============================================================================
-- AI CORRECTIONS TABLE
-- ============================================================================

-- Add index for ai_suggested_subcategory_id foreign key
CREATE INDEX IF NOT EXISTS idx_ai_corrections_ai_suggested_subcategory_id
  ON ai_corrections(ai_suggested_subcategory_id);

-- Add index for user_corrected_subcategory_id foreign key
CREATE INDEX IF NOT EXISTS idx_ai_corrections_user_corrected_subcategory_id
  ON ai_corrections(user_corrected_subcategory_id);
