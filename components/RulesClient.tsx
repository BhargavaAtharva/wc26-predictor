'use client'

import { useState, useEffect } from 'react'
import Logo from './Logo'

type Profile = {
  id: string
}

export default function RulesClient({
  profile,
}: {
  profile: Profile | null
}) {
  // Simulator State
  const [predHome, setPredHome] = useState<number | ''>(2)
  const [predAway, setPredAway] = useState<number | ''>(1)
  const [actualHome, setActualHome] = useState<number | ''>(2)
  const [actualAway, setActualAway] = useState<number | ''>(0)

  const [points, setPoints] = useState<number>(0)
  const [explanation, setExplanation] = useState<string>('')
  const [badgeText, setBadgeText] = useState<string>('')

  // Calculate simulated points
  useEffect(() => {
    const ph = predHome === '' ? 0 : Number(predHome)
    const pa = predAway === '' ? 0 : Number(predAway)
    const ah = actualHome === '' ? 0 : Number(actualHome)
    const aa = actualAway === '' ? 0 : Number(actualAway)

    const predResult = ph > pa ? 'home' : pa > ph ? 'away' : 'draw'
    const actualResult = ah > aa ? 'home' : aa > ah ? 'away' : 'draw'

    const isCorrectWinner = predResult === actualResult
    const oneTeamGoalsMatched = ph === ah || pa === aa

    if (ph === ah && pa === aa) {
      setPoints(7)
      setBadgeText('exact score')
      setExplanation("you predicted the exact score. absolute legend behavior.")
    } else if (isCorrectWinner) {
      if (oneTeamGoalsMatched) {
        setPoints(5)
        setBadgeText('result + goals')
        setExplanation("you got the correct result (win/draw/loss) and got one of the team's exact goal tallies right.")
      } else {
        setPoints(4)
        setBadgeText('correct result')
        setExplanation("you got the correct result (win/draw/loss) but missed on individual team scores.")
      }
    } else if (oneTeamGoalsMatched) {
      setPoints(2)
      setBadgeText('goal match consolation')
      setExplanation("you got the winner wrong, but at least you predicted one team's goals exactly.")
    } else {
      setPoints(0)
      setBadgeText('miss')
      setExplanation("unlucky. neither the winner nor any of the team goals matched up.")
    }
  }, [predHome, predAway, actualHome, actualAway])

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: 'inherit',
    }}>
      <div style={{
        padding: 'clamp(16px, 4vw, 32px)',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {profile ? (
              <a href="/dashboard" style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>dashboard</a>
            ) : (
              <a href="/" style={{ fontSize: '14px', color: '#bbb', textDecoration: 'none' }}>home</a>
            )}
          </div>
        </div>

        {/* Title */}
        <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>rules of the game</p>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '24px',
          lineHeight: 1,
        }}>
          how you score.
        </h1>
        <p style={{ fontSize: '15px', color: '#888', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px' }}>
          we don't do boring scoring. here's how we rank your predictions. you get points based on result direction, goal accuracy, and exact matchups.
        </p>

        {/* Rules Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '48px',
        }}>
          {[
            { pts: 7, title: 'exact score', desc: 'you predict 2-1, it ends 2-1. pure perfection.', badge: 'max points' },
            { pts: 5, title: 'result + goals', desc: 'you predict 2-0, it ends 2-1. correct winner & one team\'s score matches.', badge: 'half perfect' },
            { pts: 4, title: 'correct result', desc: 'you predict 1-0, it ends 3-1. correct winner but no goals match.', badge: 'decent pick' },
            { pts: 2, title: 'goal match consolation', desc: 'you predict 2-1, it ends 0-1. wrong winner, but you nailed the away goals.', badge: 'consolation' }
          ].map(rule => (
            <div key={rule.pts} style={{
              backgroundColor: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{rule.title}</h3>
                  <span style={{ fontSize: '10px', color: '#555', border: '1px solid #222', borderRadius: '100px', padding: '2px 8px', textTransform: 'lowercase' }}>{rule.badge}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{rule.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#d4f15c', lineHeight: 1 }}>+{rule.pts}</span>
                <span style={{ fontSize: '11px', color: '#444', textTransform: 'lowercase' }}>points</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Simulator Section */}
        <div style={{
          backgroundColor: '#111',
          border: '1px solid #1a1a1a',
          borderRadius: '24px',
          padding: 'clamp(20px, 5vw, 36px)',
          marginBottom: '48px',
        }}>
          <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px', fontWeight: 600 }}>
            interactive simulator
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Prediction Input */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>your prediction</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={predHome}
                  onChange={e => setPredHome(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#161616',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                <span style={{ color: '#444', fontWeight: 700 }}>:</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={predAway}
                  onChange={e => setPredAway(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#161616',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ color: '#333', fontSize: '14px', fontWeight: 700, marginTop: '20px' }}>vs</div>

            {/* Actual Result Input */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>actual score</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={actualHome}
                  onChange={e => setActualHome(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#161616',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                <span style={{ color: '#444', fontWeight: 700 }}>:</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={actualAway}
                  onChange={e => setActualAway(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#161616',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Simulator Result Output */}
          <div style={{
            backgroundColor: '#161616',
            border: '1px solid #222',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  backgroundColor: points > 0 ? 'rgba(212, 241, 92, 0.1)' : '#222',
                  color: points > 0 ? '#d4f15c' : '#888',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  fontWeight: 600,
                  textTransform: 'lowercase',
                  border: points > 0 ? '1px solid rgba(212, 241, 92, 0.2)' : '1px solid #333'
                }}>
                  {badgeText}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>
                {explanation}
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: points > 0 ? '#d4f15c' : '#222',
              color: points > 0 ? '#0a0a0a' : '#555',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              transition: 'all 0.2s ease'
            }}>
              <span style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>+{points}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'lowercase' }}>pts</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', paddingBottom: '32px' }}>
          <p style={{ fontSize: '11px', color: '#333' }}>
            built for the 2026 world cup. make good picks.
          </p>
        </div>
      </div>
    </main>
  )
}
