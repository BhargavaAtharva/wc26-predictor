-- 1. Add column to predictions table
ALTER TABLE public.predictions ADD COLUMN predicted_scorer text;

-- 2. Add column to fixtures table (array of text for multiple scorers)
ALTER TABLE public.fixtures ADD COLUMN scorers text[];

-- 3. Add column to scores table to store bonus points
ALTER TABLE public.scores ADD COLUMN scorer_pts int DEFAULT 0;

-- 4. Update the calculate_scores RPC function
CREATE OR REPLACE FUNCTION public.calculate_scores(p_fixture_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
declare
  fix record;
  pred record;
  r_pts int;
  e_pts int;
  g_pts int;
  s_pts int; -- scorer points
  is_correct_winner boolean;
  one_team_goals_matched boolean;
begin
  select * into fix from public.fixtures where id = p_fixture_id;
  if fix.status != 'finished' then return; end if;

  for pred in 
    select * from public.predictions where fixture_id = p_fixture_id
  loop
    r_pts := 0; e_pts := 0; g_pts := 0; s_pts := 0;
    
    -- Helper checks
    is_correct_winner := (pred.predicted_result = fix.result);
    one_team_goals_matched := (pred.predicted_home = fix.home_score OR pred.predicted_away = fix.away_score);

    -- 1. Exact score / Exact draw (7 points total)
    if pred.predicted_home = fix.home_score and pred.predicted_away = fix.away_score then
      r_pts := 4;
      e_pts := 3;
      
    -- 2. Correct winner or draw but not exact (4 or 5 points total)
    elsif is_correct_winner then
      r_pts := 4;
      
      -- If they got the winner right AND one team's goals matched (5 points total)
      if one_team_goals_matched then
        g_pts := 1;
      end if;
      
    -- 3. Wrong winner, but got one team's score right (2 points total)
    elsif one_team_goals_matched then
      g_pts := 2;
    end if;

    -- 4. Scorer Prediction Bonus (2 points)
    if pred.predicted_scorer is not null and fix.scorers is not null then
      if pred.predicted_scorer = any(fix.scorers) then
        s_pts := 2;
      end if;
    end if;

    insert into public.scores (user_id, fixture_id, result_pts, exact_score_pts, goal_diff_pts, scorer_pts, total_pts, calculated_at)
    values (
      pred.user_id, 
      p_fixture_id, 
      r_pts, 
      e_pts, 
      g_pts, 
      s_pts,
      r_pts + e_pts + g_pts + s_pts, 
      now()
    )
    on conflict (user_id, fixture_id) do update set
      result_pts = excluded.result_pts,
      exact_score_pts = excluded.exact_score_pts,
      goal_diff_pts = excluded.goal_diff_pts,
      scorer_pts = excluded.scorer_pts,
      total_pts = excluded.total_pts,
      calculated_at = excluded.calculated_at;
  end loop;
end;
$$;
