'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'

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
  predicted_scorer?: string | null
}

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
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Norway': '🇳🇴', 'Sweden': '🇸🇪',
  'Russia': '🇷🇺', 'China': '🇨🇳', 'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳', 'Kazakhstan': '🇰🇿', 'Azerbaijan': '🇦🇿',
  'Ivory Coast': '🇨🇮', 'Cape Verde': '🇨🇻'
}

function formatIST(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]} · ${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')} IST`
}

function getFlag(team: string | null) {
  if (!team) return '🏳️'
  return FLAGS[team] || '🏳️'
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

  const upcoming = fixtures
    .filter(f => f.status !== 'finished' && new Date(f.kickoff_at) > new Date() && f.home_team !== null && f.away_team !== null)
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())

  const finished = fixtures
    .filter(f => f.status === 'finished')
    .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())

  const [queue, setQueue] = useState<Fixture[]>(upcoming)
  const [predicted, setPredicted] = useState<Record<string, Prediction>>(predMap)
  const [view, setView] = useState<'cards' | 'all'>('cards')
  const [inputScores, setInputScores] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [playersData, setPlayersData] = useState<Record<string, string[]>>({})
  const [inputScorers, setInputScorers] = useState<Record<string, string>>({})
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
      predicted_scorer: inputScorers[current.id] || null,
    }, { onConflict: 'user_id,fixture_id' }).select().single()

    setSaving(false)
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

  const predictedCount = queue.filter(f => predicted[f.id]).length
  const totalUpcoming = upcoming.length

  if (view === 'all') {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#e8e8e8', fontFamily: 'inherit' }}>
        <div style={{
          padding: 'clamp(16px, 4vw, 32px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>all fixtures</h1>
            <button onClick={() => setView('cards')} style={{ fontSize: '13px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← back to cards
            </button>
          </div>

          {upcoming.map(f => {
            const pred = predicted[f.id]
            const locked = new Date(f.kickoff_at) <= new Date()
            return (
              <div key={f.id}
                onClick={() => { if (!locked) jumpToFixture(f.id) }}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center', gap: '12px',
                  padding: '14px 0', borderBottom: '1px solid #1a1a1a',
                }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '18px' }}>{getFlag(f.home_team)}</p>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>{f.home_team || 'TBD'}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {pred ? (
                    <div>
                      <p style={{ fontSize: '14px', color: '#888' }}>{pred.predicted_home} — {pred.predicted_away}</p>
                      {pred.predicted_scorer && <p style={{ fontSize: '10px', color: '#555', marginTop: '2px', fontStyle: 'italic' }}>({pred.predicted_scorer})</p>}
                    </div>
                  ) : locked ? (
                    <p style={{ fontSize: '11px', color: '#444' }}>locked</p>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#333' }}>—</p>
                  )}
                  <p style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>{formatIST(f.kickoff_at)}</p>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '18px' }}>{getFlag(f.away_team)}</p>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>{f.away_team || 'TBD'}</p>
                </div>
              </div>
            )
          })}

          {finished.length > 0 && (
            <>
              <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '32px 0 16px', fontWeight: 600 }}>finished</p>
              {finished.map(f => {
                const pred = predicted[f.id]
                return (
                  <div key={f.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center', gap: '12px',
                    padding: '14px 0', borderBottom: '1px solid #1a1a1a',
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '18px' }}>{getFlag(f.home_team)}</p>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>{f.home_team || 'TBD'}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', fontWeight: 700 }}>{f.home_score} — {f.away_score}</p>
                      {pred && (
                        <p style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                          you: {pred.predicted_home} — {pred.predicted_away}
                          {pred.predicted_scorer && <span style={{ fontStyle: 'italic' }}> ({pred.predicted_scorer})</span>}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '18px' }}>{getFlag(f.away_team)}</p>
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

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#e8e8e8', fontFamily: 'inherit', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'clamp(16px, 4vw, 32px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Logo />
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>dashboard</a>
          <a href="/leaderboard" style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>leaderboard</a>
          <button onClick={() => setView('all')} style={{ fontSize: '14px', color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            view all
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 clamp(16px, 4vw, 32px)' }}>
        {queue.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <p style={{ fontSize: '2rem' }}>✓</p>
            <p style={{ fontSize: '16px', fontWeight: 700 }}>all done</p>
            <p style={{ fontSize: '13px', color: '#555' }}>you've predicted every match</p>
            <button onClick={() => setView('all')} style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#111', color: '#888', border: '1px solid #2a2a2a', borderRadius: '100px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              view all predictions
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', width: '100%', maxWidth: '480px' }}>


            <div
              ref={cardRef}
              onMouseDown={e => onDragStart(e.clientX)}
              onMouseMove={e => dragging && onDragMove(e.clientX)}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={e => onDragStart(e.touches[0].clientX)}
              onTouchMove={e => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
              style={{
                backgroundColor: '#111',
                border: '1px solid #1f1f1f',
                borderRadius: '20px',
                padding: '48px 32px',
                minHeight: '620px',
                justifyContent: 'space-between',
                display: 'flex',
                flexDirection: 'column',
                cursor: dragging ? 'grabbing' : 'grab',
                transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
                transition: dragging ? 'none' : 'transform 0.3s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {dragX > 40 && (
                <div style={{ position: 'absolute', top: '24px', left: '24px', padding: '6px 16px', border: '2px solid #4ade80', borderRadius: '8px', color: '#4ade80', fontSize: '13px', fontWeight: 700, opacity: Math.min(1, (dragX - 40) / 60) }}>
                  PREDICT
                </div>
              )}
              {dragX < -40 && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 16px', border: '2px solid #f87171', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: 700, opacity: Math.min(1, (-dragX - 40) / 60) }}>
                  SKIP
                </div>
              )}

              <p style={{ fontSize: '11px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '32px', textAlign: 'center' }}>
                {formatIST(current.kickoff_at)}
                {current.group_name && <span style={{ marginLeft: '8px' }}>· {current.group_name}</span>}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '48px', lineHeight: 1, marginBottom: '12px' }}>{getFlag(current.home_team)}</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>{current.home_team || 'TBD'}</p>
                </div>
                <p style={{ fontSize: '20px', color: '#333', fontWeight: 800 }}>vs</p>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '48px', lineHeight: 1, marginBottom: '12px' }}>{getFlag(current.away_team)}</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>{current.away_team || 'TBD'}</p>
                </div>
              </div>

              {predicted[current.id] && !showInput ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#4ade80', marginBottom: '8px' }}>predicted ✓</p>
                  <p style={{ fontSize: '24px', fontWeight: 800 }}>
                    {predicted[current.id].predicted_home} — {predicted[current.id].predicted_away}
                  </p>
                  {predicted[current.id].predicted_scorer && (
                    <p style={{ fontSize: '13px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
                      scorer: {predicted[current.id].predicted_scorer}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
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
                          [current.id]: predicted[current.id].predicted_scorer || ''
                        }))
                        setShowInput(true)
                      }}
                      style={{ fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
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
                      style={{
                        width: '64px', height: '64px', textAlign: 'center',
                        backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a',
                        borderRadius: '12px', color: '#e8e8e8', fontSize: '28px',
                        fontFamily: 'inherit', fontWeight: 700,
                      }}
                    />
                    <span style={{ fontSize: '24px', color: '#333', fontWeight: 800 }}>—</span>
                    <input
                      type="number" min="0" max="20"
                      value={inputScores[current.id]?.away ?? ''}
                      onChange={e => setInputScores(s => ({ ...s, [current.id]: { ...s[current.id], away: e.target.value, home: s[current.id]?.home ?? '' } }))}
                      onMouseDown={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key === 'Enter') savePrediction() }}
                      placeholder="—"
                      style={{
                        width: '64px', height: '64px', textAlign: 'center',
                        backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a',
                        borderRadius: '12px', color: '#e8e8e8', fontSize: '28px',
                        fontFamily: 'inherit', fontWeight: 700,
                      }}
                    />
                  </div>

                  {/* Searchable Player Scorer Input */}
                  <div 
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'relative', width: '100%', maxWidth: '240px', margin: '0 auto 20px' }}
                  >
                    <input
                      type="text"
                      placeholder="predict goalscorer (opt)"
                      value={inputScorers[current.id] || ''}
                      onFocus={() => setShowScorerList(true)}
                      onChange={e => {
                        setInputScorers(s => ({ ...s, [current.id]: e.target.value }))
                        setShowScorerList(true)
                      }}
                      onMouseDown={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '100px',
                        color: '#e8e8e8',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        textAlign: 'center',
                      }}
                    />
                    {showScorerList && [...(current.home_team ? (playersData[current.home_team] || []) : []), ...(current.away_team ? (playersData[current.away_team] || []) : [])].length > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%', left: 0, right: 0,
                        maxHeight: '180px', overflowY: 'auto',
                        backgroundColor: '#111', border: '1px solid #222',
                        borderRadius: '12px', zIndex: 100, marginBottom: '8px',
                        textAlign: 'left',
                      }}>
                        {[...(current.home_team ? (playersData[current.home_team] || []) : []), ...(current.away_team ? (playersData[current.away_team] || []) : [])]
                          .sort()
                          .filter(p => p.toLowerCase().includes((inputScorers[current.id] || '').toLowerCase()))
                          .slice(0, 10)
                          .map(player => (
                            <div
                              key={player}
                              onClick={() => {
                                setInputScorers(s => ({ ...s, [current.id]: player }))
                                setShowScorerList(false)
                              }}
                              onMouseDown={e => e.stopPropagation()}
                              onTouchStart={e => e.stopPropagation()}
                              style={{
                                padding: '10px 16px',
                                fontSize: '13px',
                                color: '#ccc',
                                cursor: 'pointer',
                                borderBottom: '1px solid #1a1a1a',
                              }}
                            >
                              {player}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <button
                    onClick={savePrediction}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    disabled={saving}
                    style={{
                      width: '100%', padding: '14px',
                      backgroundColor: '#e8e8e8', color: '#0a0a0a',
                      fontWeight: 700, fontSize: '14px',
                      borderRadius: '100px', border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? 'saving...' : 'save prediction'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', color: '#444', marginBottom: '16px' }}>swipe right to predict · swipe left to skip</p>
                  <button
                    onClick={() => setShowInput(true)}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: 'transparent', color: '#888',
                      border: '1px solid #2a2a2a', borderRadius: '100px',
                      fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    predict this match
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '32px' }}>
              <button
                onClick={skipCard}
                style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  backgroundColor: '#111', border: '1px solid #2a2a2a',
                  color: '#f87171', fontSize: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
              <button
                onClick={() => setShowInput(true)}
                style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  backgroundColor: '#111', border: '1px solid #2a2a2a',
                  color: '#4ade80', fontSize: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✓
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}