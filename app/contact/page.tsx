import type { Metadata } from 'next'
import { Mail, MessageSquare } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/ui'
import { brandSocials } from '@/components/site/brand-icons'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Contact — Neural Think Labs',
  description:
    'Have a question, partnership idea, or just want to say hello? We would love to hear from you.',
}

const enquiries = [
  {
    icon: Mail,
    label: 'General Enquiries',
    value: 'hello@neuralthinklabs.org',
  },
  {
    icon: MessageSquare,
    label: 'Partnerships',
    value: 'partners@neuralthinklabs.org',
  },
  {
    icon: Mail,
    label: 'Support',
    value: 'support@neuralthinklabs.org',
  },
]

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHero
        title="Get in Touch"
        description="Have a question, partnership idea, or just want to say hello? We would love to hear from you."
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionLabel>General Enquiries</SectionLabel>
          <div className="mt-6 flex flex-col gap-4">
            {enquiries.map((e) => (
              <div key={e.label} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand-muted">
                  <e.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{e.label}</p>
                  <a
                    href={`mailto:${e.value}`}
                    className="text-sm text-slate-500 hover:text-brand"
                  >
                    {e.value}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <SectionLabel>Other ways to reach us</SectionLabel>
            <div className="mt-4 flex gap-2">
              {brandSocials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand hover:text-brand"
                  aria-label={s.label}
                >
                  <s.Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-ink">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </SiteShell>
  )
}
