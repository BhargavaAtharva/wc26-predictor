import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*')
const rank = leaderboard ? leaderboard.findIndex(e => e.user_id === user.id) + 1 : 0
const userStats = leaderboard ? leaderboard.find(e => e.user_id === user.id) : null

  const { data: upcomingFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('status', 'scheduled')
    .not('home_team', 'is', null)
    .not('away_team', 'is', null)
    .gt('kickoff_at', new Date().toISOString())
    .order('kickoff_at', { ascending: true })
    .limit(3)

  const { data: predictions } = await supabase
    .from('predictions')
    .select('fixture_id')
    .eq('user_id', user.id)

  const predictedIds = new Set(predictions?.map(p => p.fixture_id) || [])

  return (
    <DashboardClient
      profile={profile}
      rank={rank}
      totalPoints={userStats?.total_points || 0}
      exactScores={userStats?.exact_scores || 0}
      correctResults={userStats?.correct_results || 0}
      totalUsers={leaderboard?.length || 0}
      upcomingFixtures={upcomingFixtures || []}
      predictedIds={predictedIds}
    />
  )
}