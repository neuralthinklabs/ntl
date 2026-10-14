// Shared class strings so forms and buttons stay visually identical.
const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-muted focus:ring-2 focus:ring-brand/30 disabled:bg-slate-50 disabled:text-slate-500'

const btn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors disabled:opacity-60 ' +
  focus

/** The one main action in a section. Use at most one per page area. */
export const btnPrimary = `${btn} bg-brand text-brand-foreground hover:bg-[#0fa377]`

/** Quiet alternative on light backgrounds. */
export const btnSecondary = `${btn} border border-slate-300 bg-white text-ink hover:bg-slate-50`

/** Solid dark button on light backgrounds. */
export const btnDark = `${btn} bg-ink text-white hover:bg-ink-3`

/** Outline button on dark backgrounds. */
export const btnOnDark = `${btn} border border-white/25 text-white hover:bg-white/10`

export const btnDanger = `${btn} border border-red-200 bg-white text-red-600 hover:bg-red-50`

export const cardClass = 'rounded-2xl border border-line bg-white p-5'
