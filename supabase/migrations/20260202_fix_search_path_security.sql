-- Fix security warning: Function Search Path Mutable
-- Add SET search_path to update_updated_at_column function
-- Created: 2026-02-02

-- Drop and recreate the function with proper search_path security
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
