'use client'
import { useEffect, useState } from 'react'
import { dominantColor, mix, luminance } from '@/lib/flagColors'

// A team "logo": uses a real crest at /logos/<slug>.png if you add one, otherwise
// renders a generated shield badge in the country's dominant colour. No copyrighted
// crests are bundled — drop your own PNGs into public/logos/ to override.
function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')
}
function code(name: string) {
  const parts = name.split(/[\s-]+/).filter(Boolean)
  if (parts.length > 1) return (parts[0][0] + parts[1].slice(0, 2)).toUpperCase()
  return name.slice(0, 3).toUpperCase()
}

export default function TeamCrest({ team, size = 44 }: { team: string; size?: number }) {
  const [imgOk, setImgOk] = useState(false)
  const src = `/logos/${slug(team)}.png`

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => { if (img.naturalWidth > 0) setImgOk(true) }
    img.onerror = () => setImgOk(false)
    img.src = src
  }, [src])

  if (imgOk) {
    return (
      <img src={src} alt={team} width={size} height={size}
        style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', flexShrink: 0 }} />
    )
  }

  const base = dominantColor(team)
  const light = mix(base, '#ffffff', 0.32)
  const dark = mix(base, '#000000', 0.32)
  const textDark = luminance(base) > 0.62
  const shield = 'polygon(50% 0%, 100% 16%, 100% 64%, 50% 100%, 0% 64%, 0% 16%)'

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))' }}>
      {/* outline */}
      <div style={{ position: 'absolute', inset: 0, clipPath: shield, background: 'rgba(255,255,255,0.85)' }} />
      {/* fill */}
      <div style={{
        position: 'absolute', inset: '2px', clipPath: shield,
        background: `linear-gradient(150deg, ${light}, ${base} 55%, ${dark})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
      }}>
        <span style={{ fontSize: size * 0.16, lineHeight: 1 }}>★</span>
        <span style={{
          fontSize: size * 0.26, fontWeight: 900, letterSpacing: '0.02em',
          color: textDark ? '#10243a' : '#ffffff',
          textShadow: textDark ? 'none' : '0 1px 2px rgba(0,0,0,0.4)',
        }}>{code(team)}</span>
      </div>
    </div>
  )
}
