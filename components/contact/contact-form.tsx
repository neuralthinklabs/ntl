'use client'

import { useActionState } from 'react'
import Script from 'next/script'
import { submitContact } from '@/actions/contact'

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20'

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5">
      {/* Honeypot — hidden from real users via CSS, bots often fill every field */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Name</span>
        <input name="name" type="text" required className={fieldClass} placeholder="Your name" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
        <input name="email" type="email" required className={fieldClass} placeholder="you@example.com" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Message</span>
        <textarea
          name="message"
          rows={5}
          required
          className={`${fieldClass} resize-none`}
          placeholder="How can we help?"
        />
      </label>

      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={siteKey} />
        </>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
