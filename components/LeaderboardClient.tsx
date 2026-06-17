'use client'
import { useState } from 'react'
import Logo from './Logo'

type LeaderboardEntry = {
  user_id: string
  display_name: string
  avatar_url: string
  total_points: number
  exact_scores: number
  correct_results: number
}

type Phase = {
  key: string
  label: string
}

export default function LeaderboardClient({
  phaseLeaderboards,
  activePhases,
  currentUserId,
  hasFinishedMatches = false,
}: {
  phaseLeaderboards: Record<string, LeaderboardEntry[]>
  activePhases: Phase[]
  currentUserId: string | null
  hasFinishedMatches?: boolean
}) {
  const [selectedPhase, setSelectedPhase] = useState(activePhases[0]?.key || 'overall')

  const leaderboard = phaseLeaderboards[selectedPhase] || []

  // Sort leaderboard by: total_points DESC, exact_scores DESC, correct_results DESC
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
    return b.correct_results - a.correct_results
  })

  // Filter out users with 0 points for phase-specific views (not overall)
  const displayLeaderboard = selectedPhase === 'overall'
    ? sortedLeaderboard
    : sortedLeaderboard.filter(e => e.total_points > 0)

  // Standard Competition Ranking
  const getRank = (entry: LeaderboardEntry) => {
    if (!hasFinishedMatches) return 0
    return displayLeaderboard.filter(other => other.total_points > entry.total_points).length + 1
  }

  const currentUserEntry = displayLeaderboard.find(e => e.user_id === currentUserId)
  const currentUserRank = currentUserEntry ? getRank(currentUserEntry) : 0

  const medalColor = (rank: number) => {
    if (rank === 0) return null
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#C0C0C0'
    if (rank === 3) return '#CD7F32'
    return null
  }

  function Entry({ entry, rank, highlight }: { entry: LeaderboardEntry, rank: number, highlight?: boolean }) {
    const medal = medalColor(rank)
    const isTop3 = rank <= 3

    return (
      <a href={`/profile/${entry.user_id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px 40px 1fr auto',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: highlight ? '#111' : 'transparent',
          border: highlight ? '1px solid #1f1f1f' : '1px solid transparent',
          marginBottom: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        }}>

          <div style={{ textAlign: 'center' }}>
            {medal ? (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: medal, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a0a0a' }}>{rank}</span>
              </div>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#444' }}>
                {hasFinishedMatches ? rank : '—'}
              </span>
            )}
          </div>

          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            overflow: 'hidden', backgroundColor: '#1a1a1a', flexShrink: 0,
          }}>
            {entry.avatar_url ? (
              <img
                src={entry.avatar_url}
                alt={entry.display_name}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#555',
              }}>
                {entry.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div>
            <p style={{
              fontSize: '14px',
              fontWeight: highlight ? 700 : 500,
              color: isTop3 ? '#e8e8e8' : '#ccc',
            }}>
              {entry.display_name || 'anonymous'}
              {highlight && (
                <span style={{ fontSize: '11px', color: '#444', marginLeft: '8px' }}>you</span>
              )}
            </p>
            <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
              {entry.correct_results} correct · {entry.exact_scores} exact
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: '18px', fontWeight: 800,
              color: isTop3 ? '#e8e8e8' : '#888',
              letterSpacing: '-0.02em',
            }}>
              {entry.total_points}
            </p>
            <p style={{ fontSize: '10px', color: '#444', marginTop: '2px', letterSpacing: '0.1em' }}>pts</p>
          </div>

        </div>
      </a>
    )
  }

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
          <a href="/fixtures" style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>fixtures</a>
        </div>

        {/* Phase selector pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '24px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {activePhases.map(phase => {
            const isActive = phase.key === selectedPhase
            return (
              <button
                key={phase.key}
                onClick={() => setSelectedPhase(phase.key)}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'inherit',
                  color: isActive ? '#0a0a0a' : '#888',
                  backgroundColor: isActive ? '#e8e8e8' : '#111',
                  border: isActive ? '1px solid #e8e8e8' : '1px solid #1f1f1f',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {phase.label}
              </button>
            )
          })}
        </div>

        {/* Phase label */}
        <p style={{
          fontSize: '11px',
          color: '#444',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '16px',
          fontWeight: 600,
        }}>
          {activePhases.find(p => p.key === selectedPhase)?.label || 'overall'} standings
        </p>

        {displayLeaderboard.length === 0 ? (
          <p style={{ color: '#444', fontSize: '14px' }}>no predictions yet. be the first.</p>
        ) : (
          <div>
            {displayLeaderboard.map((entry) => (
              <Entry
                key={entry.user_id}
                entry={entry}
                rank={getRank(entry)}
                highlight={entry.user_id === currentUserId}
              />
            ))}
          </div>
        )}

      </div>

      {currentUserEntry && currentUserRank > 3 && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #1f1f1f',
          padding: '12px clamp(16px, 4vw, 40px)',
        }}>
          <div>
            <Entry
              entry={currentUserEntry}
              rank={currentUserRank}
              highlight={true}
            />
          </div>
        </div>
      )}

    </main>
  )
}