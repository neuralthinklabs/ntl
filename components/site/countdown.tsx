'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Ticks every second. Renders nothing until mounted (so server and browser
 * agree), shows `endText` once the time has passed, and can refresh the page
 * at zero (used so a blocked page opens by itself).
 */
export function Countdown({
  to,
  endText = '',
  refreshOnDone = false,
  className,
}: {
  to: string
  endText?: string
  refreshOnDone?: boolean
  className?: string
}) {
  const router = useRouter()
  const target = new Date(to).getTime()
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    let done = false
    const tick = () => {
      const l = target - Date.now()
      setLeft(l)
      if (l <= 0 && !done) {
        done = true
        if (refreshOnDone) router.refresh()
      }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [target, refreshOnDone, router])

  if (left === null) return <span className={className}>&nbsp;</span>
  if (left <= 0) return <span className={className}>{endText}</span>
  const s = Math.floor(left / 1000)
  const d = Math.floor(s / 86400)
  return (
    <span className={`${className ?? ''} tabular-nums`}>
      {d > 0 && `${d}d `}
      {pad(Math.floor((s % 86400) / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </span>
  )
}
