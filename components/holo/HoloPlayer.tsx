// Solid footballer silhouettes built from filled, tapered body parts with rounded
// joints, boots, hair and hands — so they read as real human outlines (no glow).
type Pose = 'kick' | 'run' | 'celebrate' | 'header'

type Seg = [number, number, number, number, number, number] // x1,y1,w1, x2,y2,w2

function segPath([x1, y1, w1, x2, y2, w2]: Seg): string {
  const dx = x2 - x1, dy = y2 - y1
  const L = Math.hypot(dx, dy) || 1
  const nx = -dy / L, ny = dx / L
  const a = [x1 + nx * w1 / 2, y1 + ny * w1 / 2]
  const b = [x1 - nx * w1 / 2, y1 - ny * w1 / 2]
  const c = [x2 - nx * w2 / 2, y2 - ny * w2 / 2]
  const d = [x2 + nx * w2 / 2, y2 + ny * w2 / 2]
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${d[0].toFixed(1)} ${d[1].toFixed(1)} L${c[0].toFixed(1)} ${c[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)} Z`
}

type PoseDef = {
  head: [number, number, number, number] // cx, cy, rx, ry
  hair?: string
  segs: Seg[]
  boots?: Seg[] // drawn slightly flatter for feet
  ball?: [number, number, number]
}

const POSES: Record<Pose, PoseDef> = {
  // side-on strike, facing right
  kick: {
    head: [94, 50, 15, 17],
    hair: 'M80 46 C78 34 92 30 104 34 C100 36 104 42 102 47 C96 41 86 40 80 46 Z',
    segs: [
      [96, 70, 40, 98, 146, 32],                       // torso
      [91, 144, 27, 83, 184, 18], [83, 184, 18, 87, 214, 12], // planted leg
      [105, 142, 27, 138, 152, 18], [138, 152, 18, 166, 140, 12], // kicking leg
      [90, 76, 15, 66, 92, 11], [66, 92, 11, 53, 79, 8],   // back arm
      [101, 76, 15, 123, 96, 11], [123, 96, 11, 135, 114, 8], // front arm
    ],
    boots: [[86, 215, 12, 106, 221, 9], [165, 140, 12, 184, 133, 8]],
    ball: [194, 126, 12],
  },
  // mid-stride run, facing right
  run: {
    head: [103, 50, 15, 17],
    hair: 'M89 46 C87 34 101 30 113 34 C109 36 113 42 111 47 C105 41 95 40 89 46 Z',
    segs: [
      [101, 70, 40, 97, 146, 32],
      [93, 144, 27, 73, 178, 18], [73, 178, 18, 58, 200, 12],   // back leg
      [101, 144, 27, 122, 170, 18], [122, 170, 18, 113, 198, 12], // front leg
      [105, 76, 14, 124, 90, 10], [124, 90, 10, 117, 67, 7],     // back arm
      [99, 76, 14, 80, 94, 10], [80, 94, 10, 87, 114, 7],        // front arm
    ],
    boots: [[58, 200, 12, 47, 206, 8], [113, 198, 12, 129, 203, 9]],
  },
  // arms raised celebration, front-on
  celebrate: {
    head: [98, 48, 16, 17],
    hair: 'M82 44 C80 30 116 30 114 44 C108 37 88 37 82 44 Z',
    segs: [
      [98, 68, 44, 98, 148, 34],
      [89, 146, 27, 79, 184, 18], [79, 184, 18, 77, 214, 12],   // left leg
      [107, 146, 27, 117, 184, 18], [117, 184, 18, 119, 214, 12], // right leg
      [85, 74, 15, 64, 50, 11], [64, 50, 11, 56, 26, 8],         // left arm up
      [111, 74, 15, 132, 50, 11], [132, 50, 11, 140, 26, 8],     // right arm up
    ],
    boots: [[77, 215, 12, 67, 221, 9], [119, 215, 12, 129, 221, 9]],
  },
  // jumping header
  header: {
    head: [96, 62, 15, 17],
    hair: 'M82 58 C80 46 110 46 110 58 C104 51 88 51 82 58 Z',
    segs: [
      [96, 82, 40, 96, 154, 32],
      [90, 152, 26, 74, 188, 17], [74, 188, 17, 86, 212, 12],   // left leg tucked
      [104, 152, 26, 122, 186, 16], [122, 186, 16, 116, 210, 11],
      [86, 90, 14, 60, 82, 10], [60, 82, 10, 46, 90, 7],         // left arm
      [108, 90, 14, 134, 82, 10], [134, 82, 10, 148, 90, 7],     // right arm
    ],
    boots: [[86, 212, 12, 96, 217, 9], [116, 210, 12, 126, 215, 9]],
    ball: [96, 28, 12],
  },
}

export default function HoloPlayer({ pose = 'run', size = 150, color = '#2ee6e6' }: { pose?: Pose; size?: number; color?: string }) {
  const P = POSES[pose]
  const gradId = `figfill-${pose}-${color}`

  const nodes: [number, number, number][] = []
  P.segs.forEach(s => { nodes.push([s[0], s[1], s[2] / 2]); nodes.push([s[3], s[4], s[5] / 2]) })

  return (
    <svg viewBox="0 0 220 250" width={size} height={size * 1.18} aria-hidden style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="55%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.78" />
        </linearGradient>
      </defs>

      <g fill={`url(#${gradId})`}>
        {P.segs.map((s, i) => <path key={`s${i}`} d={segPath(s)} />)}
        {P.boots?.map((s, i) => <path key={`bt${i}`} d={segPath(s)} />)}
        {nodes.map((n, i) => <circle key={`n${i}`} cx={n[0]} cy={n[1]} r={n[2]} />)}
        <ellipse cx={P.head[0]} cy={P.head[1]} rx={P.head[2]} ry={P.head[3]} />
        {P.hair && <path d={P.hair} />}
      </g>

      {P.ball && <circle cx={P.ball[0]} cy={P.ball[1]} r={P.ball[2]} fill="none" stroke={color} strokeWidth="2.5" />}
    </svg>
  )
}
