// Shared backdrop: dark base gradient + a very faint real stadium photo behind all
// page content. Drop a photo at /public/stadium.jpg and it shows through subtly.
export default function HoloBackground({ stadiumOpacity = 0.22 }: { stadiumOpacity?: number }) {
  return (
    <>
      <div className="stadium-bg" aria-hidden />
      <div className="stadium-photo" aria-hidden style={{ opacity: Math.min(stadiumOpacity, 0.32) }} />
      <div className="holo-scanlines" aria-hidden />
    </>
  )
}
