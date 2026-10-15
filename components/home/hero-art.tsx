// Decorative gradient ring artwork. Purely visual: aria-hidden, and the slow
// rotation is disabled for reduced-motion users.
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 420" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-ring-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38b6ff" />
          <stop offset=".55" stopColor="#5b7cff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="hero-ring-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#38b6ff" />
        </linearGradient>
        <filter id="hero-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      <circle cx="250" cy="210" r="120" fill="#5b7cff" opacity=".35" filter="url(#hero-glow)" />

      <g
        className="origin-[250px_210px] motion-safe:animate-[spin_90s_linear_infinite]"
        fill="none"
        stroke="#38b6ff"
        strokeOpacity=".35"
        strokeWidth="1"
      >
        <ellipse cx="250" cy="210" rx="230" ry="80" transform="rotate(-24 250 210)" />
      </g>

      <g fill="none" strokeLinecap="round">
        <ellipse cx="250" cy="210" rx="135" ry="62" strokeWidth="26" stroke="url(#hero-ring-a)" transform="rotate(-38 250 210)" opacity=".95" />
        <ellipse cx="250" cy="210" rx="135" ry="62" strokeWidth="26" stroke="url(#hero-ring-b)" transform="rotate(38 250 210)" opacity=".8" />
        <ellipse cx="250" cy="210" rx="92" ry="92" strokeWidth="18" stroke="url(#hero-ring-a)" opacity=".7" />
        <ellipse cx="250" cy="210" rx="135" ry="62" strokeWidth="2" stroke="#fff" strokeOpacity=".35" transform="rotate(-38 250 210)" />
      </g>
    </svg>
  )
}
