'use client'

// Trophy with a glow. Automatically swaps to an image at /trophy.png
export default function HoloTrophy({ size = 200, src = '/trophy.png' }: { size?: number; src?: string }) {
  const h = size * 1.45

  return (
    <div
      style={{ width: size, height: h, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* glow halo */}
      <div aria-hidden style={{
        position: 'absolute', inset: '4%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,205,90,0.45), rgba(255,170,45,0.22) 52%, transparent 72%)',
        filter: 'blur(10px)',
      }} />

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
    </div>
  )
}
