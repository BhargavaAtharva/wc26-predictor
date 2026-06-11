export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <a href="/dashboard" style={{ textDecoration: 'none', display: 'block', flexShrink: 0, margin: 0, padding: 0, lineHeight: 0 }}>
      <img
        src="/logo.png"
        alt="WYG"
        style={{ height: '70px', width: 'auto', background: 'transparent', margin: 0, padding: 0 }}
      />
    </a>
  )
}