'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function saveResult(fixtureId: string, homeScore: number, awayScore: number, scorers: string[] | null) {
  // Verify the caller is the admin user via their auth session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return { error: 'Unauthorized' }
  }

  if (!fixtureId || homeScore === undefined || awayScore === undefined) {
    return { error: 'Missing fields' }
  }

  // Use service role key (server-only, never exposed to browser)
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const result = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw'

  const { error } = await adminClient
    .from('fixtures')
    .update({ 
      home_score: homeScore, 
      away_score: awayScore, 
      result, 
      status: 'finished',
      scorers: scorers || null
    })
    .eq('id', fixtureId)

  if (error) return { error: error.message }

  const { error: calcError } = await adminClient.rpc('calculate_scores', {
    p_fixture_id: fixtureId
  })

  if (calcError) return { error: calcError.message }

  return { success: true }
}
