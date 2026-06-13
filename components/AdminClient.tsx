'use client'

import { useState } from 'react'
import { saveResult as saveResultAction } from '@/app/admin/actions'
import Logo from './Logo'

type Fixture = {
  id: string
  home_team: string | null
  away_team: string | null
  kickoff_at: string
  stage: string
  status: string
  home_score: number | null
  away_score: number | null
  scorers?: string[] | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const day = d.getUTCDate()
  const month = months[d.getUTCMonth()]
  const hours = String(d.getUTCHours() + 5).padStart(2, '0')
  const mins = String(d.getUTCMinutes() + 30).padStart(2, '0')
  return `${day} ${month}, ${hours}:${mins}`
}

export default function AdminClient({ fixtures }: { fixtures: Fixture[] }) {
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [fixtureScorers, setFixtureScorers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<string>('all')

  async function saveResult(fixtureId: string) {
    if (saving[fixtureId]) return
    const score = scores[fixtureId]
    if (!score || score.home === '' || score.away === '') return

    const home = parseInt(score.home)
    const away = parseInt(score.away)
    if (isNaN(home) || isNaN(away)) return

    const text = fixtureScorers[fixtureId] !== undefined
      ? fixtureScorers[fixtureId]
      : (fixtures.find(f => f.id === fixtureId)?.scorers?.join(', ') || '')
    const scorersArr = text.split(',').map(s => s.trim()).filter(Boolean)

    setSaving(s => ({ ...s, [fixtureId]: true }))

    const result = await saveResultAction(fixtureId, home, away, scorersArr.length > 0 ? scorersArr : null)
    console.log('result:', result)

    setSaving(s => ({ ...s, [fixtureId]: false }))

    if (result.success) {
      setSaved(s => ({ ...s, [fixtureId]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [fixtureId]: false })), 3000)
    }
  }

  const stages = ['all', 'group', 'r32', 'r16', 'qf', 'sf', 'third', 'final']
  const stageLabel: Record<string, string> = {
    all: 'all', group: 'group stage', r32: 'round of 32',
    r16: 'round of 16', qf: 'quarter-finals',
    sf: 'semi-finals', third: 'third place', final: 'final'
  }

  const filtered = filter === 'all' ? fixtures : fixtures.filter(f => f.stage === filter)

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
          <a href="/fixtures" style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>
            fixtures
          </a>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {stages.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px',
                backgroundColor: filter === s ? '#e8e8e8' : '#111',
                color: filter === s ? '#0a0a0a' : '#555',
                border: '1px solid #1f1f1f',
                borderRadius: '100px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {stageLabel[s]}
            </button>
          ))}
        </div>

        <div>
          {filtered.map(f => (
            <div key={f.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 0',
              borderBottom: '1px solid #1a1a1a',
            }}>
              <div>
                <p style={{ fontSize: '13px', color: '#e8e8e8', fontWeight: 600 }}>
                  {f.home_team || 'TBD'} vs {f.away_team || 'TBD'}
                </p>
                <p style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>
                  {formatDate(f.kickoff_at)} · {stageLabel[f.stage] || f.stage}
                  {f.status === 'finished' && (
                    <span style={{ color: '#4ade80', marginLeft: '8px' }}>
                      {f.home_score} — {f.away_score} ✓
                    </span>
                  )}
                  {f.scorers && f.scorers.length > 0 && (
                    <span style={{ color: '#666', marginLeft: '8px', fontStyle: 'italic' }}>
                      ({f.scorers.join(', ')})
                    </span>
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="scorers (comma-separated)"
                  value={fixtureScorers[f.id] ?? (f.scorers ? f.scorers.join(', ') : '')}
                  onChange={e => setFixtureScorers(s => ({ ...s, [f.id]: e.target.value }))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#111', border: '1px solid #2a2a2a',
                    borderRadius: '6px', color: '#e8e8e8', fontSize: '12px',
                    width: '180px',
                    fontFamily: 'inherit',
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder={f.home_score !== null ? String(f.home_score) : '0'}
                  value={scores[f.id]?.home ?? ''}
                  onChange={e => setScores(s => ({ ...s, [f.id]: { ...s[f.id], home: e.target.value, away: s[f.id]?.away ?? '' } }))}
                  style={{
                    width: '44px', height: '36px', textAlign: 'center',
                    backgroundColor: '#111', border: '1px solid #2a2a2a',
                    borderRadius: '6px', color: '#e8e8e8', fontSize: '16px',
                    fontFamily: 'inherit', fontWeight: 600,
                  }}
                />
                <span style={{ color: '#444' }}>—</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder={f.away_score !== null ? String(f.away_score) : '0'}
                  value={scores[f.id]?.away ?? ''}
                  onChange={e => setScores(s => ({ ...s, [f.id]: { ...s[f.id], away: e.target.value, home: s[f.id]?.home ?? '' } }))}
                  style={{
                    width: '44px', height: '36px', textAlign: 'center',
                    backgroundColor: '#111', border: '1px solid #2a2a2a',
                    borderRadius: '6px', color: '#e8e8e8', fontSize: '16px',
                    fontFamily: 'inherit', fontWeight: 600,
                  }}
                />
                <button
                  onClick={() => saveResult(f.id)}
                  disabled={saving[f.id]}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: saved[f.id] ? '#1a3a1a' : '#1a1a1a',
                    color: saved[f.id] ? '#4ade80' : '#888',
                    border: `1px solid ${saved[f.id] ? '#2a4a2a' : '#2a2a2a'}`,
                    borderRadius: '6px', fontSize: '12px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {saving[f.id] ? '...' : saved[f.id] ? 'saved ✓' : 'save'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}