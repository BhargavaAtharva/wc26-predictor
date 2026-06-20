// Faint football-stadium backdrop: pitch in perspective, floodlights, far stand.
// Rendered very light behind page content. Shared across every page.
export default function StadiumScene({ opacity = 0.22 }: { opacity?: number }) {
  return (
    <svg
      className="stadium-scene"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      style={{ opacity }}
    >
      <defs>
        <radialGradient id="flood" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#cfeeff" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#2ee6e6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2ee6e6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pitchFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2ee6e6" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.12" />
        </linearGradient>
        <pattern id="crowd" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill="#7fb6d4" opacity="0.5" />
          <circle cx="10" cy="9" r="1.1" fill="#9bfdfd" opacity="0.4" />
        </pattern>
      </defs>

      {/* floodlight glow pools at the top */}
      <ellipse cx="600" cy="40" rx="640" ry="240" fill="url(#flood)" />

      {/* far stand band with crowd speckle */}
      <path d="M280 250 L920 250 L1010 150 L190 150 Z" fill="url(#crowd)" />
      <path d="M280 250 L920 250 L1010 150 L190 150 Z" fill="none" stroke="#2ee6e6" strokeOpacity="0.25" strokeWidth="1.5" />

      {/* floodlight towers */}
      {[210, 470, 730, 990].map((x, i) => (
        <g key={i} stroke="#9bfdfd" strokeOpacity="0.45" strokeWidth="1.5" fill="none">
          <line x1={x} y1="150" x2={x} y2="60" />
          <rect x={x - 22} y="40" width="44" height="20" rx="3" fill="#9bfdfd" fillOpacity="0.18" />
          <ellipse cx={x} cy="55" rx="60" ry="26" fill="url(#flood)" stroke="none" />
        </g>
      ))}

      {/* pitch surface (perspective trapezoid) */}
      <path d="M120 760 L1080 760 L770 430 L430 430 Z" fill="url(#pitchFade)" />

      {/* pitch markings */}
      <g stroke="#d4f6ff" strokeOpacity="0.4" strokeWidth="2" fill="none" strokeLinejoin="round">
        {/* outline */}
        <path d="M120 760 L1080 760 L770 430 L430 430 Z" />
        {/* halfway line */}
        <line x1="298" y1="570" x2="902" y2="570" />
        {/* centre circle */}
        <ellipse cx="600" cy="570" rx="78" ry="24" />
        <circle cx="600" cy="570" r="2.5" fill="#d4f6ff" stroke="none" />
        {/* far penalty box + goal */}
        <path d="M500 430 L700 430 L688 478 L512 478 Z" />
        <path d="M556 430 L644 430 L640 452 L560 452 Z" />
        {/* near penalty box + goal */}
        <path d="M300 760 L900 760 L832 648 L368 648 Z" />
        <path d="M430 760 L770 760 L740 700 L460 700 Z" />
      </g>
    </svg>
  )
}
