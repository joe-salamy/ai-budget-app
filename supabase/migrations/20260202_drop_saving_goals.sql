-- Drop saving_goals table
-- Created: 2026-02-02
-- Reason: Archived feature - no longer needed for the application

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_saving_goals_user_id;
DROP INDEX IF EXISTS idx_saving_goals_account_id;

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_saving_goals_updated_at ON saving_goals;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS saving_goals CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table is dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'saving_goals'
  ) THEN
    RAISE EXCEPTION 'Failed to drop saving_goals table';
  END IF;

  RAISE NOTICE 'saving_goals table successfully dropped ✓';
END $$;
