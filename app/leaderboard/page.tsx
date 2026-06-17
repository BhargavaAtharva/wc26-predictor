import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from '@/components/LeaderboardClient'

export const dynamic = 'force-dynamic'

const PHASES = [
  { key: 'overall', label: 'overall', stage: null, matchday: null },
  { key: 'md1', label: 'matchday 1', stage: 'group', matchday: 1 },
  { key: 'md2', label: 'matchday 2', stage: 'group', matchday: 2 },
  { key: 'md3', label: 'matchday 3', stage: 'group', matchday: 3 },
  { key: 'r32', label: 'round of 32', stage: 'r32', matchday: null },
  { key: 'r16', label: 'round of 16', stage: 'r16', matchday: null },
  { key: 'qf', label: 'quarter-finals', stage: 'qf', matchday: null },
  { key: 'sf', label: 'semi-finals', stage: 'sf', matchday: null },
  { key: 'final', label: 'final', stage: 'final', matchday: null },
] as const

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Fetch leaderboard for every phase in parallel
  const phaseResults = await Promise.all(
    PHASES.map(async (phase) => {
      const { data } = await supabase.rpc('get_leaderboard_by_phase', {
        p_stage: phase.stage,
        p_matchday: phase.matchday,
      })
      return { key: phase.key, data: data || [] }
    })
  )

  const phaseLeaderboards: Record<string, typeof phaseResults[0]['data']> = {}
  phaseResults.forEach(r => { phaseLeaderboards[r.key] = r.data })

  // Figure out which phases actually have finished matches
  const { data: finishedFixtures } = await supabase
    .from('fixtures')
    .select('stage, matchday')
    .eq('status', 'finished')

  const activePhasesSet = new Set<string>()
  activePhasesSet.add('overall') // always show overall
  finishedFixtures?.forEach(f => {
    if (f.stage === 'group' && f.matchday) {
      activePhasesSet.add(`md${f.matchday}`)
    } else if (f.stage) {
      activePhasesSet.add(f.stage)
    }
  })

  const activePhases = PHASES
    .filter(p => activePhasesSet.has(p.key))
    .map(p => ({ key: p.key, label: p.label }))

  const hasFinishedMatches = (finishedFixtures?.length || 0) > 0

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <LeaderboardClient
      phaseLeaderboards={phaseLeaderboards}
      activePhases={activePhases}
      currentUserId={user?.id || null}
      hasFinishedMatches={hasFinishedMatches}
    />
  )
}