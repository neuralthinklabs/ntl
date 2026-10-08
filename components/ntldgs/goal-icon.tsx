import { goalSymbols } from '@/lib/ntldgs-symbols'

/**
 * Renders ALL 12 symbols + their gradients once per page. Individual
 * <GoalIcon/>s reference them with <use>. This is the same approach as the
 * original prototype: gradients live in a zero-size (NOT display:none —
 * browsers skip gradients inside display:none) SVG so every instance can
 * share them without duplicate ids.
 */
export function GoalSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {goalSymbols.map((s, i) => (
          <linearGradient key={i} id={`ntldg-g${i}`} x1="0" y1="0" x2="0" y2="1">
            {s.stops.map(([offset, color]) => (
              <stop key={offset} offset={`${offset}%`} stopColor={color} />
            ))}
          </linearGradient>
        ))}
      </defs>
      {goalSymbols.map((s, i) => (
        <symbol key={i} id={`ntldg-s${i}`} viewBox={s.viewBox}>
          <g fill={`url(#ntldg-g${i})`} fillRule="evenodd">
            {s.paths.map((d, k) => (
              <path key={k} d={d} />
            ))}
          </g>
        </symbol>
      ))}
    </svg>
  )
}

/** Decorative by default — the goal's name is always rendered next to it. */
export function GoalIcon({
  index,
  className,
}: {
  index: number
  className?: string
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <use href={`#ntldg-s${index}`} width="100" height="100" />
    </svg>
  )
}
