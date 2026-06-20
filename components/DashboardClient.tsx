'use client'

import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'
import HoloBackground from './holo/HoloBackground'
import FireMark from './holo/FireMark'
import ScoreboardBar from './ScoreboardBar'

const ACCENT = '#2ee6e6'
const MUTE = '#7fa6c4'

function formatIST(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]}`
}

type Fixture = { id: string; home_team: string | null; away_team: string | null; kickoff_at: string; stage: string; group_name: string | null }
type Profile = { id: string; display_name: string; avatar_url: string }
type RivalData = { user_id: string; display_name: string; avatar_url: string; total_points: number; rank: number }

export default function DashboardClient({
  profile, rank, totalPoints, exactScores, correctResults, totalUsers,
  upcomingFixtures, predictedIds, streak, bestStreak, totalMatchdays, rivals,
}: {
  profile: Profile; rank: number; totalPoints: number; exactScores: number; correctResults: number
  totalUsers: number; upcomingFixtures: Fixture[]; predictedIds: Set<string>
  streak: number; bestStreak: number; totalMatchdays: number; rivals: RivalData[]
}) {
  const supabase = createClient()
  async function signOut() { await supabase.auth.signOut(); window.location.href = '/' }

  const firstName = profile?.display_name?.split(' ')[0] || 'there'

  const menu = [
    { label: 'fixtures', href: '/fixtures', desc: 'predict matches' },
    { label: 'leaderboard', href: '/leaderboard', desc: 'rankings & rivals' },
    { label: 'rules', href: '/rules', desc: 'how points work' },
    { label: 'profile', href: `/profile/${profile?.id}`, desc: 'your history' },
  ]
  const sectionLabel: React.CSSProperties = { fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: MUTE, fontWeight: 700 }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: 'inherit', color: '#cdd9ea' }}>
      <HoloBackground stadiumOpacity={0.3} />

      <div className="holo-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(14px, 4vw, 34px)' }}>

        {/* top bar — logo consistent with every page */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(20px, 4vw, 40px)' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href={`/profile/${profile?.id}`} className="holo-link" style={{ fontSize: '13px' }}>profile</a>
            <button onClick={signOut} className="holo-link" style={{ fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>sign out</button>
          </div>
        </div>

        {/* hero + menu */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px, 5vw, 48px)', alignItems: 'flex-start' }}>

          {/* left: greeting, rank, stats, cta */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <p style={{ ...sectionLabel, color: ACCENT, marginBottom: '12px' }}>matchday — hey {firstName}</p>
            <h1 className="holo-text" style={{ fontSize: 'clamp(2.6rem, 9vw, 5rem)', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.03em', marginBottom: '24px' }}>
              {rank > 0 ? <>you&apos;re <span style={{ color: '#fff' }}>#{rank}</span></> : <span style={{ color: '#fff' }}>make your picks</span>}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 5vw, 36px)', marginBottom: '28px' }}>
              {[
                { v: totalPoints, l: 'points' },
                { v: exactScores, l: 'exact' },
                { v: correctResults, l: 'correct' },
                { v: streak > 0 ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{streak}<FireMark size={34} /></span>) : '0', l: `streak · best ${bestStreak}` },
              ].map(s => (
                <div key={s.l}>
                  <p className="holo-text" style={{ fontSize: 'clamp(28px, 8vw, 42px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.v}</p>
                  <p style={{ fontSize: '10px', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '6px' }}>{s.l}</p>
                </div>
              ))}
            </div>

            <a href="/fixtures" className="holo-btn-solid" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 26px', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>
              predict now →
            </a>
          </div>

          {/* right: navigation rows (full-width tap targets on mobile) */}
          <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            {menu.map(m => (
              <a key={m.label} href={m.href} className="holo-panel" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px', textDecoration: 'none', borderRadius: '12px',
              }}>
                <span>
                  <span className="holo-text" style={{ display: 'block', fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
                  <span style={{ fontSize: '11px', color: MUTE }}>{m.desc}</span>
                </span>
                <span style={{ color: ACCENT, fontSize: '18px' }}>→</span>
              </a>
            ))}
          </div>
        </div>

        {/* rivalries */}
        {rivals.length > 0 && (
          <div style={{ marginTop: 'clamp(36px, 6vw, 56px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={sectionLabel}>⚔ rivalries</p>
              <a href="/leaderboard" className="holo-link" style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>manage →</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {rivals.map(r => {
                const diff = totalPoints - r.total_points
                const ahead = diff > 0, tied = diff === 0
                return (
                  <a key={r.user_id} href={`/profile/${r.user_id}`} className="holo-panel" style={{ padding: '14px 16px', textDecoration: 'none', display: 'block' }}>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#e8f4ff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                      vs {r.display_name?.split(' ')[0] || 'anonymous'} {r.rank > 0 && <span style={{ color: MUTE, fontWeight: 500 }}>#{r.rank}</span>}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="holo-text" style={{ fontSize: '22px', fontWeight: 900 }}>{totalPoints}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: tied ? MUTE : ahead ? '#34d399' : '#e0606a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {tied ? 'tied' : ahead ? `+${diff} ahead` : `${diff} behind`}
                      </span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: MUTE }}>{r.total_points}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* up next — profile-format match bars */}
        {upcomingFixtures.length > 0 && (
          <div style={{ marginTop: 'clamp(36px, 6vw, 56px)' }}>
            <p style={{ ...sectionLabel, marginBottom: '14px' }}>up next</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingFixtures.map(f => {
                const predicted = predictedIds.has(f.id)
                return (
                  <a key={f.id} href="/fixtures" style={{ textDecoration: 'none', display: 'block' }}>
                    <ScoreboardBar
                      homeTeam={f.home_team || 'TBD'}
                      awayTeam={f.away_team || 'TBD'}
                      homeSub={formatIST(f.kickoff_at)}
                      awaySub={f.group_name || 'world cup'}
                      centerStatus={predicted ? { label: 'predicted', color: '#34d399' } : { label: 'predict', color: ACCENT }}
                      vsColor={predicted ? '#8fe3bf' : '#9cc4ee'}
                      accentColor={predicted ? '#34d399' : '#5b7da6'}
                    />
                  </a>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
