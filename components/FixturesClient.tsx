'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFlag } from '@/lib/flags'
import Logo from './Logo'
import HoloBackground from './holo/HoloBackground'
import HoloTrophy from './holo/HoloTrophy'
import PlayoffBracket from './PlayoffBracket'

type Fixture = {
  id: string
  home_team: string | null
  away_team: string | null
  kickoff_at: string
  stage: string
  group_name: string | null
  matchday: number | null
  status: string
  home_score: number | null
  away_score: number | null
}

type Prediction = {
  id: string
  fixture_id: string
  predicted_home: number
  predicted_away: number
  predicted_scorers?: string[] | null
}

function formatIST(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]} · ${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')} IST`
}

// plain country flag + name (no circle puck)
function TeamMark({ team, size = 56 }: { team: string | null; size?: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: size, lineHeight: 1 }}>
        {getFlag(team)}
      </div>
      <p className="holo-text" style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em', marginTop: '8px' }}>
        {team || 'TBD'}
      </p>
    </div>
  )
}

export default function FixturesClient({
  fixtures,
  predictions: initialPredictions,
  userId,
}: {
  fixtures: Fixture[]
  predictions: Prediction[]
  userId: string
}) {
  const supabase = createClient()

  const predMap: Record<string, Prediction> = {}
  initialPredictions.forEach(p => { predMap[p.fixture_id] = p })

  const groupFixtures = fixtures.filter(f => f.stage === 'group')
  const knockoutFixtures = fixtures.filter(f => f.stage !== 'group')

  const upcoming = groupFixtures
    .filter(f => f.status !== 'finished' && new Date(f.kickoff_at) > new Date() && f.home_team !== null && f.away_team !== null)
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())

  const finished = groupFixtures
    .filter(f => f.status === 'finished')
    .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())

  const hasKnockout = knockoutFixtures.length > 0
  const allGroupsDone = upcoming.length === 0

  const [queue, setQueue] = useState<Fixture[]>(upcoming)
  const [predicted, setPredicted] = useState<Record<string, Prediction>>(predMap)
  const [view, setView] = useState<'cards' | 'all'>('cards')
  const [inputScores, setInputScores] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [playersData, setPlayersData] = useState<Record<string, string[]>>({})
  const [inputScorers, setInputScorers] = useState<Record<string, string[]>>({})
  const [scorerSearch, setScorerSearch] = useState('')
  const [showScorerList, setShowScorerList] = useState(false)

  useEffect(() => {
    fetch('/players.json')
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => setPlayersData(data))
      .catch(err => console.log('Could not load players.json yet:', err.message))
  }, [])

  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const dragDelta = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [rowAnim, setRowAnim] = useState(0)
  const [rowSnap, setRowSnap] = useState(false)
  const [sliding, setSliding] = useState(false)

  const current = queue[0]

  function onDragStart(x: number) {
    dragStart.current = { x, y: 0 }
    setDragging(true)
    setShowInput(false)
  }

  function onDragMove(x: number) {
    if (!dragStart.current) return
    const delta = x - dragStart.current.x
    dragDelta.current = delta
    setDragX(delta)
  }

  function onDragEnd() {
    if (!dragStart.current) return
    const delta = dragDelta.current

    if (delta > 80) {
      setShowInput(true)
      setDragX(0)
    } else if (delta < -80) {
      skipCard()
    } else {
      setDragX(0)
    }

    dragStart.current = null
    setDragging(false)
    dragDelta.current = 0
  }

  function skipCard() {
    setDragX(-400)
    setTimeout(() => {
      setQueue(q => {
        const [first, ...rest] = q
        return [...rest, first]
      })
      setDragX(0)
      setShowInput(false)
    }, 300)
  }
  function jumpToFixture(fixtureId: string) {
    const index = queue.findIndex(f => f.id === fixtureId)
    if (index === -1) return
    setQueue(q => {
      const reordered = [...q]
      const [item] = reordered.splice(index, 1)
      return [item, ...reordered]
    })
    setShowInput(false)
    setView('cards')
  }

  // smoothly scroll the panoramic strip one card to the side. Buffer cards on both
  // sides mean the re-centre after the scroll is invisible (no snap/pop).
  // dir = 1 scrolls toward the right neighbour, dir = -1 toward the left.
  function scrollStep(dir: 1 | -1) {
    if (dragging || sliding) return
    setSliding(true)
    setShowInput(false)
    const step = (cardRef.current?.offsetWidth ?? 360) + GAP
    setRowSnap(false)
    setRowAnim(dir === 1 ? -step : step)
    setTimeout(() => {
      setRowSnap(true)
      setQueue(q =>
        dir === 1
          ? [...q.slice(1), q[0]]
          : [q[q.length - 1], ...q.slice(0, q.length - 1)]
      )
      setRowAnim(0)
      setSliding(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setRowSnap(false)))
    }, 420)
  }

  async function savePrediction() {
    if (!current) return
    const score = inputScores[current.id]
    if (!score || score.home === '' || score.away === '') return

    const home = parseInt(score.home)
    const away = parseInt(score.away)
    if (isNaN(home) || isNaN(away)) return

    const result = home > away ? 'home' : away > home ? 'away' : 'draw'
    setSaving(true)

    const { data, error } = await supabase.from('predictions').upsert({
      user_id: userId,
      fixture_id: current.id,
      predicted_home: home,
      predicted_away: away,
      predicted_result: result,
      predicted_scorers: inputScorers[current.id] || null,
    }, { onConflict: 'user_id,fixture_id' }).select().single()

    setSaving(false)
    setScorerSearch('')
    if (!error && data) {
      setPredicted(p => ({ ...p, [current.id]: data }))
      setDragX(400)
      setTimeout(() => {
        setQueue(q => q.slice(1))
        setDragX(0)
        setShowInput(false)
      }, 300)
    }
  }
  async function deletePrediction(fixtureId: string) {
    await supabase
      .from('predictions')
      .delete()
      .eq('user_id', userId)
      .eq('fixture_id', fixtureId)

    setPredicted(p => {
      const updated = { ...p }
      delete updated[fixtureId]
      return updated
    })
    setInputScorers(s => {
      const updated = { ...s }
      delete updated[fixtureId]
      return updated
    })
    setShowInput(false)
  }

  if (view === 'all') {
    return (
      <main style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', fontFamily: 'inherit' }}>
        <HoloBackground />
        <div className="holo-content" style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 className="holo-text" style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>all fixtures</h1>
            <button onClick={() => setView('cards')} className="holo-link" style={{ fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← back to cards
            </button>
          </div>

          {upcoming.map(f => {
            const pred = predicted[f.id]
            const locked = new Date(f.kickoff_at) <= new Date()
            return (
              <div key={f.id}
                onClick={() => { if (!locked) jumpToFixture(f.id) }}
                className="holo-panel"
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center', gap: '12px',
                  padding: '14px 18px', marginBottom: '10px',
                  cursor: locked ? 'default' : 'pointer',
                }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '24px' }}>{getFlag(f.home_team)}</p>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>{f.home_team || 'TBD'}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {pred ? (
                    <div>
                      <p className="holo-text" style={{ fontSize: '15px', fontWeight: 700 }}>{pred.predicted_home} — {pred.predicted_away}</p>
                      {pred.predicted_scorers && pred.predicted_scorers.length > 0 && (
                        <p style={{ fontSize: '10px', color: '#5f7d99', marginTop: '2px' }}>
                          ({pred.predicted_scorers.join(', ')})
                        </p>
                      )}
                    </div>
                  ) : locked ? (
                    <p style={{ fontSize: '11px', color: '#f87171' }}>locked</p>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#3a4a63' }}>—</p>
                  )}
                  <p style={{ fontSize: '10px', color: '#4a627d', marginTop: '4px' }}>{formatIST(f.kickoff_at)}</p>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '24px' }}>{getFlag(f.away_team)}</p>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>{f.away_team || 'TBD'}</p>
                </div>
              </div>
            )
          })}

          {finished.length > 0 && (
            <>
              <p className="holo-dim" style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '32px 0 16px', fontWeight: 600 }}>finished</p>
              {finished.map(f => {
                const pred = predicted[f.id]
                return (
                  <div key={f.id} className="holo-panel" style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center', gap: '12px',
                    padding: '14px 18px', marginBottom: '10px', opacity: 0.85,
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '24px' }}>{getFlag(f.home_team)}</p>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>{f.home_team || 'TBD'}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p className="holo-text" style={{ fontSize: '17px', fontWeight: 700 }}>{f.home_score} — {f.away_score}</p>
                      {pred && (
                        <p style={{ fontSize: '11px', color: '#5f7d99', marginTop: '2px' }}>
                          you: {pred.predicted_home} — {pred.predicted_away}
                          {pred.predicted_scorers && pred.predicted_scorers.length > 0 && (
                            <span style={{  }}> ({pred.predicted_scorers.join(', ')})</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '24px' }}>{getFlag(f.away_team)}</p>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>{f.away_team || 'TBD'}</p>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </main>
    )
  }

  // panoramic strip: wide cards, sides angled in 3D. Two buffer cards on each side
  // keep the smooth scroll seamless.
  const CARD_W = 'clamp(300px, 82vw, 400px)'
  const CARD_H = '440px'
  const GAP = 4
  const n = queue.length
  const at = (k: number) => (n > 0 ? queue[((k % n) + n) % n] : null)
  const left1 = n > 1 ? at(-1) : null
  const right1 = n > 1 ? at(1) : null
  const left2 = n > 2 ? at(-2) : null
  const right2 = n > 2 ? at(2) : null

  // a non-interactive preview card, angled into the distance for the panoramic look
  function PreviewCard({ f, side, buffer = false }: { f: Fixture; side: 'left' | 'right'; buffer?: boolean }) {
    const pred = predicted[f.id]
    return (
      <div
        onClick={buffer ? undefined : () => scrollStep(side === 'left' ? -1 : 1)}
        style={{
          flex: '0 0 auto',
          width: CARD_W,
          minHeight: CARD_H,
          borderRadius: '18px',
          border: '1px solid rgba(56,189,248,0.14)',
          background: 'linear-gradient(160deg, rgba(11,20,38,0.94), rgba(6,12,24,0.94))',
          padding: '32px 26px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '28px',
          cursor: buffer ? 'default' : 'pointer',
          pointerEvents: buffer ? 'none' : 'auto',
          transform: side === 'left' ? 'rotateY(42deg)' : 'rotateY(-42deg)',
          transformOrigin: side === 'left' ? 'right center' : 'left center',
          filter: 'saturate(0.9) brightness(0.7)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
        }}
      >
        <p className="holo-dim" style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}>
          {formatIST(f.kickoff_at).split('·')[0]}
          {f.group_name && <span> · {f.group_name}</span>}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', lineHeight: 1 }}>{getFlag(f.home_team)}</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#cfe2f5', marginTop: '8px' }}>{f.home_team}</p>
          </div>
          <span className="holo-dim" style={{ fontSize: '16px', fontWeight: 800 }}>vs</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', lineHeight: 1 }}>{getFlag(f.away_team)}</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#cfe2f5', marginTop: '8px' }}>{f.away_team}</p>
          </div>
        </div>
        <p className="holo-text" style={{ fontSize: '14px', textAlign: 'center', fontWeight: 700 }}>
          {pred ? `${pred.predicted_home} — ${pred.predicted_away}` : 'tap to view'}
        </p>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', fontFamily: 'inherit', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <HoloBackground stadiumOpacity={0.32} />

      <div className="holo-content" style={{ padding: 'clamp(16px, 4vw, 32px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="/dashboard" className="holo-link" style={{ fontSize: '14px' }}>dashboard</a>
          <a href="/leaderboard" className="holo-link" style={{ fontSize: '14px' }}>leaderboard</a>
          <button onClick={() => setView('all')} className="holo-link" style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            view all
          </button>
        </div>
      </div>

      {/* trophy hero */}
      <div className="holo-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
        <HoloTrophy size={92} />
        <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase' }}>
          FIFA
        </p>
      </div>

      <div className="holo-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 clamp(16px, 4vw, 32px) 32px' }}>
        {queue.length === 0 && hasKnockout && allGroupsDone ? (
          <div className="anim-fade-up" style={{ width: '100%' }}>
            <PlayoffBracket fixtures={knockoutFixtures} predictions={initialPredictions} userId={userId} />
          </div>
        ) : queue.length === 0 ? (
          <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <HoloTrophy size={220} />
            <p className="holo-text" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>all done</p>
            <p className="holo-dim" style={{ fontSize: '13px' }}>you&apos;ve predicted every match</p>
            <button onClick={() => setView('all')} className="holo-btn" style={{ marginTop: '12px', padding: '12px 28px', fontSize: '13px' }}>
              view all predictions
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* panoramic strip — sides angled in 3D perspective */}
            <div style={{
              display: 'flex', gap: `${GAP}px`, justifyContent: 'center', alignItems: 'center',
              width: '100%',
              perspective: '1700px',
              perspectiveOrigin: '50% 45%',
              transform: `translateX(${rowAnim}px)`,
              transition: rowSnap ? 'none' : 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>

            {left2 && <PreviewCard f={left2} side="left" buffer />}
            {left1 && <PreviewCard f={left1} side="left" />}

            <div
              ref={cardRef}
              onMouseDown={e => onDragStart(e.clientX)}
              onMouseMove={e => dragging && onDragMove(e.clientX)}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={e => onDragStart(e.touches[0].clientX)}
              onTouchMove={e => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
              className="holo-panel"
              style={{
                flex: '0 0 auto',
                width: CARD_W,
                background: 'linear-gradient(160deg, rgba(16,30,52,0.97), rgba(8,16,30,0.96))',
                padding: '32px 30px',
                minHeight: CARD_H,
                justifyContent: 'space-between',
                display: 'flex',
                flexDirection: 'column',
                cursor: dragging ? 'grabbing' : 'grab',
                transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
                transition: dragging ? 'none' : 'transform 0.3s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {dragX > 40 && (
                <div style={{ position: 'absolute', top: '24px', left: '24px', padding: '6px 16px', border: '2px solid #34d399', borderRadius: '8px', color: '#34d399', fontSize: '13px', fontWeight: 700, opacity: Math.min(1, (dragX - 40) / 60), zIndex: 5 }}>
                  PREDICT
                </div>
              )}
              {dragX < -40 && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 16px', border: '2px solid #f87171', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: 700, opacity: Math.min(1, (-dragX - 40) / 60), zIndex: 5 }}>
                  SKIP
                </div>
              )}

              <p className="holo-dim" style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
                {formatIST(current.kickoff_at)}
                {current.group_name && <span style={{ marginLeft: '8px', color: '#2ee6e6' }}>· {current.group_name}</span>}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px', marginBottom: '28px', marginTop: '12px' }}>
                <TeamMark team={current.home_team} />
                <p className="holo-dim" style={{ fontSize: '18px', fontWeight: 800 }}>vs</p>
                <TeamMark team={current.away_team} />
              </div>

              {predicted[current.id] && !showInput ? (
                <div style={{ textAlign: 'center' }}>
                  <p className="holo-text-emerald" style={{ fontSize: '13px', marginBottom: '8px' }}>predicted ✓</p>
                  <p className="holo-text" style={{ fontSize: '28px', fontWeight: 800 }}>
                    {predicted[current.id].predicted_home} — {predicted[current.id].predicted_away}
                  </p>
                  {predicted[current.id].predicted_scorers && (predicted[current.id].predicted_scorers?.length ?? 0) > 0 && (
                    <p style={{ fontSize: '12px', color: '#7fa6c4', marginTop: '6px' }}>
                      scorers: {predicted[current.id].predicted_scorers?.join(', ')} (+{(predicted[current.id].predicted_scorers?.length ?? 0) * 2} combo bonus)
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '14px' }}>
                    <button
                      onClick={() => {
                        setInputScores(s => ({
                          ...s,
                          [current.id]: {
                            home: String(predicted[current.id].predicted_home),
                            away: String(predicted[current.id].predicted_away)
                          }
                        }))
                        setInputScorers(s => ({
                          ...s,
                          [current.id]: predicted[current.id].predicted_scorers || []
                        }))
                        setScorerSearch('')
                        setShowInput(true)
                      }}
                      className="holo-link"
                      style={{ fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      edit
                    </button>
                    <button onClick={() => deletePrediction(current.id)} style={{ fontSize: '13px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      remove
                    </button>
                  </div>
                </div>
              ) : showInput ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                    <input
                      type="number" min="0" max="20"
                      value={inputScores[current.id]?.home ?? ''}
                      onChange={e => setInputScores(s => ({ ...s, [current.id]: { ...s[current.id], home: e.target.value, away: s[current.id]?.away ?? '' } }))}
                      onMouseDown={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()} placeholder="—"
                      onKeyDown={e => { if (e.key === 'Enter') savePrediction() }}
                      className="holo-input"
                      style={{ width: '64px', height: '64px', textAlign: 'center', borderRadius: '12px', fontSize: '28px', fontWeight: 700 }}
                    />
                    <span className="holo-dim" style={{ fontSize: '24px', fontWeight: 800 }}>—</span>
                    <input
                      type="number" min="0" max="20"
                      value={inputScores[current.id]?.away ?? ''}
                      onChange={e => setInputScores(s => ({ ...s, [current.id]: { ...s[current.id], away: e.target.value, home: s[current.id]?.home ?? '' } }))}
                      onMouseDown={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key === 'Enter') savePrediction() }}
                      placeholder="—"
                      className="holo-input"
                      style={{ width: '64px', height: '64px', textAlign: 'center', borderRadius: '12px', fontSize: '28px', fontWeight: 700 }}
                    />
                  </div>

                  {inputScorers[current.id]?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '14px' }}>
                      {inputScorers[current.id].map(p => (
                        <span key={p} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', fontSize: '11px',
                          background: 'rgba(46,230,230,0.1)',
                          border: '1px solid rgba(46,230,230,0.35)', borderRadius: '100px', color: '#d4f6ff'
                        }}>
                          {p}
                          <button
                            onClick={() => {
                              setInputScorers(s => ({ ...s, [current.id]: (s[current.id] || []).filter(item => item !== p) }))
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onTouchStart={e => e.stopPropagation()}
                            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 700, marginLeft: '4px' }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '240px', margin: '0 auto 20px' }}>
                    <input
                      type="text"
                      placeholder="predict goalscorers (opt)"
                      value={scorerSearch}
                      onFocus={() => setShowScorerList(true)}
                      onChange={e => { setScorerSearch(e.target.value); setShowScorerList(true) }}
                      onMouseDown={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()}
                      className="holo-input"
                      style={{ width: '100%', padding: '10px 16px', borderRadius: '100px', fontSize: '13px', textAlign: 'center' }}
                    />
                    {inputScorers[current.id]?.length > 0 && (
                      <p style={{ fontSize: '10px', color: '#5f7d99', marginTop: '6px' }}>
                        Combo: +{inputScorers[current.id].length * 2} points (all-or-nothing!)
                      </p>
                    )}
                    {showScorerList && [...(current.home_team ? (playersData[current.home_team] || []) : []), ...(current.away_team ? (playersData[current.away_team] || []) : [])].length > 0 && (
                      <div className="holo-panel" style={{
                        position: 'absolute', bottom: '100%', left: 0, right: 0,
                        maxHeight: '180px', overflowY: 'auto', borderRadius: '12px', zIndex: 100, marginBottom: '8px', textAlign: 'left',
                      }}>
                        {[...(current.home_team ? (playersData[current.home_team] || []) : []), ...(current.away_team ? (playersData[current.away_team] || []) : [])]
                          .sort()
                          .filter(p => p.toLowerCase().includes(scorerSearch.toLowerCase()))
                          .slice(0, 10)
                          .map(player => {
                            const isSelected = (inputScorers[current.id] || []).includes(player);
                            return (
                              <div key={player}
                                onClick={() => {
                                  if (!isSelected) {
                                    setInputScorers(s => ({ ...s, [current.id]: [...(s[current.id] || []), player] }))
                                  }
                                  setScorerSearch(''); setShowScorerList(false)
                                }}
                                onMouseDown={e => e.stopPropagation()}
                                onTouchStart={e => e.stopPropagation()}
                                style={{
                                  padding: '10px 16px', fontSize: '13px',
                                  color: isSelected ? '#4a627d' : '#cfe8ff',
                                  cursor: isSelected ? 'default' : 'pointer',
                                  borderBottom: '1px solid rgba(56,189,248,0.12)',
                                  background: isSelected ? 'rgba(46,230,230,0.08)' : 'transparent',
                                }}
                              >
                                {player} {isSelected && '✓'}
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={savePrediction}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    disabled={saving}
                    className="holo-btn-solid"
                    style={{ width: '100%', padding: '14px', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? 'saving...' : 'save prediction'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p className="holo-dim" style={{ fontSize: '15px', marginBottom: '16px' }}>swipe right to predict · swipe left to skip</p>
                  <button onClick={() => setShowInput(true)} className="holo-btn" style={{ padding: '12px 32px', fontSize: '13px' }}>
                    predict this match
                  </button>
                </div>
              )}
            </div>

            {right1 && <PreviewCard f={right1} side="right" />}
            {right2 && <PreviewCard f={right2} side="right" buffer />}

            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '24px', position: 'relative', zIndex: 2 }}>
              <button onClick={skipCard} className="holo-panel" style={{
                width: '54px', height: '54px', borderRadius: '50%',
                color: '#f87171', fontSize: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(248,113,113,0.4)',
              }}>
                ✕
              </button>
              <button onClick={() => setShowInput(true)} className="holo-panel" style={{
                width: '54px', height: '54px', borderRadius: '50%',
                color: '#34d399', fontSize: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(52,211,153,0.5)',
              }}>
                ✓
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
