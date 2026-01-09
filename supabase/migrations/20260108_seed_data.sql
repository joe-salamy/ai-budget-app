-- AI Budget App - Seed Data
-- Phase 1: Database Schema & Backend Setup
-- Created: 2026-01-08
--
-- PURPOSE:
-- Creates system "Unassigned" categories and subcategories that all users can access
-- These are read-only for users and serve as fallbacks when categorization fails
-- or when users haven't set up their own categories yet
--
-- APPROACH: Make user_id nullable for system categories, then restore NOT NULL constraint
-- with a check that allows NULL only when is_system = true

-- ============================================================================
-- MODIFY SCHEMA TO ALLOW NULL user_id FOR SYSTEM CATEGORIES
-- ============================================================================

-- Make user_id nullable in categories table
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in subcategories table
ALTER TABLE subcategories ALTER COLUMN user_id DROP NOT NULL;

-- Add check constraints: user_id can only be NULL if is_system = true
ALTER TABLE categories ADD CONSTRAINT categories_user_id_check
  CHECK (user_id IS NOT NULL OR is_system = true);

ALTER TABLE subcategories ADD CONSTRAINT subcategories_user_id_check
  CHECK (user_id IS NOT NULL OR is_system = true);

-- ============================================================================
-- SYSTEM CATEGORIES
-- ============================================================================

-- Create system "Unassigned" category for INCOME
-- UUID is hardcoded to ensure consistency across environments
INSERT INTO categories (id, user_id, name, type, is_system, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  NULL, -- System categories have NULL user_id
  'Unassigned',
  'income',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING; -- Idempotent: safe to run multiple times

-- Create system "Unassigned" category for EXPENSE
INSERT INTO categories (id, user_id, name, type, is_system, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'Unassigned',
  'expense',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SYSTEM SUBCATEGORIES
-- ============================================================================

-- Create system "Unassigned" subcategory under Income category
INSERT INTO subcategories (id, user_id, category_id, name, is_system, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  NULL, -- System subcategories have NULL user_id
  '00000000-0000-0000-0000-000000000001'::uuid, -- Links to Income Unassigned category
  'Unassigned',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Create system "Unassigned" subcategory under Expense category
INSERT INTO subcategories (id, user_id, category_id, name, is_system, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000004'::uuid,
  NULL,
  '00000000-0000-0000-0000-000000000002'::uuid, -- Links to Expense Unassigned category
  'Unassigned',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify seed data was inserted correctly
DO $$
DECLARE
  income_cat_count INTEGER;
  expense_cat_count INTEGER;
  income_subcat_count INTEGER;
  expense_subcat_count INTEGER;
BEGIN
  -- Count system categories
  SELECT COUNT(*) INTO income_cat_count
  FROM categories
  WHERE is_system = true AND type = 'income';

  SELECT COUNT(*) INTO expense_cat_count
  FROM categories
  WHERE is_system = true AND type = 'expense';

  -- Count system subcategories
  SELECT COUNT(*) INTO income_subcat_count
  FROM subcategories
  WHERE is_system = true AND category_id = '00000000-0000-0000-0000-000000000001'::uuid;

  SELECT COUNT(*) INTO expense_subcat_count
  FROM subcategories
  WHERE is_system = true AND category_id = '00000000-0000-0000-0000-000000000002'::uuid;

  -- Raise notice with results
  RAISE NOTICE 'Seed data verification:';
  RAISE NOTICE '  Income categories (system): %', income_cat_count;
  RAISE NOTICE '  Expense categories (system): %', expense_cat_count;
  RAISE NOTICE '  Income subcategories (system): %', income_subcat_count;
  RAISE NOTICE '  Expense subcategories (system): %', expense_subcat_count;

  -- Assert all counts are correct
  IF income_cat_count != 1 OR expense_cat_count != 1 OR
     income_subcat_count != 1 OR expense_subcat_count != 1 THEN
    RAISE EXCEPTION 'Seed data verification failed! Expected 1 of each, got: income_cat=%, expense_cat=%, income_subcat=%, expense_subcat=%',
      income_cat_count, expense_cat_count, income_subcat_count, expense_subcat_count;
  END IF;

  RAISE NOTICE 'Seed data verification PASSED ✓';
END $$;

-- ============================================================================
-- REFERENCE UUIDs FOR APPLICATION USE
-- ============================================================================

-- IMPORTANT: Use these UUIDs in your application code when referencing system categories
--
-- INCOME_UNASSIGNED_CATEGORY_ID:    00000000-0000-0000-0000-000000000001
-- EXPENSE_UNASSIGNED_CATEGORY_ID:   00000000-0000-0000-0000-000000000002
-- INCOME_UNASSIGNED_SUBCATEGORY_ID: 00000000-0000-0000-0000-000000000003
-- EXPENSE_UNASSIGNED_SUBCATEGORY_ID: 00000000-0000-0000-0000-000000000004
--
-- Already added to src/config/constants.ts:
--
-- export const SYSTEM_CATEGORIES = {
--   INCOME_UNASSIGNED: '00000000-0000-0000-0000-000000000001',
--   EXPENSE_UNASSIGNED: '00000000-0000-0000-0000-000000000002',
-- } as const;
--
-- export const SYSTEM_SUBCATEGORIES = {
--   INCOME_UNASSIGNED: '00000000-0000-0000-0000-000000000003',
--   EXPENSE_UNASSIGNED: '00000000-0000-0000-0000-000000000004',
-- } as const;