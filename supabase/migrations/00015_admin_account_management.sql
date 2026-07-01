-- Migration 00015: Soft delete and account state support for admin management
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS blocked_reason text;

ALTER TABLE public.poules
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

UPDATE public.profiles
SET account_status = CASE
  WHEN is_active = false THEN 'inactive'
  ELSE 'active'
END
WHERE account_status IS NULL OR account_status = '';
