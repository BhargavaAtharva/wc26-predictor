import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

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

  const { count: finishedCount } = await supabase
    .from('fixtures')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'finished')
  const hasFinishedMatches = (finishedCount || 0) > 0

  const userStats = leaderboard ? leaderboard.find(e => e.user_id === user.id) : null

  let rank = 0
  if (leaderboard && userStats && hasFinishedMatches) {
    const betterUsers = leaderboard.filter(e => e.total_points > (userStats.total_points || 0))
    rank = betterUsers.length + 1
  }

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

  // --- STREAK COMPUTATION ---
  const { data: allFinished } = await supabase
    .from('fixtures')
    .select('id, kickoff_at')
    .eq('status', 'finished')
    .order('kickoff_at', { ascending: false })

  // Group finished fixtures by date (IST)
  const byDate: Record<string, string[]> = {}
  allFinished?.forEach(f => {
    // Convert to IST date for grouping
    const utc = new Date(f.kickoff_at)
    const ist = new Date(utc.getTime() + (5.5 * 60 * 60 * 1000))
    const dateKey = ist.toISOString().split('T')[0]
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(f.id)
  })

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(byDate).sort().reverse()

  // Count current streak: consecutive matchdays where user predicted ALL matches
  let streak = 0
  for (const date of sortedDates) {
    const allPredicted = byDate[date].every(id => predictedIds.has(id))
    if (allPredicted) streak++
    else break
  }

  // Also compute best streak for bragging rights
  let bestStreak = 0
  let tempStreak = 0
  for (const date of Object.keys(byDate).sort()) {
    if (byDate[date].every(id => predictedIds.has(id))) {
      tempStreak++
      if (tempStreak > bestStreak) bestStreak = tempStreak
    } else {
      tempStreak = 0
    }
  }

  // --- RIVALRIES ---
  const { data: rivalries } = await supabase
    .from('rivalries')
    .select('rival_id')
    .eq('user_id', user.id)

  const rivalIds = rivalries?.map(r => r.rival_id) || []
  const rivalData = leaderboard
    ? leaderboard
        .filter(e => rivalIds.includes(e.user_id))
        .map(e => ({
          user_id: e.user_id,
          display_name: e.display_name,
          avatar_url: e.avatar_url,
          total_points: e.total_points,
        }))
    : []

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
      streak={streak}
      bestStreak={bestStreak}
      totalMatchdays={sortedDates.length}
      rivals={rivalData}
    />
  )
}