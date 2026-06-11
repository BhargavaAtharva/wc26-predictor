import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-secret')
  if (authHeader !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()
  const { fixture_id, home_score, away_score } = body

  if (!fixture_id || home_score === undefined || away_score === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const result = home_score > away_score ? 'home' : away_score > home_score ? 'away' : 'draw'

  const { error } = await supabase
    .from('fixtures')
    .update({ home_score, away_score, result, status: 'finished' })
    .eq('id', fixture_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { error: calcError } = await supabase.rpc('calculate_scores', {
    p_fixture_id: fixture_id
  })

  if (calcError) return NextResponse.json({ error: calcError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}