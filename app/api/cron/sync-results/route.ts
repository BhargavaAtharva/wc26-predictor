import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
    { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'API fetch failed' }, { status: 500 })
  }

  const data = await res.json()
  const finished = data.matches

  let updated = 0

  for (const match of finished) {
    const { data: fixture } = await supabase
      .from('fixtures')
      .select('id, status')
      .eq('external_id', String(match.id))
      .single()

    if (!fixture || fixture.status === 'finished') continue

    const home = match.score.fullTime.home
    const away = match.score.fullTime.away
    const result = home > away ? 'home' : away > home ? 'away' : 'draw'

    try {
      const { error: updateError } = await supabase
        .from('fixtures')
        .update({ home_score: home, away_score: away, result, status: 'finished' })
        .eq('id', fixture.id)

      if (updateError) throw updateError

      const { error: rpcError } = await supabase.rpc('calculate_scores', { p_fixture_id: fixture.id })
      if (rpcError) throw rpcError

      updated++
    } catch (err) {
      console.error(`Failed to sync results for match ${match.id} (${match.homeTeam.name} vs ${match.awayTeam.name}):`, err)
    }
  }
  // Phase 2: sync knockout fixture team names (teams get populated as rounds progress)
  let teamsUpdated = 0
  try {
    const allRes = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! } }
    )
    if (allRes.ok) {
      const allData = await allRes.json()
      for (const match of allData.matches) {
        if (match.stage === 'GROUP_STAGE') continue
        const homeName = match.homeTeam?.name || null
        const awayName = match.awayTeam?.name || null
        if (!homeName && !awayName) continue

        const { data: fix } = await supabase
          .from('fixtures')
          .select('id, home_team, away_team')
          .eq('external_id', String(match.id))
          .single()

        if (!fix) continue
        if (fix.home_team === homeName && fix.away_team === awayName) continue

        await supabase
          .from('fixtures')
          .update({ home_team: homeName, away_team: awayName })
          .eq('id', fix.id)
        teamsUpdated++
      }
    }
  } catch (err) {
    console.error('Failed to sync knockout teams:', err)
  }

  return NextResponse.json({ success: true, updated, teamsUpdated })
}