'use client'

import { useState, useEffect } from 'react'
import Logo from './Logo'
import HoloBackground from './holo/HoloBackground'
import Silhouette from './holo/Silhouette'

type Profile = {
  id: string
}

type Pose = 'kick' | 'run' | 'celebrate' | 'header'

// scoring tiers as holographic "records" figures (cricket-scoreboard style, but football)
const TIERS: {
  pts: string
  title: string
  desc: string
  pose: Pose
  size: number
  color: string
}[] = [
  { pts: '7', title: 'exact score', desc: 'predict 2-1, it ends 2-1. pure perfection.', pose: 'celebrate', size: 168, color: '#2ee6e6' },
  { pts: '5', title: 'result + goals', desc: "correct winner & one team's exact goals.", pose: 'kick', size: 150, color: '#38bdf8' },
  { pts: '4', title: 'correct result', desc: 'right winner, goals off.', pose: 'run', size: 134, color: '#34d399' },
  { pts: '2', title: 'goal consolation', desc: "wrong winner, but one team's goals nailed.", pose: 'header', size: 120, color: '#7fb6ff' },
  { pts: '+2', title: 'scorer combo', desc: 'per correct scorer — all or nothing.', pose: 'celebrate', size: 132, color: '#9b8cff' },
]

export default function RulesClient({ profile }: { profile: Profile | null }) {
  // Simulator State
  const [predHome, setPredHome] = useState<number | ''>(2)
  const [predAway, setPredAway] = useState<number | ''>(1)
  const [actualHome, setActualHome] = useState<number | ''>(2)
  const [actualAway, setActualAway] = useState<number | ''>(0)

  const [points, setPoints] = useState<number>(0)
  const [explanation, setExplanation] = useState<string>('')
  const [badgeText, setBadgeText] = useState<string>('')

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
      setPoints(7); setBadgeText('exact score')
      setExplanation("you predicted the exact score. absolute legend behavior.")
    } else if (isCorrectWinner) {
      if (oneTeamGoalsMatched) {
        setPoints(5); setBadgeText('result + goals')
        setExplanation("correct result (win/draw/loss) and one team's exact goal tally right.")
      } else {
        setPoints(4); setBadgeText('correct result')
        setExplanation("correct result (win/draw/loss) but missed on individual team scores.")
      }
    } else if (oneTeamGoalsMatched) {
      setPoints(2); setBadgeText('goal match consolation')
      setExplanation("winner wrong, but you predicted one team's goals exactly.")
    } else {
      setPoints(0); setBadgeText('miss')
      setExplanation("unlucky. neither the winner nor any of the team goals matched up.")
    }
  }, [predHome, predAway, actualHome, actualAway])

  // reveal-on-scroll for the holographic figures
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  useEffect(() => {
    const els = document.querySelectorAll('[data-tier]')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const i = Number((e.target as HTMLElement).dataset.tier)
          setRevealed(prev => new Set(prev).add(i))
        }
      }),
      { threshold: 0.25 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '60px', height: '60px', borderRadius: '12px',
    textAlign: 'center', fontSize: '24px', fontWeight: 700, color: '#fff',
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', fontFamily: 'inherit' }}>
      <HoloBackground stadiumOpacity={0.3} />

      <div className="holo-content" style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {profile ? (
              <a href="/dashboard" className="holo-link" style={{ fontSize: '14px' }}>dashboard</a>
            ) : (
              <a href="/" className="holo-link" style={{ fontSize: '14px' }}>home</a>
            )}
          </div>
        </div>

        {/* Scoreboard sign — the "records board" */}
        <div className="holo-panel holo-corners" style={{
          padding: 'clamp(18px, 4vw, 30px)',
          marginBottom: '36px',
          borderColor: 'rgba(46,230,230,0.4)',
        }}>
          <p className="holo-text-emerald" style={{ fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '10px' }}>
            rules of the game
          </p>
          <h1 className="holo-text" style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 800,
            letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '16px',
          }}>
            how you score.
          </h1>
          <p style={{ fontSize: '15px', color: '#8fb6d4', lineHeight: 1.6, maxWidth: '600px' }}>
            we don&apos;t do boring scoring. here&apos;s how we rank your predictions. you get points based on result direction, goal accuracy, and exact matchups.
          </p>
        </div>

        {/* Scrollable holographic figure lineup */}
        <p className="holo-dim anim-pulse" style={{ fontSize: '12px', marginBottom: '10px' }}>↔ scroll the lineup</p>
        <div
          style={{
            display: 'flex', gap: 'clamp(16px, 4vw, 40px)', alignItems: 'flex-start',
            overflowX: 'auto', padding: '12px 4px 28px',
            borderBottom: '1px solid rgba(46,230,230,0.15)',
            marginBottom: '48px',
            scrollSnapType: 'x mandatory',
          }}
        >
          {TIERS.map((tier, i) => {
            const show = revealed.has(i)
            return (
              <div
                key={tier.title}
                data-tier={i}
                style={{
                  flex: '0 0 auto', textAlign: 'center', scrollSnapAlign: 'center',
                  opacity: show ? 1 : 0,
                  transform: show ? 'translateY(0)' : 'translateY(30px)',
                  transition: `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`,
                }}
              >
                <div className="anim-float" style={{ display: 'flex', justifyContent: 'center', height: '190px', alignItems: 'flex-end' }}>
                  <Silhouette pose={tier.pose} size={150} color={tier.color} />
                </div>
                <p style={{ fontSize: `clamp(40px, 9vw, 64px)`, fontWeight: 800, color: tier.color, lineHeight: 1, marginTop: '6px' }}>
                  {tier.pts}
                </p>
                <p className="holo-text" style={{ fontSize: '14px', fontWeight: 700, textTransform: 'lowercase', marginTop: '6px' }}>{tier.title}</p>
                <p style={{ fontSize: '11px', color: '#6f93b0', maxWidth: '180px', margin: '4px auto 0', lineHeight: 1.4 }}>{tier.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Interactive Simulator */}
        <div className="holo-panel holo-corners" style={{ padding: 'clamp(20px, 5vw, 36px)', marginBottom: '48px' }}>
          <p className="holo-text-emerald" style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px', fontWeight: 600 }}>
            interactive simulator
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'clamp(12px, 4vw, 24px)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <p className="holo-dim" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>your prediction</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" min="0" max="99" value={predHome}
                  onChange={e => setPredHome(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="holo-input" style={inputStyle} />
                <span className="holo-dim" style={{ fontWeight: 700 }}>:</span>
                <input type="number" min="0" max="99" value={predAway}
                  onChange={e => setPredAway(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="holo-input" style={inputStyle} />
              </div>
            </div>

            <div className="holo-dim" style={{ fontSize: '14px', fontWeight: 700, marginTop: '20px' }}>vs</div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <p className="holo-dim" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>actual score</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" min="0" max="99" value={actualHome}
                  onChange={e => setActualHome(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="holo-input" style={inputStyle} />
                <span className="holo-dim" style={{ fontWeight: 700 }}>:</span>
                <input type="number" min="0" max="99" value={actualAway}
                  onChange={e => setActualAway(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="holo-input" style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(5,12,24,0.5)', border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '16px', padding: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '24px', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  background: points > 0 ? 'rgba(46,230,230,0.12)' : 'rgba(8,16,30,0.6)',
                  color: points > 0 ? '#9bfdfd' : '#7fa6c4',
                  padding: '3px 10px', borderRadius: '100px', fontWeight: 600, textTransform: 'lowercase',
                  border: points > 0 ? '1px solid rgba(46,230,230,0.4)' : '1px solid rgba(56,189,248,0.2)',
                }}>
                  {badgeText}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#8fb6d4', lineHeight: 1.5 }}>{explanation}</p>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: points > 0 ? 'linear-gradient(180deg, #2ee6e6, #1aa8c4)' : 'rgba(8,16,30,0.6)',
              color: points > 0 ? '#04222a' : '#4a627d',
              width: '80px', height: '80px', borderRadius: '20px',
              boxShadow: points > 0 ? 'none' : 'none',
              transition: 'all 0.2s ease',
            }}>
              <span style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>+{points}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'lowercase' }}>pts</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '32px' }}>
          <p className="holo-dim" style={{ fontSize: '11px' }}>built for the 2026 world cup. make good picks.</p>
        </div>
      </div>
    </main>
  )
}
