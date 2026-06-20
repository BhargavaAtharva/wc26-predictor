import TeamCrest from './holo/TeamCrest'
import FifaMark from './holo/FifaMark'

// Shared poster-style match bar (two-tone slanted, crests on the outer edges, a
// faint "V S" behind the FIFA mark). Used on the profile and the dashboard.
export default function ScoreboardBar({
  homeTeam,
  awayTeam,
  homeSub,
  awaySub,
  centerScore,
  centerStatus,
  vsColor = '#9cc4ee',
  accentColor = '#5b7da6',
}: {
  homeTeam: string
  awayTeam: string
  homeSub?: string
  awaySub?: string
  centerScore?: string
  centerStatus?: { label: string; color: string }
  vsColor?: string
  accentColor?: string
}) {
  const split = 'linear-gradient(104deg, #114a5c 0%, #0b2c3a 47%, #0a2e25 53%, #0d4636 100%)'
  const shards = 'repeating-linear-gradient(104deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 24px)'

  const nameStyle: React.CSSProperties = {
    fontSize: 'clamp(10px, 2.9vw, 20px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', textTransform: 'uppercase',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1,
    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
  }
  const subStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, color: 'rgba(220,240,255,0.65)',
    letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: '2px',
  }
  const vsLetter: React.CSSProperties = {
    fontSize: 'clamp(36px, 9.5vw, 52px)', fontWeight: 900, fontStyle: 'italic', color: vsColor, lineHeight: 1,
  }

  return (
    <div style={{
      position: 'relative',
      display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto', alignItems: 'center',
      height: 'clamp(64px, 14vw, 84px)',
      padding: '0 clamp(10px, 2vw, 18px)',
      background: `${shards}, ${split}`,
      clipPath: 'polygon(0.6% 0, 100% 0, 99.4% 100%, 0 100%)',
      border: `1px solid ${accentColor}33`,
      borderRadius: '4px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)',
    }}>
      <TeamCrest team={homeTeam} size={44} />

      <div style={{ minWidth: 0, textAlign: 'right', paddingRight: 'clamp(4px, 1.5vw, 22px)' }}>
        <div style={nameStyle}>{homeTeam}</div>
        {homeSub && <div style={subStyle}>{homeSub}</div>}
      </div>

      {/* centre */}
      <div style={{ position: 'relative', alignSelf: 'stretch', minWidth: 'clamp(66px, 16vw, 124px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(0px, 0.8vw, 6px)', opacity: 0.3, zIndex: 1 }}>
          <span style={{ ...vsLetter, transform: 'translateY(-8px)' }}>V</span>
          <span style={{ ...vsLetter, transform: 'translateY(8px)' }}>S</span>
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <FifaMark size={38} />
          {centerScore && (
            <span style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 800, color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}>
              {centerScore}
            </span>
          )}
          {centerStatus && (
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: centerStatus.color }}>
              {centerStatus.label}
            </span>
          )}
        </div>
      </div>

      <div style={{ minWidth: 0, textAlign: 'left', paddingLeft: 'clamp(4px, 1.5vw, 22px)' }}>
        <div style={nameStyle}>{awayTeam}</div>
        {awaySub && <div style={subStyle}>{awaySub}</div>}
      </div>

      <TeamCrest team={awayTeam} size={44} />
    </div>
  )
}
