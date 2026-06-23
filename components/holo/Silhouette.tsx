'use client'
import { useEffect, useState } from 'react'

type Pose = 'kick' | 'run' | 'celebrate' | 'header'

// Renders a per-pose silhouette image (drop transparent PNGs in /public/silhouettes/,
// e.g. kick.png, run.png, celebrate.png, header.png), tinted to `color` via a CSS mask
// so it matches each tier. Shows nothing until the PNG is loaded, then fades in.
export default function Silhouette({
  src,
  color = '#2ee6e6',
  size = 150,
  pose = 'kick',
}: {
  src?: string
  color?: string
  size?: number
  pose?: Pose
}) {
  const url = src || `/silhouettes/${pose}.png`
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const i = new window.Image()
    i.onload = () => { if (i.naturalWidth > 0) setOk(true) }
    i.onerror = () => setOk(false)
    i.src = url
  }, [url])

  return (
    <div
      aria-hidden
      style={{
        // height-based sizing so differently-cropped PNGs all render the same height
        width: size * 1.4,
        height: size,
        background: color,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: 'auto 100%',
        maskSize: 'auto 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center bottom',
        maskPosition: 'center bottom',
        opacity: ok ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  )
}
