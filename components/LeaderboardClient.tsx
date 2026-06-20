'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'
import HoloBackground from './holo/HoloBackground'
import CrossedSwords from './holo/CrossedSwords'
import CrownMark from './holo/CrownMark'

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

// per-rank bar colours — a teal→blue ramp that stays in the site palette,
// with a light accent for the rank badge. [c1, c2, accent]
const TIERS: [string, string, string][] = [
  ['#1a7e74', '#0c3338', '#ffd98a'],
  ['#13788f', '#0b2f3e', '#9be3ff'],
  ['#1c63a6', '#0b2742', '#9bc4ff'],
  ['#2a4f93', '#0b1f38', '#aab9ea'],
  ['#1c3350', '#0b1626', '#6f93b0'],
]
const tier = (rank: number) => TIERS[Math.min(Math.max(rank, 1) - 1, TIERS.length - 1)]

function ordinal(n: number) {
  const s = ['TH', 'ST', 'ND', 'RD'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

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
  const [drawingId, setDrawingId] = useState<string | null>(null)

  const leaderboard = phaseLeaderboards[selectedPhase] || []

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
    return b.correct_results - a.correct_results
  })

  const displayLeaderboard = selectedPhase === 'overall'
    ? sortedLeaderboard
    : sortedLeaderboard.filter(e => e.total_points > 0)

  const getRank = (entry: LeaderboardEntry) => {
    if (!hasFinishedMatches) return 0
    return displayLeaderboard.filter(other => other.total_points > entry.total_points).length + 1
  }

  const currentUserEntry = displayLeaderboard.find(e => e.user_id === currentUserId)
  const currentUserRank = currentUserEntry ? getRank(currentUserEntry) : 0

  async function toggleRival(rivalId: string) {
    if (!currentUserId || togglingRival) return
    setTogglingRival(rivalId)

    const isRival = rivalIds.includes(rivalId)

    if (isRival) {
      await supabase.from('rivalries').delete().eq('user_id', currentUserId).eq('rival_id', rivalId)
      setRivalIds(prev => prev.filter(id => id !== rivalId))
    } else {
      if (rivalIds.length >= MAX_RIVALS) {
        setTogglingRival(null)
        return
      }
      setDrawingId(rivalId) // trigger the sword-draw animation
      await supabase.from('rivalries').insert({ user_id: currentUserId, rival_id: rivalId })
      setRivalIds(prev => [...prev, rivalId])
      setTimeout(() => setDrawingId(null), 650)
    }

    setTogglingRival(null)
  }

  function Entry({ entry, rank, highlight }: { entry: LeaderboardEntry, rank: number, highlight?: boolean }) {
    const [c1, c2, accent] = tier(rank || TIERS.length)
    const isRival = rivalIds.includes(entry.user_id)
    const isSelf = entry.user_id === currentUserId
    const canAddMore = rivalIds.length < MAX_RIVALS
    const showRival = currentUserId && !isSelf
    const shield = 'polygon(50% 0%, 100% 16%, 100% 64%, 50% 100%, 0% 64%, 0% 16%)'

    return (
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <a href={`/profile/${entry.user_id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'clamp(70px, 18vw, 100px) 1fr auto',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 18px)',
            height: 'clamp(62px, 13vw, 80px)',
            paddingLeft: '16px',
            paddingRight: showRival ? 'clamp(52px, 12vw, 64px)' : '18px',
            background: `repeating-linear-gradient(100deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 22px), linear-gradient(100deg, ${c1} 0%, ${c2} 72%)`,
            clipPath: 'polygon(1.4% 0, 100% 0, 98.6% 100%, 0 100%)',
            borderRadius: '6px',
            border: highlight ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.06)',
            boxShadow: highlight ? `0 6px 18px rgba(0,0,0,0.4)` : '0 6px 18px rgba(0,0,0,0.4)',
          }}>
            {/* points */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: 'clamp(28px, 7vw, 46px)', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 2px 6px rgba(0,0,0,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                {entry.total_points}
              </span>
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>pts</span>
            </div>

            {/* name + stats */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {rank === 1 && <CrownMark size={15} />}
                <span style={{
                  fontSize: 'clamp(15px, 3.4vw, 22px)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}>
                  {entry.display_name || 'anonymous'}
                </span>
                {highlight && <span style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.1em' }}>YOU</span>}
                {isRival && <span style={{ fontSize: '11px' }}>⚔️</span>}
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(220,240,255,0.6)', marginTop: '3px', letterSpacing: '0.03em' }}>
                {entry.correct_results} correct · {entry.exact_scores} exact
              </p>
            </div>

            {/* rank shield badge */}
            <div style={{ width: '40px', height: '44px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, clipPath: shield, background: 'rgba(255,255,255,0.8)' }} />
              <div style={{
                position: 'absolute', inset: '2px', clipPath: shield,
                background: `linear-gradient(150deg, ${accent}, ${c2})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#0a1322' }}>
                  {rank ? ordinal(rank) : '—'}
                </span>
              </div>
            </div>
          </div>
        </a>

        {/* rival toggle (crossed swords, animated on draw) */}
        {showRival && (
          <button
            onClick={() => toggleRival(entry.user_id)}
            disabled={togglingRival === entry.user_id || (!isRival && !canAddMore)}
            title={isRival ? 'Remove rival' : canAddMore ? 'Add as rival' : `Max ${MAX_RIVALS} rivals`}
            style={{
              position: 'absolute', top: 0, right: 0, height: '100%',
              width: 'clamp(48px, 12vw, 60px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isRival ? 'rgba(255,107,91,0.12)' : 'rgba(6,12,24,0.35)',
              border: 'none',
              borderRadius: '0 6px 6px 0',
              cursor: (!isRival && !canAddMore) ? 'not-allowed' : 'pointer',
              opacity: togglingRival === entry.user_id ? 0.6 : (!isRival && !canAddMore) ? 0.3 : 1,
            }}
          >
            <CrossedSwords active={isRival} drawing={drawingId === entry.user_id} size={24} />
          </button>
        )}
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', fontFamily: 'inherit' }}>
      <HoloBackground stadiumOpacity={0.2} />

      <div className="holo-content" style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '760px', margin: '0 auto', paddingBottom: currentUserEntry && currentUserRank > 3 ? '110px' : undefined }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Logo />
          <a href="/fixtures" className="holo-link" style={{ fontSize: '14px' }}>fixtures</a>
        </div>

        <h1 className="holo-text" style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '4px' }}>
          leaderboard
        </h1>
        <p className="holo-text-emerald" style={{ fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '24px' }}>
          who&apos;s on top?
        </p>

        {/* Phase selector pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '24px' }}>
          {activePhases.map(phase => {
            const isActive = phase.key === selectedPhase
            return (
              <button
                key={phase.key}
                onClick={() => setSelectedPhase(phase.key)}
                className={isActive ? 'holo-btn-solid' : 'holo-btn'}
                style={{ padding: '8px 16px', fontSize: '12px', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {phase.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p className="holo-dim" style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            {activePhases.find(p => p.key === selectedPhase)?.label || 'overall'} standings
          </p>
          {currentUserId && (
            <p className="holo-dim" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CrossedSwords active size={16} /> {rivalIds.length}/{MAX_RIVALS} rivals
            </p>
          )}
        </div>

        {displayLeaderboard.length === 0 ? (
          <p className="holo-dim" style={{ fontSize: '14px' }}>no predictions yet. be the first.</p>
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
        <div className="holo-content" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(5,8,15,0.4), rgba(5,8,15,0.92))',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(56,189,248,0.18)',
          padding: '12px clamp(16px, 4vw, 40px)',
        }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <Entry entry={currentUserEntry} rank={currentUserRank} highlight={true} />
          </div>
        </div>
      )}
    </main>
  )
}
