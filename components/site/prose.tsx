import { Fragment } from 'react'

// Tiny, dependency-free renderer for admin-written post bodies.
// Supports: paragraphs, "## " headings, "- " bullets, **bold**, [text](https://url).
// Everything is rendered as React text nodes (escaped); links are limited to
// http(s) and site-relative URLs.
const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\))/g

function inline(text: string) {
  return text.split(INLINE).map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part)
    if (bold) return <strong key={i}>{bold[1]}</strong>
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const external = /^https?:/.test(link[2])
      return (
        <a key={i} href={link[2]} className="font-medium text-brand-muted underline" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {link[1]}
        </a>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function Prose({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="space-y-5 text-base leading-relaxed text-slate-700">
      {blocks.map((b, i) => {
        if (b.startsWith('## ')) return <h2 key={i} className="pt-2 text-xl font-semibold tracking-tight text-ink">{inline(b.slice(3))}</h2>
        const lines = b.split('\n')
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-brand">
              {lines.map((l, k) => <li key={k}>{inline(l.slice(2))}</li>)}
            </ul>
          )
        }
        return <p key={i} className="whitespace-pre-line">{inline(b)}</p>
      })}
    </div>
  )
}
