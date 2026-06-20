'use client'
import { useEffect, useState } from 'react'

// Rank-1 crown. Uses /crown.png if you add it, otherwise the 👑 emoji.
export default function CrownMark({ size = 18 }: { size?: number }) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const i = new window.Image()
    i.onload = () => { if (i.naturalWidth > 0) setOk(true) }
    i.onerror = () => setOk(false)
    i.src = '/crown.png'
  }, [])

  if (ok) {
    return <img src="/crown.png" alt="" style={{ height: size * 1.4, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
  }
  return <span style={{ fontSize: size }}>👑</span>
}
