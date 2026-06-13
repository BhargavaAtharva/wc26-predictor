'use client'

import Logo from './Logo'
import { createClient } from '@/lib/supabase/client'

const FLAGS: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷',
  'Czechia': '🇨🇿', 'Canada': '🇨🇦', 'Bosnia-Herzegovina': '🇧🇦',
  'United States': '🇺🇸', 'Paraguay': '🇵🇾', 'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭', 'Brazil': '🇧🇷', 'Morocco': '🇲🇦',
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺',
  'Turkey': '🇹🇷', 'Germany': '🇩🇪', 'Curaçao': '🇨🇼',
  'Spain': '🇪🇸', 'Finland': '🇫🇮', 'Argentina': '🇦🇷',
  'Nigeria': '🇳🇬', 'Japan': '🇯🇵', 'Belgium': '🇧🇪',
  'Portugal': '🇵🇹', 'Iran': '🇮🇷', 'France': '🇫🇷',
  'Saudi Arabia': '🇸🇦', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Senegal': '🇸🇳',
  'Netherlands': '🇳🇱', 'Ecuador': '🇪🇨', 'Uruguay': '🇺🇾',
  'Colombia': '🇨🇴', 'Chile': '🇨🇱', 'Italy': '🇮🇹',
  'Croatia': '🇭🇷', 'Poland': '🇵🇱', 'Denmark': '🇩🇰',
  'Serbia': '🇷🇸', 'Hungary': '🇭🇺', 'Egypt': '🇪🇬',
  'Ghana': '🇬🇭', 'Cameroon': '🇨🇲', 'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿', 'Mali': '🇲🇱', 'Venezuela': '🇻🇪',
  'Peru': '🇵🇪', 'Bolivia': '🇧🇴', 'Honduras': '🇭🇳',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Jamaica': '🇯🇲',
  'Trinidad and Tobago': '🇹🇹', 'New Zealand': '🇳🇿',
  'Indonesia': '🇮🇩', 'Iraq': '🇮🇶', 'Jordan': '🇯🇴',
  'Uzbekistan': '🇺🇿', 'Ukraine': '🇺🇦', 'Austria': '🇦🇹',
  'Slovakia': '🇸🇰', 'Greece': '🇬🇷', 'Romania': '🇷🇴',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'China': '🇨🇳', 'Thailand': '🇹🇭',
}

function formatIST(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]} · ${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')} IST`
}

function getFlag(team: string | null) {
  if (!team) return '🏳️'
  return FLAGS[team] || '🏳️'
}

type Fixture = {
  id: string
  home_team: string | null
  away_team: string | null
  kickoff_at: string
  stage: string
  group_name: string | null
}

type Profile = {
  id: string
  display_name: string
  avatar_url: string
}

export default function DashboardClient({
  profile,
  rank,
  totalPoints,
  exactScores,
  correctResults,
  totalUsers,
  upcomingFixtures,
  predictedIds,
}: {
  profile: Profile
  rank: number
  totalPoints: number
  exactScores: number
  correctResults: number
  totalUsers: number
  upcomingFixtures: Fixture[]
  predictedIds: Set<string>
}) {
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const firstName = profile?.display_name?.split(' ')[0] || 'there'

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href={`/profile/${profile?.id}`} style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>profile</a>
            <button
              onClick={signOut}
              style={{ fontSize: '14px', color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              sign out
            </button>
          </div>
        </div>

        {/* New feature notification banner */}
        <div style={{
          backgroundColor: 'rgba(212, 241, 92, 0.08)',
          border: '1px solid rgba(212, 241, 92, 0.25)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{
              fontSize: '9px',
              fontWeight: 800,
              backgroundColor: '#d4f15c',
              color: '#0a0a0a',
              padding: '3px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginRight: '8px',
              verticalAlign: 'middle',
            }}>
              new
            </span>
            <span style={{ fontSize: '13px', color: '#e8e8e8', fontWeight: 500, verticalAlign: 'middle' }}>
              Goalscorer Combo Predictions are live! Add players to your prediction card for high-risk bonus points.
            </span>
          </div>
          <a 
            href="/rules" 
            style={{ 
              fontSize: '12px', 
              color: '#d4f15c', 
              fontWeight: 600, 
              textDecoration: 'none',
              borderBottom: '1px solid rgba(212, 241, 92, 0.4)',
              paddingBottom: '1px',
            }}
          >
            check rules →
          </a>
        </div>

        <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
          hey {firstName}
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 4rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '48px',
          lineHeight: 1,
        }}>
          {rank > 0 ? `you're #${rank}` : 'make your picks'}
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '48px',
        }}>
          {[
            { label: 'rank', value: rank > 0 ? `#${rank}` : '—', sub: `of ${totalUsers}` },
            { label: 'points', value: totalPoints, sub: 'total' },
            { label: 'exact scores', value: exactScores, sub: 'predictions' },
            { label: 'correct results', value: correctResults, sub: 'predictions' },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '20px 16px',
            }}>
              <p style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: '11px', color: '#444', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '48px',
        }}>
          {[
            { label: 'fixtures', href: '/fixtures', desc: 'predict matches' },
            { label: 'leaderboard', href: '/leaderboard', desc: 'see rankings' },
            { label: 'rules', href: '/rules', desc: 'how points work' },
            { label: 'profile', href: `/profile/${profile?.id}`, desc: 'your history' },
          ].map(link => (
            <a key={link.label} href={link.href} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#111',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '20px 16px',
                transition: 'border-color 0.15s',
              }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8e8', marginBottom: '4px' }}>{link.label}</p>
                <p style={{ fontSize: '11px', color: '#444' }}>{link.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {upcomingFixtures.length > 0 && (
          <div>
            <p style={{
              fontSize: '11px', color: '#555',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              marginBottom: '16px', fontWeight: 600,
            }}>
              up next
            </p>
            {upcomingFixtures.map(f => (
              <a key={f.id} href="/fixtures" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr auto',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 0',
                  borderBottom: '1px solid #1a1a1a',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '16px' }}>{getFlag(f.home_team)}</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#ccc' }}>{f.home_team}</p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#333', fontWeight: 700 }}>vs</p>
                  <div>
                    <p style={{ fontSize: '16px' }}>{getFlag(f.away_team)}</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#ccc' }}>{f.away_team}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {predictedIds.has(f.id) ? (
                      <span style={{ fontSize: '11px', color: '#4ade80' }}>predicted</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#555' }}>pick →</span>
                    )}
                    <p style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>{formatIST(f.kickoff_at)}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}