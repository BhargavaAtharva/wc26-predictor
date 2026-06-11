import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from '@/components/LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*')

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <LeaderboardClient
      leaderboard={leaderboard || []}
      currentUserId={user?.id || null}
    />
  )
}