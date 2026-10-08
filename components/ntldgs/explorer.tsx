'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Link2 } from 'lucide-react'
import { SectionLabel } from '@/components/site/ui'
import { GoalIcon } from './goal-icon'
import { goals, missions } from '@/lib/ntldgs'
import { cn } from '@/lib/utils'

// Visible keyboard focus for every control (the site's base styles only tint
// the outline colour, they don't draw one).
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

type CopyState = 'idle' | 'copied' | 'failed'

export function NtldgsExplorer({ initialIndex = 0 }: { initialIndex?: number }) {
  const [cur, setCur] = useState(initialIndex)
  const [mission, setMission] = useState<number | null>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const panelRef = useRef<HTMLElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const visible = goals
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => mission === null || g.mission === mission)

  const goal = goals[cur]

  // `reveal`: only for taps in the goal grid. On phones the 12 stacked cards
  // push the detail panel below the fold, so a tap would otherwise appear to
  // do nothing.
  function select(i: number, reveal = false) {
    const next = (i + goals.length) % goals.length
    setCur(next)

    const url = new URL(window.location.href)
    url.searchParams.set('goal', goals[next].slug)
    window.history.replaceState(null, '', url)
    document.title = `${goals[next].verb}: ${goals[next].title} — NTLDGs — Neural Think Labs`

    if (reveal) {
      const r = panelRef.current?.getBoundingClientRect()
      if (r && (r.top > window.innerHeight - 200 || r.bottom < 0)) {
        panelRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
      }
    }
  }

  function step(dir: 1 | -1) {
    const pos = visible.findIndex(({ i }) => i === cur)
    const next = visible[(pos + dir + visible.length) % visible.length]
    select(next.i)
  }

  function chooseMission(m: number | null) {
    setMission(m)
    if (m !== null && goals[cur].mission !== m) {
      select(goals.findIndex((g) => g.mission === m))
    }
  }

  async function copyLink() {
    const url = new URL(window.location.href)
    url.hash = ''
    url.searchParams.set('goal', goal.slug)
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopyState('copied')
    } catch {
      // Clipboard API is unavailable on insecure origins / some webviews.
      setCopyState('failed')
    }
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2500)
  }

  return (
    <>
      <section id="goals" className="scroll-mt-20 bg-slate-100/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionLabel className="text-brand-muted">The goals</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Twelve pathways. One system.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Each goal focuses on one area of human development. Select a goal
            to see what it covers.
          </p>

          <div role="group" aria-label="Filter by mission" className="mt-6 flex flex-wrap gap-2">
            {[null, 0, 1, 2].map((m) => (
              <button
                key={String(m)}
                type="button"
                aria-pressed={mission === m}
                onClick={() => chooseMission(m)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  focusRing,
                  mission === m
                    ? 'bg-ink text-white'
                    : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
                )}
              >
                {m === null ? 'All goals' : `Mission ${missions[m].numeral}`}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500" aria-live="polite">
            Showing {visible.length} of {goals.length} goals
          </p>

          <div className="mt-4 grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {visible.map(({ g, i }) => (
              <button
                key={g.slug}
                type="button"
                aria-pressed={i === cur}
                onClick={() => select(i, true)}
                className={cn(
                  'relative flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-sm transition',
                  'motion-safe:hover:-translate-y-0.5 hover:shadow-md',
                  focusRing,
                  // Selection is shown with a dark border (>3:1), never by
                  // the accent colour alone — several accents are too light.
                  i === cur ? 'border-ink shadow-md' : 'border-slate-200',
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-3 size-2.5 rounded-full"
                  style={{ backgroundColor: g.accent }}
                />
                <GoalIcon index={i} className="size-11 shrink-0" />
                <span className="min-w-0 pr-3">
                  <span className="block font-mono text-[11px] font-medium uppercase tracking-widest text-slate-500">
                    Goal {String(g.number).padStart(2, '0')}
                  </span>
                  <span className="block text-sm font-semibold text-ink">{g.verb}</span>
                  <span className="block text-xs leading-snug text-slate-500">{g.title}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Announce only the change, not the whole panel. */}
          <p className="sr-only" role="status">
            Goal {goal.number} of {goals.length}: {goal.verb}, {goal.title}
          </p>

          <section
            ref={panelRef}
            aria-labelledby="ntldg-detail-heading"
            className="mt-8 grid scroll-mt-24 gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[1.1fr_1.2fr_1.2fr]"
          >
            <div>
              <GoalIcon index={cur} className="size-28" />
              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-slate-500">
                Goal {goal.number} of {goals.length}
              </p>
              <h3 id="ntldg-detail-heading" className="mt-1">
                <span className="block text-3xl font-semibold text-ink">{goal.verb}</span>
                <span className="mt-1 block text-lg font-semibold text-ink">{goal.title}</span>
              </h3>
              <p className="mt-1 text-sm text-slate-600">{goal.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className={cn('inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50', focusRing)}
                >
                  <ArrowLeft className="size-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className={cn('inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50', focusRing)}
                >
                  Next goal <ArrowRight className="size-4" />
                </button>
              </div>
            </div>

            <div>
              <SectionLabel className="text-slate-500">Key areas</SectionLabel>
              <ul className="mt-3 list-disc pl-5 text-sm leading-relaxed text-slate-600 marker:text-brand">
                {goal.areas.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>

            <div>
              <SectionLabel className="text-slate-500">Core question</SectionLabel>
              <p className="mt-3 text-xl font-semibold leading-snug text-ink">
                “{goal.question}”
              </p>
              <SectionLabel className="mt-6 text-slate-500">Symbol concept</SectionLabel>
              <p className="mt-2 text-sm font-semibold text-ink">{goal.symbolConcept}</p>
              <p className="mt-1 text-sm text-slate-600">{goal.symbolDescription}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/problems"
                  className={cn('inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90', focusRing)}
                >
                  Submit a problem in this area <ArrowRight className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={copyLink}
                  className={cn('inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50', focusRing)}
                >
                  {copyState === 'copied' ? <Check className="size-4" /> : <Link2 className="size-4" />}
                  {copyState === 'copied' ? 'Link copied' : copyState === 'failed' ? "Couldn't copy" : 'Copy link'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="missions" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionLabel className="text-brand-muted">Missions</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          From goals to bigger movements.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          The 12 goals group into three missions. Select one to filter the
          goals above.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {missions.map((m, k) => (
            <button
              key={m.numeral}
              type="button"
              aria-pressed={mission === k}
              onClick={() => {
                if (mission === k) {
                  chooseMission(null)
                  return
                }
                chooseMission(k)
                document
                  .getElementById('goals')
                  ?.scrollIntoView({ behavior: scrollBehavior() })
              }}
              className={cn(
                'rounded-2xl border bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md',
                focusRing,
                mission === k ? 'border-ink shadow-md' : 'border-slate-200',
              )}
            >
              <span className="block text-sm font-semibold text-ink">
                {m.numeral}. {m.title}
              </span>
              <span className="mt-1 block text-sm text-slate-500">{m.verbs}</span>
              <span className="mt-3 block text-xs text-slate-500">{m.summary}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
