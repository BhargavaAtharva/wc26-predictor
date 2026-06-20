'use client'

// Two crossed swords for the rivalry button. When `drawing` is set, the blades
// reveal via stroke-dashoffset (an "unsheathing" draw) and a spark flashes.
export default function CrossedSwords({
  active = false,
  drawing = false,
  size = 22,
}: {
  active?: boolean
  drawing?: boolean
  size?: number
}) {
  const color = active || drawing ? '#ff6b5b' : '#3f5d72'
  const glow = 'none'

  // when drawing, blades start hidden (offset 44) and animate to 0
  const bladeAnim = (delay: number): React.CSSProperties =>
    drawing
      ? { strokeDasharray: 44, strokeDashoffset: 44, animation: `sword-draw 0.4s ease ${delay}s forwards` }
      : {}

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: glow, overflow: 'visible' }} aria-hidden>
      <g stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none">
        {/* sword A: handle bottom-left → tip top-right */}
        <line x1="5" y1="19" x2="18.5" y2="5.5" style={bladeAnim(0)} />
        <line x1="3" y1="21" x2="7" y2="17" />            {/* hilt A */}
        <line x1="4.2" y1="17.8" x2="6.2" y2="19.8" />    {/* crossguard A */}

        {/* sword B: handle bottom-right → tip top-left */}
        <line x1="19" y1="19" x2="5.5" y2="5.5" style={bladeAnim(0.12)} />
        <line x1="21" y1="21" x2="17" y2="17" />          {/* hilt B */}
        <line x1="19.8" y1="17.8" x2="17.8" y2="19.8" />  {/* crossguard B */}
      </g>

      {/* spark where the blades cross */}
      {drawing && (
        <g style={{ transformOrigin: '12px 12px', animation: 'sword-flash 0.5s ease 0.3s' }}>
          <circle cx="12" cy="12" r="3" fill="#fff6d0" />
          <circle cx="12" cy="12" r="6" fill="none" stroke="#ffd27a" strokeWidth="1" />
        </g>
      )}
    </svg>
  )
}
