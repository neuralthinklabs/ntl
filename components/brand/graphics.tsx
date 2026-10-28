// Brand graphic elements (sheet section 06). All decorative: aria-hidden.
import { cn } from '@/lib/utils'

type P = { className?: string }
const BLUE = '#38B6FF'

/** Dot grid: structure and layout. Use as a section background texture. */
export function DotGrid({ className }: P) {
  return (
    <svg aria-hidden focusable="false" className={cn('pointer-events-none', className)} width="100%" height="100%">
      <defs>
        <pattern id="ntl-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ntl-dots)" />
    </svg>
  )
}

/** Overlapping circles: depth and focus. */
export function Overlays({ className }: P) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 160 90" className={className}>
      <circle cx="58" cy="45" r="38" fill="#64748B" opacity=".55" />
      <circle cx="102" cy="45" r="38" fill={BLUE} opacity=".35" />
      <path d="M80 12a38 38 0 0 1 0 66 38 38 0 0 1 0-66z" fill={BLUE} opacity=".9" />
    </svg>
  )
}

/** Connected nodes: collaboration. */
export function NetworkNodes({ className }: P) {
  const pts: [number, number, number][] = [[20, 70, 4], [48, 40, 5], [86, 58, 4], [110, 22, 6], [136, 52, 5], [70, 14, 3]]
  const lines: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 4], [1, 5], [5, 3]]
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 160 90" className={className} fill="none">
      {lines.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke={BLUE} strokeOpacity=".5" />
      ))}
      {pts.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? BLUE : '#0A1428'} stroke={BLUE} />
      ))}
    </svg>
  )
}

/** Flow lines: movement and progress. Good divider between sections. */
export function FlowLines({ className }: P) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 400 80" preserveAspectRatio="none" className={className} fill="none" stroke={BLUE}>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M0 ${50 - i * 3} C100 ${10 + i * 6}, 200 ${90 - i * 6}, 400 ${30 + i * 3}`} strokeOpacity={0.15 + i * 0.12} />
      ))}
    </svg>
  )
}

/** Two offset rounded squares plus a solid blue square: modularity. */
export function GeoShapes({ className }: P) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 120 120" className={className} fill="none" stroke="#0A1428" strokeWidth="2">
      <rect x="34" y="8" width="64" height="64" rx="12" />
      <rect x="10" y="32" width="64" height="64" rx="12" />
      <rect x="70" y="72" width="30" height="30" rx="4" fill={BLUE} stroke="none" />
    </svg>
  )
}

/** The planet-edge glow from the brand hero. Put inside a relative, overflow-hidden navy section. */
export function EarthGlow({ className }: P) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute', className)}
      style={{
        background:
          'radial-gradient(closest-side, rgba(56,182,255,0) 82%, rgba(56,182,255,.55) 92%, rgba(56,182,255,0) 100%), radial-gradient(closest-side, #0A1428 0 90%, transparent 91%)',
      }}
    />
  )
}
