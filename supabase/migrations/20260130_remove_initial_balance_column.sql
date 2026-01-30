-- Migration: Remove initial_balance column from accounts table
-- Date: 2026-01-30
-- Description: Removes the initial_balance column from accounts table since we now use transactions with is_initial_balance flag

-- Remove the initial_balance column from accounts table
ALTER TABLE accounts DROP COLUMN IF EXISTS initial_balance;
