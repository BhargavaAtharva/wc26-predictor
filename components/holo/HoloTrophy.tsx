'use client'
import { useEffect, useState } from 'react'

// Trophy with a glow. Shows the drawn gold-trophy SVG by default, and automatically
// swaps to an image at /trophy.png the moment that file exists (just drop a transparent
// PNG there). The image is test-loaded first, so there's never a broken-image icon.
export default function HoloTrophy({ size = 200, src = '/trophy.png' }: { size?: number; src?: string }) {
  const [imgOk, setImgOk] = useState(false)
  const h = size * 1.45

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => { if (img.naturalWidth > 0) setImgOk(true) }
    img.onerror = () => setImgOk(false)
    img.src = src
  }, [src])

  return (
    <div
      style={{ width: size, height: imgOk ? size : h, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* glow halo */}
      <div aria-hidden style={{
        position: 'absolute', inset: '4%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,205,90,0.45), rgba(255,170,45,0.22) 52%, transparent 72%)',
        filter: 'blur(10px)',
      }} />

      {imgOk ? (
        <img
          src={src}
          alt="World Cup trophy"
          style={{
            position: 'relative',
            maxWidth: size,
            maxHeight: size,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 8px rgba(255,210,110,0.7)) drop-shadow(0 0 20px rgba(255,170,40,0.5))',
          }}
        />
      ) : (
        <TrophySVG size={size} />
      )}
    </div>
  )
}

function TrophySVG({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 220 320"
      width={size}
      height={size * 1.45}
      style={{ position: 'relative', filter: 'drop-shadow(0 0 4px rgba(255,228,150,0.6)) drop-shadow(0 0 16px rgba(46,230,230,0.4))' }}
      aria-label="World Cup trophy"
    >
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stopColor="#fff6d6" />
          <stop offset="28%" stopColor="#f4d27a" />
          <stop offset="55%" stopColor="#e0a93a" />
          <stop offset="80%" stopColor="#a9741f" />
          <stop offset="100%" stopColor="#7c5214" />
        </linearGradient>
        <radialGradient id="globeGold" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff7da" />
          <stop offset="45%" stopColor="#eebf52" />
          <stop offset="100%" stopColor="#9a6a1c" />
        </radialGradient>
        <linearGradient id="malachite" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1f7a63" />
          <stop offset="50%" stopColor="#0c3b30" />
          <stop offset="100%" stopColor="#072820" />
        </linearGradient>
        <clipPath id="globeClip"><circle cx="110" cy="78" r="40" /></clipPath>
      </defs>
      <g>
        <ellipse cx="110" cy="296" rx="44" ry="11" fill="#06201a" />
        <rect x="66" y="262" width="88" height="34" fill="url(#malachite)" />
        <ellipse cx="110" cy="262" rx="44" ry="11" fill="#1f7a63" />
        <ellipse cx="110" cy="272" rx="44" ry="10.5" fill="none" stroke="url(#gold)" strokeWidth="3" />
        <ellipse cx="110" cy="286" rx="44" ry="10.5" fill="none" stroke="url(#gold)" strokeWidth="3" />
        <ellipse cx="110" cy="258" rx="30" ry="8" fill="url(#gold)" />
      </g>
      <path
        d="M110 256 C 92 256, 82 250, 86 230 C 98 206, 92 182, 76 160 C 64 142, 70 122, 92 114 L 110 112 L 128 114 C 150 122, 156 142, 144 160 C 128 182, 122 206, 134 230 C 138 250, 128 256, 110 256 Z"
        fill="url(#gold)" stroke="#6e4912" strokeWidth="1" strokeLinejoin="round"
      />
      <g fill="none" strokeLinecap="round">
        <path d="M96 122 C 80 140, 78 168, 92 196 C 100 214, 98 234, 94 250" stroke="#fff3c4" strokeOpacity="0.7" strokeWidth="2.5" />
        <path d="M112 118 C 104 150, 104 200, 110 252" stroke="#8a5c16" strokeOpacity="0.6" strokeWidth="2" />
        <path d="M126 124 C 140 144, 140 168, 128 196 C 120 214, 122 236, 126 250" stroke="#6e4912" strokeOpacity="0.5" strokeWidth="2" />
      </g>
      <g>
        <circle cx="110" cy="78" r="40" fill="url(#globeGold)" stroke="#6e4912" strokeWidth="1.5" />
        <g clipPath="url(#globeClip)" fill="none" stroke="#7c5214" strokeOpacity="0.55" strokeWidth="1.4">
          <line x1="70" y1="78" x2="150" y2="78" />
          <ellipse cx="110" cy="78" rx="14" ry="40" />
          <ellipse cx="110" cy="78" rx="30" ry="40" />
          <ellipse cx="110" cy="78" rx="40" ry="14" />
          <ellipse cx="110" cy="78" rx="40" ry="30" />
        </g>
        <ellipse cx="96" cy="62" rx="12" ry="8" fill="#fff7da" fillOpacity="0.75" />
      </g>
    </svg>
  )
}
