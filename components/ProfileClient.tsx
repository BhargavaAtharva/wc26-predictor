'use client'
import Logo from './Logo'
import HoloBackground from './holo/HoloBackground'
import ScoreboardBar from './ScoreboardBar'

function shortDate(iso: string) {
  const d = new Date(iso)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  return `${ist.getUTCDate()} ${months[ist.getUTCMonth()]} · ${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`
}

type Profile = {
  id: string
  display_name: string
  avatar_url: string
  created_at: string
}

type Prediction = {
  id: string
  predicted_home: number
  predicted_away: number
  predicted_scorers: string[] | null
  fixtures: {
    home_team: string
    away_team: string
    kickoff_at: string
    status: string
    home_score: number | null
    away_score: number | null
    result: string | null
  }
}


export default function ProfileClient({
  profile,
  predictions,
  totalPoints,
  exactScores,
  correctResults,
  isOwnProfile,
}: {
  profile: Profile
  predictions: Prediction[]
  totalPoints: number
  exactScores: number
  correctResults: number
  isOwnProfile: boolean
}) {
  const played = predictions.filter(p => p.fixtures?.status === 'finished')
  const accuracy = played.length > 0 ? Math.round((correctResults / played.length) * 100) : 0

  function ScoreboardRow({ p }: { p: Prediction }) {
    const f = p.fixtures
    const finished = f.status === 'finished'

    let correct: boolean | null = null
    if (finished) {
      const predResult = p.predicted_home > p.predicted_away ? 'home'
        : p.predicted_away > p.predicted_home ? 'away' : 'draw'
      correct = predResult === f.result
    }
    const accent = correct === null ? '#2ee6e6' : correct ? '#34d399' : '#e0606a'
    const vsColor = correct === null ? '#9cc4ee' : correct ? '#8fe3bf' : '#efb0b5'

    return (
      <ScoreboardBar
        homeTeam={f.home_team}
        awayTeam={f.away_team}
        homeSub={finished ? `FT ${f.home_score}` : shortDate(f.kickoff_at).split('·')[0]}
        awaySub={finished ? `FT ${f.away_score}` : 'world cup'}
        centerScore={`${p.predicted_home}–${p.predicted_away}`}
        vsColor={vsColor}
        accentColor={accent}
      />
    )
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', fontFamily: 'inherit' }}>
      <HoloBackground stadiumOpacity={0.18} />

      <div className="holo-content" style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '860px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Logo />
          {isOwnProfile && (
            <a href="/fixtures" className="holo-link" style={{ fontSize: '14px' }}>fixtures</a>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div className="anim-float" style={{
            width: '64px', height: '64px', borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '1px solid rgba(46,230,230,0.5)',
            background: 'rgba(8,16,30,0.6)',
          }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontWeight: 700, color: '#2ee6e6',
              }}>
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <h1 className="holo-text" style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.01em' }}>
              {profile?.display_name || 'anonymous'}
            </h1>
            {isOwnProfile && <p className="holo-dim" style={{ fontSize: '12px', marginTop: '4px' }}>your profile</p>}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '14px',
          marginBottom: '48px',
        }}>
          {[
            { label: 'points', value: totalPoints },
            { label: 'exact scores', value: exactScores },
            { label: 'correct results', value: correctResults },
            { label: 'accuracy', value: `${accuracy}%` },
          ].map(stat => (
            <div key={stat.label} className="holo-panel-emerald" style={{ padding: '18px' }}>
              <p className="holo-text-emerald" style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em' }}>{stat.value}</p>
              <p style={{ fontSize: '11px', color: '#5f8f7d', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="holo-text-emerald" style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>
          my predictions
        </p>

        {predictions.length === 0 ? (
          <p className="holo-dim" style={{ fontSize: '14px' }}>no predictions yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {predictions.map(p => {
              if (!p.fixtures) return null
              return (
                <div key={p.id}>
                  <ScoreboardRow p={p} />
                  {p.predicted_scorers && p.predicted_scorers.length > 0 && (
                    <p style={{ fontSize: '10px', color: '#6f93b0', marginTop: '4px', paddingLeft: '4px' }}>
                      ⚽ {p.predicted_scorers.join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
