// Decorative hero illustration (from the prototype). Purely visual, so it's
// aria-hidden; the slow rotation is disabled for reduced-motion users.
export function Orbit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 320" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ntldg-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb21e" />
          <stop offset=".3" stopColor="#2fa55a" />
          <stop offset=".6" stopColor="#1d8de0" />
          <stop offset="1" stopColor="#d1307f" />
        </linearGradient>
      </defs>
      <g
        className="origin-[200px_160px] motion-safe:animate-[spin_60s_linear_infinite]"
        fill="none"
        strokeWidth="1.5"
        opacity=".7"
      >
        <ellipse cx="200" cy="160" rx="190" ry="70" stroke="#6c7bff" transform="rotate(-20 200 160)" />
        <ellipse cx="200" cy="160" rx="170" ry="100" stroke="#2ec4a6" transform="rotate(30 200 160)" />
        <ellipse cx="200" cy="160" rx="130" ry="130" stroke="#ffb21e" strokeDasharray="3 8" />
        <circle cx="70" cy="160" r="5" fill="#e0457b" />
        <circle cx="330" cy="160" r="5" fill="#2ec4a6" />
        <circle cx="200" cy="30" r="5" fill="#6c7bff" />
      </g>
      <g fill="none" stroke="url(#ntldg-sun)" strokeLinecap="round">
        <circle cx="200" cy="160" r="60" strokeWidth="9" strokeDasharray="80 8" />
        <circle cx="200" cy="160" r="43" strokeWidth="7" strokeDasharray="52 6" />
      </g>
      <circle cx="200" cy="160" r="25" fill="#f6a313" />
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
