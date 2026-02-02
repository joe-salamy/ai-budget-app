-- Remove transfer columns from transactions table
-- Date: 2026-02-02
-- Reason: Simplifying transaction model by removing transfer functionality

-- Drop the transfer-related columns
ALTER TABLE transactions DROP COLUMN IF EXISTS is_transfer;
ALTER TABLE transactions DROP COLUMN IF EXISTS transfer_to_account_id;
