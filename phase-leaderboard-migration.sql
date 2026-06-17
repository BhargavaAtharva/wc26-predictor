-- Phase-aware leaderboard function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_leaderboard_by_phase(
  p_stage text DEFAULT NULL,
  p_matchday int DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_points bigint,
  exact_scores bigint,
  correct_results bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    u.id AS user_id,
    u.display_name,
    u.avatar_url,
    COALESCE(SUM(s.total_pts), 0) AS total_points,
    COALESCE(SUM(CASE WHEN s.exact_score_pts > 0 THEN 1 ELSE 0 END), 0) AS exact_scores,
    COALESCE(SUM(CASE WHEN s.result_pts > 0 THEN 1 ELSE 0 END), 0) AS correct_results
  FROM public.users u
  LEFT JOIN public.scores s ON s.user_id = u.id
  LEFT JOIN public.fixtures f ON f.id = s.fixture_id
  WHERE
    (p_stage IS NULL OR f.stage = p_stage)
    AND (p_matchday IS NULL OR f.matchday = p_matchday)
  GROUP BY u.id, u.display_name, u.avatar_url;
$$;
