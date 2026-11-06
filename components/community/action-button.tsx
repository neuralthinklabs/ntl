'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionState } from '@/actions/auth'
import { cn } from '@/lib/utils'

const styles = {
  plain: 'border border-slate-300 bg-white text-ink hover:bg-slate-50',
  primary: 'bg-brand text-brand-foreground hover:bg-brand/90 font-semibold',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  link: 'text-brand-muted underline px-0 py-0',
} as const

/**
 * Runs a (bound) server action. `promptLabel` asks for a short reason first;
 * the reason is passed as the action's last argument. `confirm` asks yes/no.
 */
export function ActionButton({
  action,
  label,
  pendingLabel,
  confirm,
  promptLabel,
  variant = 'plain',
  className,
}: {
  action: (reason: string) => Promise<ActionState>
  label: string
  pendingLabel?: string
  confirm?: string
  promptLabel?: string
  variant?: keyof typeof styles
  className?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function run() {
    let reason = ''
    if (confirm && !window.confirm(confirm)) return
    if (promptLabel) {
      const answer = window.prompt(promptLabel)
      if (answer === null) return
      reason = answer
    }
    setMsg(null)
    start(async () => {
      const res = await action(reason)
      if (res?.error) setMsg({ ok: false, text: res.error })
      else {
        if (res?.success && res.success !== 'ok') setMsg({ ok: true, text: res.success })
        router.refresh()
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={run}
        className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60', styles[variant], className)}
      >
        {pending ? (pendingLabel ?? 'Working…') : label}
      </button>
      {msg && (
        <span role={msg.ok ? 'status' : 'alert'} className={cn('text-xs', msg.ok ? 'text-brand-muted' : 'text-red-700')}>
          {msg.text}
        </span>
      )}
    </span>
  )
}
