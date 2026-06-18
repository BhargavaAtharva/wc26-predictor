import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FixturesClient from '@/components/FixturesClient'

export default async function FixturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .order('kickoff_at', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)

  // FOMO: count how many users predicted each finished fixture
  const finishedIds = (fixtures || []).filter(f => f.status === 'finished').map(f => f.id)
  let predictionCounts: Record<string, number> = {}

  if (finishedIds.length > 0) {
    // Get prediction counts per fixture using a grouped query
    const { data: counts } = await supabase
      .from('predictions')
      .select('fixture_id')
      .in('fixture_id', finishedIds)

    // Count occurrences of each fixture_id
    if (counts) {
      counts.forEach(row => {
        predictionCounts[row.fixture_id] = (predictionCounts[row.fixture_id] || 0) + 1
      })
    }
  }

  // Get total user count for FOMO messaging
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  return (
    <FixturesClient
      fixtures={fixtures || []}
      predictions={predictions || []}
      userId={user.id}
      predictionCounts={predictionCounts}
      totalUsers={totalUsers || 0}
    />
  )
}