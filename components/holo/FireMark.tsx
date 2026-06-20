'use client'
import { useEffect, useState } from 'react'

// Streak "fire" sticker. Uses /fire.png if you add it; until then shows a small
// placeholder box where the sticker will sit.
export default function FireMark({ size = 28 }: { size?: number }) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const i = new window.Image()
    i.onload = () => { if (i.naturalWidth > 0) setOk(true) }
    i.onerror = () => setOk(false)
    i.src = '/fire.png'
  }, [])

  if (ok) {
    return <img src="/fire.png" alt="streak" style={{ height: size, width: 'auto', objectFit: 'contain', verticalAlign: 'middle' }} />
  }
  // placeholder until the sticker is uploaded
  return (
    <span aria-label="fire sticker placeholder" style={{
      display: 'inline-block', width: size * 0.72, height: size,
      borderRadius: '5px', border: '1px dashed rgba(245,166,35,0.6)',
      background: 'rgba(245,166,35,0.08)', verticalAlign: 'middle',
    }} />
  )
}
