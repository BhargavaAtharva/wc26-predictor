'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

const MAX_RIVALS = 3

export default function LeaderboardClient({
  phaseLeaderboards,
  activePhases,
  currentUserId,
  hasFinishedMatches = false,
  initialRivalIds = [],
}: {
  phaseLeaderboards: Record<string, LeaderboardEntry[]>
  activePhases: Phase[]
  currentUserId: string | null
  hasFinishedMatches?: boolean
  initialRivalIds?: string[]
}) {
  const supabase = createClient()
  const [selectedPhase, setSelectedPhase] = useState(activePhases[0]?.key || 'overall')
  const [rivalIds, setRivalIds] = useState<string[]>(initialRivalIds)
  const [togglingRival, setTogglingRival] = useState<string | null>(null)

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

  async function toggleRival(rivalId: string) {
    if (!currentUserId || togglingRival) return
    setTogglingRival(rivalId)

    const isRival = rivalIds.includes(rivalId)

    if (isRival) {
      // Remove rival
      await supabase
        .from('rivalries')
        .delete()
        .eq('user_id', currentUserId)
        .eq('rival_id', rivalId)
      setRivalIds(prev => prev.filter(id => id !== rivalId))
    } else {
      if (rivalIds.length >= MAX_RIVALS) {
        setTogglingRival(null)
        return
      }
      // Add rival
      await supabase
        .from('rivalries')
        .insert({ user_id: currentUserId, rival_id: rivalId })
      setRivalIds(prev => [...prev, rivalId])
    }

    setTogglingRival(null)
  }

  function Entry({ entry, rank, highlight }: { entry: LeaderboardEntry, rank: number, highlight?: boolean }) {
    const medal = medalColor(rank)
    const isTop3 = rank <= 3
    const isRival = rivalIds.includes(entry.user_id)
    const isSelf = entry.user_id === currentUserId
    const canAddMore = rivalIds.length < MAX_RIVALS

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '4px' }}>
        <a href={`/profile/${entry.user_id}`} style={{ textDecoration: 'none', display: 'block', flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '44px 40px 1fr auto',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: currentUserId && !isSelf ? '10px 0 0 10px' : '10px',
            backgroundColor: isRival ? 'rgba(251, 146, 60, 0.06)' : highlight ? '#111' : 'transparent',
            border: isRival ? '1px solid rgba(251, 146, 60, 0.2)' : highlight ? '1px solid #1f1f1f' : '1px solid transparent',
            borderRight: currentUserId && !isSelf ? 'none' : undefined,
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
                {isRival && (
                  <span style={{ fontSize: '11px', color: 'rgba(251, 146, 60, 0.6)', marginLeft: '8px' }}>rival</span>
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

        {/* Rival toggle button */}
        {currentUserId && !isSelf && (
          <button
            onClick={() => toggleRival(entry.user_id)}
            disabled={togglingRival === entry.user_id || (!isRival && !canAddMore)}
            title={isRival ? 'Remove rival' : canAddMore ? 'Add as rival' : `Max ${MAX_RIVALS} rivals`}
            style={{
              width: '44px',
              height: '100%',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isRival ? 'rgba(251, 146, 60, 0.12)' : '#111',
              border: isRival ? '1px solid rgba(251, 146, 60, 0.2)' : '1px solid #1f1f1f',
              borderLeft: 'none',
              borderRadius: '0 10px 10px 0',
              cursor: (!isRival && !canAddMore) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontSize: '16px',
              color: isRival ? '#fb923c' : '#444',
              transition: 'all 0.2s ease',
              opacity: togglingRival === entry.user_id ? 0.5 : (!isRival && !canAddMore) ? 0.3 : 1,
              flexShrink: 0,
            }}
          >
            ⚔️
          </button>
        )}
      </div>
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

        {/* Phase label + rival count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{
            fontSize: '11px',
            color: '#444',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            {activePhases.find(p => p.key === selectedPhase)?.label || 'overall'} standings
          </p>
          {currentUserId && (
            <p style={{ fontSize: '11px', color: '#555' }}>
              ⚔️ {rivalIds.length}/{MAX_RIVALS} rivals
            </p>
          )}
        </div>

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