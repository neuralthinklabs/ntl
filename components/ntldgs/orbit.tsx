// Decorative hero illustration (from the prototype). Purely visual, so it's
// aria-hidden; the slow rotation is disabled for reduced-motion users.
export function Orbit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 320" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ntldg-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38b6ff" />
          <stop offset=".3" stopColor="#0a6fd8" />
          <stop offset=".6" stopColor="#38b6ff" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <g
        className="origin-[200px_160px] motion-safe:animate-[spin_60s_linear_infinite]"
        fill="none"
        strokeWidth="1.5"
        opacity=".7"
      >
        <ellipse cx="200" cy="160" rx="190" ry="70" stroke="#38b6ff" transform="rotate(-20 200 160)" />
        <ellipse cx="200" cy="160" rx="170" ry="100" stroke="#e4e9f2" transform="rotate(30 200 160)" />
        <ellipse cx="200" cy="160" rx="130" ry="130" stroke="#38b6ff" strokeDasharray="3 8" />
        <circle cx="70" cy="160" r="5" fill="#38b6ff" />
        <circle cx="330" cy="160" r="5" fill="#e4e9f2" />
        <circle cx="200" cy="30" r="5" fill="#38b6ff" />
      </g>
      <g fill="none" stroke="url(#ntldg-sun)" strokeLinecap="round">
        <circle cx="200" cy="160" r="60" strokeWidth="9" strokeDasharray="80 8" />
        <circle cx="200" cy="160" r="43" strokeWidth="7" strokeDasharray="52 6" />
      </g>
      <circle cx="200" cy="160" r="25" fill="#38b6ff" />
      <text
        x="200"
        y="290"
        textAnchor="middle"
        fontSize="12"
        letterSpacing="3"
        fill="#ffffff"
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        THE NORTH STAR
      </text>
    </svg>
  )
}
