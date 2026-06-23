'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import HoloBackground from './holo/HoloBackground'
import Silhouette from './holo/Silhouette'

export default function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const supabase = createClient()
  const [phase, setPhase] = useState<'idle' | 'counting' | 'main'>('idle')
  const [currentCount, setCurrentCount] = useState(0)
  const [labelIndex, setLabelIndex] = useState(0)
  const [labelVisible, setLabelVisible] = useState(true)
  const [mainVisible, setMainVisible] = useState(false)
  const [poseIndex, setPoseIndex] = useState(0)
  const poses = ['kick', 'run', 'celebrate', 'header'] as const

  const stats = [
    { target: 48, label: 'teams' },
    { target: 104, label: 'matches' },
    { target: 1, label: 'winner' },
  ]

  function startExperience() {
    setPhase('counting')
  }

  useEffect(() => {
    if (phase !== 'counting') return

    const runSegment = (from: number, to: number, statIndex: number, onDone: () => void) => {
      const ascending = to > from
      const steps = Math.abs(to - from)
      const duration = statIndex === 2 ? 800 : 600
      const interval = duration / steps
      let current = from

      setLabelVisible(false)
      setTimeout(() => {
        setLabelIndex(statIndex)
        setLabelVisible(true)

        const counter = setInterval(() => {
          current += ascending ? 1 : -1
          setCurrentCount(current)
          if (current === to) {
            clearInterval(counter)
            setTimeout(onDone, 500)
          }
        }, interval)
      }, 300)
    }

    runSegment(0, 48, 0, () => {
      runSegment(48, 104, 1, () => {
        runSegment(104, 1, 2, () => {
          setTimeout(() => {
            setPhase('main')
            setTimeout(() => setMainVisible(true), 100)
          }, 400)
        })
      })
    })
  }, [phase])

  useEffect(() => {
    if (phase !== 'main') return
    const interval = setInterval(() => {
      setPoseIndex(i => (i + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [phase])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (phase === 'idle') {
    return (
      <main onClick={startExperience} style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <HoloBackground stadiumOpacity={0.32} />
        <p className="holo-text anim-pulse holo-content" style={{ fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          tap to enter
        </p>
      </main>
    )
  }

  if (phase === 'counting') {
    return (
      <main style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HoloBackground stadiumOpacity={0.32} />
        <div className="holo-content" style={{ textAlign: 'center' }}>
          <p className="holo-text" style={{ fontSize: 'clamp(5rem, 20vw, 14rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}>
            {currentCount}
          </p>
          <p className="holo-dim" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '16px', opacity: labelVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            {stats[labelIndex].label}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', color: '#e8f4ff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', overflow: 'hidden', opacity: mainVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
      <HoloBackground stadiumOpacity={0.34} />

      <div className="holo-content" style={{ width: '100%', maxWidth: '1040px', margin: '0 auto', padding: 'clamp(24px, 8vw, 80px)', display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px, 5vw, 56px)', alignItems: 'center' }}>

        {/* text block — kept simple, lowercase, like the original */}
        <div style={{ flex: '1 1 380px', maxWidth: '560px' }}>
          <p className="holo-text-emerald" style={{ fontSize: '14px', marginBottom: '36px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
            FIFA World Cup 2026
          </p>

          <h1 style={{ fontSize: 'clamp(3.5rem, 8vw, 7.5rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: '40px', color: '#fff' }}>
            who you<br />got?
          </h1>

          <p className="holo-dim" style={{ fontSize: '15px', marginBottom: '40px' }}>
            so no one lies about their predictions
          </p>

          {isLoggedIn ? (
            <a href="/dashboard" className="holo-btn-solid" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '14px 28px', fontSize: '15px', textDecoration: 'none' }}>
              continue →
            </a>
          ) : (
            <button onClick={signInWithGoogle} className="holo-btn-solid" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '14px 28px', fontSize: '15px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              continue with google
            </button>
          )}
        </div>

        {/* the guy — cycles through all poses */}
        <div style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="anim-float-slow">
          <div style={{ position: 'relative', width: 300 * 1.4, height: 300 }}>
            {poses.map((pose, i) => (
              <div key={pose} style={{ position: 'absolute', inset: 0, opacity: i === poseIndex ? 1 : 0, transition: 'opacity 0.8s ease' }}>
                <Silhouette pose={pose} size={300} color="#5fe6ea" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
