-- Migration: Create Initial Balance Transactions for Existing Accounts
-- Date: 2026-01-29
-- Description: Creates initial balance transactions for all existing accounts that have a non-zero initial_balance
-- and then sets the initial_balance field to 0

-- Create initial balance transactions for existing accounts
INSERT INTO transactions (
  user_id,
  account_id,
  date,
  name,
  amount,
  subcategory_id,
  comment,
  is_initial_balance,
  is_transfer,
  transfer_to_account_id,
  ai_suggested,
  user_corrected,
  created_at,
  updated_at
)
SELECT 
  a.user_id,
  a.id as account_id,
  a.created_at::date as date,  -- Use account creation date
  'Initial Balance' as name,
  a.initial_balance as amount,
  NULL as subcategory_id,
  NULL as comment,
  true as is_initial_balance,
  false as is_transfer,
  NULL as transfer_to_account_id,
  false as ai_suggested,
  false as user_corrected,
  now() as created_at,
  now() as updated_at
FROM accounts a
WHERE 
  -- Only create for non-zero initial balances
  a.initial_balance != 0
  -- Only if an initial balance transaction doesn't already exist
  AND NOT EXISTS (
    SELECT 1 
    FROM transactions t 
    WHERE t.account_id = a.id 
      AND t.is_initial_balance = true
      AND t.deleted_at IS NULL
  )
  -- Only for non-deleted accounts
  AND a.deleted_at IS NULL;

-- Now set all initial_balance fields to 0 since we're using transactions
UPDATE accounts
SET initial_balance = 0, updated_at = now()
WHERE initial_balance != 0
  AND deleted_at IS NULL;
