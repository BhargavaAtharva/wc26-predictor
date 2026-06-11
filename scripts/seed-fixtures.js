const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fetchFixtures() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY }
  })

  if (!res.ok) {
    console.error('API error:', res.status, await res.text())
    process.exit(1)
  }

  const data = await res.json()
  return data.matches
}

function getResult(match) {
  if (match.status !== 'FINISHED') return null
  const home = match.score.fullTime.home
  const away = match.score.fullTime.away
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

async function seed() {
  console.log('Fetching fixtures from football-data.org...')
  const matches = await fetchFixtures()
  console.log(`Found ${matches.length} matches`)

  const fixtures = matches.map(m => ({
    external_id: String(m.id),
    stage: m.stage === 'GROUP_STAGE' ? 'group'
      : m.stage === 'LAST_32' ? 'r32'
      : m.stage === 'LAST_16' ? 'r16'
      : m.stage === 'QUARTER_FINALS' ? 'qf'
      : m.stage === 'SEMI_FINALS' ? 'sf'
      : m.stage === 'THIRD_PLACE' ? 'third'
      : m.stage === 'FINAL' ? 'final'
      : m.stage.toLowerCase(),
    group_name: m.group || null,
    matchday: m.matchday || null,
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    kickoff_at: m.utcDate,
    status: m.status === 'FINISHED' ? 'finished'
      : m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'live'
      : 'scheduled',
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    result: getResult(m),
  }))

  console.log('Seeding into Supabase...')

  const { error } = await supabase
    .from('fixtures')
    .upsert(fixtures, { onConflict: 'external_id' })

  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }

  console.log(`✓ Seeded ${fixtures.length} fixtures successfully`)
}

seed()