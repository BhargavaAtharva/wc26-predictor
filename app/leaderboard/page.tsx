import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from '@/components/LeaderboardClient'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*')

  const { count: finishedCount } = await supabase
    .from('fixtures')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'finished')
  const hasFinishedMatches = (finishedCount || 0) > 0

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <LeaderboardClient
      leaderboard={leaderboard || []}
      currentUserId={user?.id || null}
      hasFinishedMatches={hasFinishedMatches}
    />
  )
}