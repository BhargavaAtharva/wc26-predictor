-- Retention features migration
-- Run this in Supabase SQL Editor

-- 1. Rivalries table (head-to-head)
CREATE TABLE IF NOT EXISTS public.rivalries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  rival_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, rival_id),
  CHECK (user_id != rival_id)
);

-- 2. RLS policies for rivalries
ALTER TABLE public.rivalries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rivalries" ON public.rivalries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rivalries" ON public.rivalries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rivalries" ON public.rivalries
  FOR DELETE USING (auth.uid() = user_id);
