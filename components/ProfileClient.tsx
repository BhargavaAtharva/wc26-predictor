'use client'
import Logo from './Logo'

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
  predicted_scorer: string | null
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

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: 'inherit',
    }}>
      <div style={{
  padding: 'clamp(16px, 4vw, 32px)',
}}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Logo />
          {isOwnProfile && (
            <a href="/fixtures" style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>fixtures</a>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            overflow: 'hidden', backgroundColor: '#1a1a1a', flexShrink: 0,
          }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 700, color: '#555',
              }}>
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {profile?.display_name || 'anonymous'}
            </h1>
            {isOwnProfile && <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>your profile</p>}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          marginBottom: '48px',
        }}>
          {[
            { label: 'points', value: totalPoints },
            { label: 'exact scores', value: exactScores },
            { label: 'correct results', value: correctResults },
            { label: 'accuracy', value: `${accuracy}%` },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '10px',
              padding: '16px',
            }}>
              <p style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>{stat.value}</p>
              <p style={{ fontSize: '11px', color: '#444', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>
          predictions
        </p>

        {predictions.length === 0 ? (
          <p style={{ color: '#444', fontSize: '14px' }}>no predictions yet.</p>
        ) : (
          predictions.map(p => {
            const f = p.fixtures
            if (!f) return null
            const finished = f.status === 'finished'
            const correct = finished && f.result !== null

            let pointColor = '#444'
            if (finished) {
              const predResult = p.predicted_home > p.predicted_away ? 'home'
                : p.predicted_away > p.predicted_home ? 'away' : 'draw'
              if (predResult === f.result) pointColor = '#4ade80'
              else pointColor = '#f87171'
            }

            return (
              <div key={p.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr auto',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 0',
                borderBottom: '1px solid #1a1a1a',
              }}>
                <p style={{ fontSize: '13px', color: '#ccc', textAlign: 'right' }}>{f.home_team}</p>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#666' }}>
                    {p.predicted_home} — {p.predicted_away}
                  </p>
                  {p.predicted_scorer && (
                    <p style={{ fontSize: '10px', color: '#555', marginTop: '2px', fontStyle: 'italic' }}>
                      ({p.predicted_scorer})
                    </p>
                  )}
                  {finished && (
                    <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                      {f.home_score} — {f.away_score}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#ccc' }}>{f.away_team}</p>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pointColor }} />
              </div>
            )
          })
        )}

      </div>
    </main>
  )
}