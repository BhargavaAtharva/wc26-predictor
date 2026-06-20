// Actual flag colours per country, used to build solid colour-block panels that
// represent each nation's flag (not random hues).
export const FLAG_COLORS: Record<string, string[]> = {
  'Mexico': ['#006847', '#ffffff', '#ce1126'],
  'South Africa': ['#007a4d', '#ffb612', '#de3831'],
  'South Korea': ['#ffffff', '#cd2e3a', '#0047a0'],
  'Czechia': ['#11457e', '#ffffff', '#d7141a'],
  'Canada': ['#ff0000', '#ffffff', '#ff0000'],
  'Bosnia-Herzegovina': ['#002395', '#fecb00'],
  'United States': ['#3c3b6e', '#b22234', '#ffffff'],
  'Paraguay': ['#d52b1e', '#ffffff', '#0038a8'],
  'Qatar': ['#8a1538', '#ffffff'],
  'Switzerland': ['#d52b1e', '#ffffff'],
  'Brazil': ['#009c3b', '#ffdf00', '#002776'],
  'Morocco': ['#c1272d', '#006233'],
  'Haiti': ['#00209f', '#d21034'],
  'Scotland': ['#005eb8', '#ffffff'],
  'Australia': ['#00008b', '#ffffff', '#ff0000'],
  'Turkey': ['#e30a17', '#ffffff'],
  'Germany': ['#000000', '#dd0000', '#ffce00'],
  'Curaçao': ['#002b7f', '#f9e814'],
  'Spain': ['#aa151b', '#f1bf00', '#aa151b'],
  'Finland': ['#ffffff', '#003580'],
  'Argentina': ['#74acdf', '#ffffff', '#f6b40e'],
  'Nigeria': ['#008751', '#ffffff', '#008751'],
  'Japan': ['#ffffff', '#bc002d'],
  'Belgium': ['#000000', '#fdda24', '#ef3340'],
  'Portugal': ['#006600', '#ff0000', '#ffcc00'],
  'Iran': ['#239f40', '#ffffff', '#da0000'],
  'France': ['#0055a4', '#ffffff', '#ef4135'],
  'Saudi Arabia': ['#006c35', '#ffffff'],
  'England': ['#ffffff', '#ce1124'],
  'Senegal': ['#00853f', '#fdef42', '#e31b23'],
  'Netherlands': ['#ae1c28', '#ffffff', '#21468b'],
  'Ecuador': ['#ffdd00', '#034ea2', '#ed1c24'],
  'Uruguay': ['#ffffff', '#0038a8', '#fcd116'],
  'Colombia': ['#fcd116', '#003893', '#ce1126'],
  'Chile': ['#0039a6', '#ffffff', '#d52b1e'],
  'Italy': ['#008c45', '#ffffff', '#cd212a'],
  'Croatia': ['#ff0000', '#ffffff', '#171796'],
  'Poland': ['#ffffff', '#dc143c'],
  'Denmark': ['#c8102e', '#ffffff'],
  'Serbia': ['#c6363c', '#0c4076', '#ffffff'],
  'Hungary': ['#cd2a3e', '#ffffff', '#436f4d'],
  'Egypt': ['#ce1126', '#ffffff', '#000000'],
  'Ghana': ['#006b3f', '#fcd116', '#ce1126'],
  'Cameroon': ['#007a5e', '#ce1126', '#fcd116'],
  'Tunisia': ['#e70013', '#ffffff'],
  'Algeria': ['#006233', '#ffffff', '#d21034'],
  'Mali': ['#14b53a', '#fcd116', '#ce1126'],
  'Venezuela': ['#ffcc00', '#00247d', '#cf142b'],
  'Peru': ['#d91023', '#ffffff', '#d91023'],
  'Bolivia': ['#d52b1e', '#f9e300', '#007934'],
  'Honduras': ['#0073cf', '#ffffff', '#0073cf'],
  'Costa Rica': ['#002b7f', '#ffffff', '#ce1126'],
  'Panama': ['#005293', '#d21034', '#ffffff'],
  'Jamaica': ['#009b3a', '#fed100', '#000000'],
  'Trinidad and Tobago': ['#da1a35', '#ffffff', '#000000'],
  'New Zealand': ['#00247d', '#ffffff', '#cc142b'],
  'Indonesia': ['#ff0000', '#ffffff'],
  'Iraq': ['#ce1126', '#ffffff', '#000000'],
  'Jordan': ['#007a3d', '#ffffff', '#ce1126'],
  'Uzbekistan': ['#0099b5', '#ffffff', '#1eb53a'],
  'Ukraine': ['#005bbb', '#ffd500'],
  'Austria': ['#ed2939', '#ffffff', '#ed2939'],
  'Slovakia': ['#ffffff', '#0b4ea2', '#ee1c25'],
  'Greece': ['#0d5eaf', '#ffffff'],
  'Romania': ['#002b7f', '#fcd116', '#ce1126'],
  'Wales': ['#00ab39', '#ffffff', '#c8102e'],
  'Norway': ['#ba0c2f', '#ffffff', '#00205b'],
  'Sweden': ['#006aa7', '#fecc00'],
  'Russia': ['#ffffff', '#0039a6', '#d52b1e'],
  'China': ['#de2910', '#ffde00'],
  'Thailand': ['#a51931', '#ffffff', '#2d2a4a'],
  'Vietnam': ['#da251d', '#ffff00'],
  'Kazakhstan': ['#00afca', '#fec50c'],
  'Azerbaijan': ['#00b9e4', '#ed2939', '#3f9c35'],
  'Ivory Coast': ['#f77f00', '#ffffff', '#009e60'],
  'Cape Verde': ['#003893', '#ffffff', '#cf2027'],
}

const FALLBACK = ['#3a4a63', '#121a2c']

export function getFlagColors(team: string | null | undefined): string[] {
  if (!team) return FALLBACK
  return FLAG_COLORS[team] || FALLBACK
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
// blend two hex colours, t = amount of `b` (0..1)
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

// the single dominant flag colour (skips near-white so panels never read as blank)
export function dominantColor(team: string | null | undefined): string {
  const cols = getFlagColors(team)
  return cols.find(c => luminance(c) < 0.82) || cols[0]
}
