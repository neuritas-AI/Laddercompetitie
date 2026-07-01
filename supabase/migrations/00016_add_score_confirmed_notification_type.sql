-- Migration 00016: Add score_confirmed notification type
-- Run this in Supabase SQL Editor

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('match_tomorrow', 'match_today', 'score_entered', 'match_scheduled', 'score_confirmed'));

SELECT 'Updated notifications type constraint to include score_confirmed' AS status;
