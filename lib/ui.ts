// Shared class strings so forms and buttons stay visually identical.
const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export const fieldClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-500 focus:border-brand-muted focus:ring-2 focus:ring-brand/30 disabled:bg-slate-50 disabled:text-slate-500'

const btn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-all disabled:opacity-60 ' +
  focus

/** The one main action in a section. Electric Blue, per the brand sheet. */
export const btnPrimary = `${btn} bg-brand text-brand-foreground shadow-lg shadow-brand/25 hover:brightness-110`

/** Navy-to-blue brand gradient, for highlights. */
export const btnGradient = `${btn} bg-gradient-to-r from-ink-2 to-brand text-white hover:brightness-110`

export const btnSecondary = `${btn} border border-slate-300 bg-white text-ink hover:bg-slate-50`
export const btnDark = `${btn} bg-ink text-white hover:bg-ink-3`
export const btnOnDark = `${btn} border border-brand/60 text-brand hover:bg-brand/10`
export const btnDanger = `${btn} border border-red-200 bg-white text-red-600 hover:bg-red-50`

export const cardClass = 'rounded-2xl border border-line bg-white p-6 shadow-sm'
