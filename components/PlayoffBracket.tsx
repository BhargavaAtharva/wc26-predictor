'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TeamCrest from './holo/TeamCrest'

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
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
  return `${ist.getUTCDate()} ${months[ist.getUTCMonth()]} · ${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')}`
}

const STAGE_ORDER = ['r32','r16','qf','sf','third','final'] as const
const STAGE_LABELS: Record<string, string> = {
  r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', third: '3rd', final: 'Final',
}
const STAGE_FULL: Record<string, string> = {
  r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-Finals', sf: 'Semi-Finals', third: '3rd Place', final: 'Final',
}

export default function PlayoffBracket({
  fixtures,
  predictions: initialPredictions,
  userId,
}: {
  fixtures: Fixture[]
  predictions: Prediction[]
  userId: string
}) {
  const supabase = createClient()

  const [predicted, setPredicted] = useState<Record<string, Prediction>>(() => {
    const m: Record<string, Prediction> = {}
    initialPredictions.forEach(p => { m[p.fixture_id] = p })
    return m
  })
  const [inputScores, setInputScores] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [playersData, setPlayersData] = useState<Record<string, string[]>>({})
  const [inputScorers, setInputScorers] = useState<Record<string, string[]>>({})
  const [scorerSearch, setScorerSearch] = useState('')
  const [showScorerList, setShowScorerList] = useState(false)
  const [bracketView, setBracketView] = useState(true)

  useEffect(() => {
    fetch('/players.json')
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json() })
      .then(data => setPlayersData(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside() {
      if (expandedId) setExpandedId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [expandedId])

  const knockout = fixtures
    .filter(f => f.stage !== 'group')
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())

  const thirdPlace = knockout.find(f => f.stage === 'third')
  const bracketFixtures = knockout.filter(f => f.stage !== 'third')

  const byStage = (stage: string) => bracketFixtures.filter(f => f.stage === stage)

  async function savePrediction(fixtureId: string) {
    const score = inputScores[fixtureId]
    if (!score || score.home === '' || score.away === '') return
    const home = parseInt(score.home)
    const away = parseInt(score.away)
    if (isNaN(home) || isNaN(away)) return
    const result = home > away ? 'home' : away > home ? 'away' : 'draw'
    setSaving(fixtureId)
    const { data, error } = await supabase.from('predictions').upsert({
      user_id: userId,
      fixture_id: fixtureId,
      predicted_home: home,
      predicted_away: away,
      predicted_result: result,
      predicted_scorers: inputScorers[fixtureId] || null,
    }, { onConflict: 'user_id,fixture_id' }).select().single()
    setSaving(null)
    if (!error && data) {
      setPredicted(p => ({ ...p, [fixtureId]: data }))
      setExpandedId(null)
      setScorerSearch('')
    }
  }

  async function deletePrediction(fixtureId: string) {
    await supabase.from('predictions').delete().eq('user_id', userId).eq('fixture_id', fixtureId)
    setPredicted(p => { const u = { ...p }; delete u[fixtureId]; return u })
    setInputScorers(s => { const u = { ...s }; delete u[fixtureId]; return u })
    setExpandedId(null)
  }

  /* ── tiny match node for the bracket ── */
  function BracketMatch({ f, compact = false }: { f: Fixture; compact?: boolean }) {
    const pred = predicted[f.id]
    const locked = !f.home_team || !f.away_team || new Date(f.kickoff_at) <= new Date()
    const finished = f.status === 'finished'
    const isExpanded = expandedId === f.id

    function TeamRow({ team, score, predScore, isHome }: { team: string | null; score: number | null; predScore?: number; isHome: boolean }) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: compact ? '4px 8px' : '6px 10px',
          background: isHome ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderBottom: isHome ? '1px solid rgba(56,189,248,0.08)' : 'none',
        }}>
          {team ? <TeamCrest team={team} size={compact ? 18 : 22} /> : (
            <div style={{ width: compact ? 18 : 22, height: compact ? 18 : 22, borderRadius: '50%', background: 'rgba(56,189,248,0.08)', border: '1px dashed rgba(56,189,248,0.2)' }} />
          )}
          <span style={{ flex: 1, fontSize: compact ? '10px' : '12px', fontWeight: 700, color: team ? '#d4e8ff' : '#3a4a63', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team || 'TBD'}
          </span>
          {finished && score !== null && (
            <span style={{ fontSize: compact ? '11px' : '13px', fontWeight: 800, color: '#fff', minWidth: '16px', textAlign: 'right' }}>{score}</span>
          )}
          {!finished && pred && predScore !== undefined && (
            <span style={{ fontSize: compact ? '10px' : '12px', fontWeight: 700, color: '#34d399', minWidth: '16px', textAlign: 'right' }}>{predScore}</span>
          )}
        </div>
      )
    }

    return (
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div
          onClick={() => {
            if (locked && !pred) return
            if (isExpanded) { setExpandedId(null); return }
            if (pred && !finished) {
              setInputScores(s => ({ ...s, [f.id]: { home: String(pred.predicted_home), away: String(pred.predicted_away) } }))
              setInputScorers(s => ({ ...s, [f.id]: pred.predicted_scorers || [] }))
            }
            setExpandedId(f.id)
            setScorerSearch('')
          }}
          style={{
            width: compact ? '130px' : '160px',
            borderRadius: '8px',
            border: pred ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(56,189,248,0.2)',
            background: 'linear-gradient(160deg, rgba(14,26,46,0.95), rgba(6,12,24,0.95))',
            overflow: 'hidden',
            cursor: (locked && !pred) ? 'default' : 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: isExpanded ? '0 0 16px rgba(46,230,230,0.2)' : '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* date chip */}
          <div style={{ padding: '3px 8px', fontSize: '8px', color: '#4a627d', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
            {formatIST(f.kickoff_at)}
          </div>
          <TeamRow team={f.home_team} score={f.home_score} predScore={pred?.predicted_home} isHome={true} />
          <TeamRow team={f.away_team} score={f.away_score} predScore={pred?.predicted_away} isHome={false} />
          {pred && !finished && (
            <div style={{ padding: '2px', textAlign: 'center', background: 'rgba(52,211,153,0.08)', fontSize: '8px', color: '#34d399', fontWeight: 700, letterSpacing: '0.1em' }}>
              PREDICTED
              {pred.predicted_scorers && pred.predicted_scorers.length > 0 && (
                <span style={{ color: '#5f7d99' }}> · {pred.predicted_scorers.length} scorer{pred.predicted_scorers.length > 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </div>

        {/* expanded prediction panel */}
        {isExpanded && !finished && !locked && (
          <div
            onClick={e => e.stopPropagation()}
            className="holo-panel"
            style={{
              position: 'absolute', top: '100%',
              marginTop: '6px', padding: '14px', zIndex: 50, width: '260px',
              borderRadius: '12px',
              ...(f.stage === 'r32' 
                ? { left: 0, transform: 'none' }
                : f.stage === 'final' 
                  ? { right: 0, transform: 'none' }
                  : { left: '50%', transform: 'translateX(-50%)' }
              )
            }}
          >
            {/* score inputs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <TeamCrest team={f.home_team!} size={28} />
                <p style={{ fontSize: '9px', color: '#7fa6c4', marginTop: '2px' }}>{f.home_team}</p>
              </div>
              <input type="number" min="0" max="20"
                value={inputScores[f.id]?.home ?? ''}
                onChange={e => setInputScores(s => ({ ...s, [f.id]: { ...s[f.id], home: e.target.value, away: s[f.id]?.away ?? '' } }))}
                onKeyDown={e => { if (e.key === 'Enter') savePrediction(f.id) }}
                placeholder="—" className="holo-input"
                style={{ width: '44px', height: '44px', textAlign: 'center', borderRadius: '8px', fontSize: '20px', fontWeight: 700 }}
              />
              <span className="holo-dim" style={{ fontSize: '16px', fontWeight: 800 }}>—</span>
              <input type="number" min="0" max="20"
                value={inputScores[f.id]?.away ?? ''}
                onChange={e => setInputScores(s => ({ ...s, [f.id]: { ...s[f.id], away: e.target.value, home: s[f.id]?.home ?? '' } }))}
                onKeyDown={e => { if (e.key === 'Enter') savePrediction(f.id) }}
                placeholder="—" className="holo-input"
                style={{ width: '44px', height: '44px', textAlign: 'center', borderRadius: '8px', fontSize: '20px', fontWeight: 700 }}
              />
              <div style={{ textAlign: 'center' }}>
                <TeamCrest team={f.away_team!} size={28} />
                <p style={{ fontSize: '9px', color: '#7fa6c4', marginTop: '2px' }}>{f.away_team}</p>
              </div>
            </div>

            {/* scorer pills */}
            {(inputScorers[f.id]?.length ?? 0) > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginBottom: '8px' }}>
                {inputScorers[f.id].map(p => (
                  <span key={p} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    padding: '3px 8px', fontSize: '10px',
                    background: 'rgba(46,230,230,0.1)', border: '1px solid rgba(46,230,230,0.35)', borderRadius: '100px', color: '#d4f6ff',
                  }}>
                    {p}
                    <button onClick={() => setInputScorers(s => ({ ...s, [f.id]: (s[f.id] || []).filter(x => x !== p) }))}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 0, fontSize: '10px', fontWeight: 700 }}>✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* scorer search */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input type="text" placeholder="goalscorers (opt)" value={scorerSearch}
                onFocus={() => setShowScorerList(true)}
                onChange={e => { setScorerSearch(e.target.value); setShowScorerList(true) }}
                className="holo-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '100px', fontSize: '11px', textAlign: 'center' }}
              />
              {(inputScorers[f.id]?.length ?? 0) > 0 && (
                <p style={{ fontSize: '9px', color: '#5f7d99', marginTop: '4px', textAlign: 'center' }}>
                  Combo: +{inputScorers[f.id].length * 2} pts (all-or-nothing)
                </p>
              )}
              {showScorerList && (() => {
                const players = [...(f.home_team ? (playersData[f.home_team] || []) : []), ...(f.away_team ? (playersData[f.away_team] || []) : [])]
                if (players.length === 0) return null
                return (
                  <div className="holo-panel" style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0,
                    maxHeight: '140px', overflowY: 'auto', borderRadius: '10px', zIndex: 100, marginBottom: '6px', textAlign: 'left',
                  }}>
                    {players.sort().filter(p => p.toLowerCase().includes(scorerSearch.toLowerCase())).slice(0, 8).map(player => {
                      const sel = (inputScorers[f.id] || []).includes(player)
                      return (
                        <div key={player}
                          onClick={() => { if (!sel) { setInputScorers(s => ({ ...s, [f.id]: [...(s[f.id] || []), player] })) }; setScorerSearch(''); setShowScorerList(false) }}
                          style={{ padding: '7px 12px', fontSize: '11px', color: sel ? '#4a627d' : '#cfe8ff', cursor: sel ? 'default' : 'pointer', borderBottom: '1px solid rgba(56,189,248,0.1)', background: sel ? 'rgba(46,230,230,0.08)' : 'transparent' }}>
                          {player} {sel && '✓'}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* action buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => savePrediction(f.id)} disabled={saving === f.id}
                className="holo-btn-solid" style={{ flex: 1, padding: '9px', fontSize: '12px', borderRadius: '8px' }}>
                {saving === f.id ? '...' : 'save'}
              </button>
              {pred && (
                <button onClick={() => deletePrediction(f.id)}
                  style={{ padding: '9px 12px', fontSize: '11px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── connector lines between bracket rounds ── */
  function BracketConnector({ matchCount, height }: { matchCount: number; height: number }) {
    const gap = height / matchCount
    return (
      <div style={{ width: '20px', position: 'relative', flexShrink: 0 }}>
        {Array.from({ length: matchCount / 2 }).map((_, i) => {
          const y1 = gap * (i * 2) + gap / 2
          const y2 = gap * (i * 2 + 1) + gap / 2
          const mid = (y1 + y2) / 2
          return (
            <svg key={i} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="0" y1={y1} x2="10" y2={y1} stroke="rgba(46,230,230,0.25)" strokeWidth="1" />
              <line x1="10" y1={y1} x2="10" y2={y2} stroke="rgba(46,230,230,0.25)" strokeWidth="1" />
              <line x1="0" y1={y2} x2="10" y2={y2} stroke="rgba(46,230,230,0.25)" strokeWidth="1" />
              <line x1="10" y1={mid} x2="20" y2={mid} stroke="rgba(46,230,230,0.25)" strokeWidth="1" />
            </svg>
          )
        })}
      </div>
    )
  }

  /* ── bracket column for a single round ── */
  function BracketColumn({ stage, matches }: { stage: string; matches: Fixture[] }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2ee6e6', marginBottom: '8px' }}>
          {STAGE_LABELS[stage]}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: '8px' }}>
          {matches.map(f => <BracketMatch key={f.id} f={f} compact={stage === 'r32'} />)}
        </div>
      </div>
    )
  }

  // progress
  const predictable = knockout.filter(f => f.home_team && f.away_team && f.status !== 'finished' && new Date(f.kickoff_at) > new Date())
  const predictedCount = predictable.filter(f => predicted[f.id]).length

  /* ── list view (mobile-friendly) ── */
  function ListView() {
    const stages = STAGE_ORDER.filter(s => knockout.some(f => f.stage === s))

    return (
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {stages.map(stage => {
          const matches = knockout.filter(f => f.stage === stage)
          if (matches.length === 0) return null
          return (
            <div key={stage} style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2ee6e6', marginBottom: '10px', textAlign: 'center' }}>
                {STAGE_FULL[stage] || stage}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                {matches.map(f => <BracketMatch key={f.id} f={f} />)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="holo-text" style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            playoffs
          </h2>
          <p className="holo-dim" style={{ fontSize: '11px', letterSpacing: '0.12em', marginTop: '2px' }}>
            {predictedCount}/{predictable.length} predicted
          </p>
        </div>
        <button onClick={() => setBracketView(!bracketView)} className="holo-btn"
          style={{ padding: '6px 14px', fontSize: '11px', letterSpacing: '0.06em' }}>
          {bracketView ? 'list view' : 'bracket view'}
        </button>
      </div>

      {/* progress bar */}
      <div style={{ height: '3px', background: 'rgba(56,189,248,0.12)', borderRadius: '2px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '100%', width: predictable.length > 0 ? `${(predictedCount / predictable.length) * 100}%` : '0%', background: 'linear-gradient(90deg, #2ee6e6, #34d399)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
      </div>

      {bracketView ? (
        /* ── horizontal bracket ── */
        <div style={{ overflowX: 'auto', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', minWidth: 'max-content', minHeight: '600px' }}>
            {/* R32 */}
            {byStage('r32').length > 0 && (
              <>
                <BracketColumn stage="r32" matches={byStage('r32')} />
                <BracketConnector matchCount={byStage('r32').length} height={byStage('r32').length * 78} />
              </>
            )}
            {/* R16 */}
            {byStage('r16').length > 0 && (
              <>
                <BracketColumn stage="r16" matches={byStage('r16')} />
                <BracketConnector matchCount={byStage('r16').length} height={byStage('r16').length * 78} />
              </>
            )}
            {/* QF */}
            {byStage('qf').length > 0 && (
              <>
                <BracketColumn stage="qf" matches={byStage('qf')} />
                <BracketConnector matchCount={byStage('qf').length} height={byStage('qf').length * 78} />
              </>
            )}
            {/* SF */}
            {byStage('sf').length > 0 && (
              <>
                <BracketColumn stage="sf" matches={byStage('sf')} />
                <BracketConnector matchCount={byStage('sf').length} height={byStage('sf').length * 78} />
              </>
            )}
            {/* Final */}
            {byStage('final').length > 0 && (
              <BracketColumn stage="final" matches={byStage('final')} />
            )}
          </div>

          {/* 3rd place match below */}
          {thirdPlace && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7fa6c4' }}>3rd place</p>
              <BracketMatch f={thirdPlace} />
            </div>
          )}
        </div>
      ) : (
        <ListView />
      )}
    </div>
  )
}
