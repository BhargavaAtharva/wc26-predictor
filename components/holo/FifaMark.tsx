'use client'
import { useEffect, useState } from 'react'

// Centre competition mark. Uses /fifa.png if you add it, otherwise a simple wordmark.
export default function FifaMark({ size = 30 }: { size?: number }) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const i = new window.Image()
    i.onload = () => { if (i.naturalWidth > 0) setOk(true) }
    i.onerror = () => setOk(false)
    i.src = '/fifa.png'
  }, [])

  if (ok) {
    return (
      <img src="/fifa.png" alt="FIFA"
        style={{
          height: size, width: 'auto', maxHeight: size, maxWidth: size * 1.6,
          objectFit: 'contain', display: 'block',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
        }} />
    )
  }
  return (
    <span style={{
      fontSize: size * 0.42, fontWeight: 900, letterSpacing: '0.04em',
      color: '#eaffff',
    }}>FIFA</span>
  )
}
