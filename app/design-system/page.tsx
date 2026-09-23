import type { Metadata } from 'next'
import {
  Bell,
  Bookmark,
  Check,
  Heart,
  Home,
  Link2,
  Mail,
  Search,
  Settings,
  Star,
  User,
} from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/ui'

export const metadata: Metadata = {
  title: 'Design System — Neural Think Labs',
  description: 'Color, typography and components that power our platform.',
}

const colors = [
  { name: 'Teal', hex: '#10B981', className: 'bg-brand' },
  { name: 'Near Black', hex: '#0B1215', className: 'bg-ink' },
  { name: 'Neutral 1', hex: '#6B7280', className: 'bg-slate-500' },
  { name: 'Neutral 2', hex: '#CBD5E1', className: 'bg-slate-300' },
  { name: 'Neutral 3', hex: '#F1F5F9', className: 'bg-slate-100' },
]

const icons = [
  Home,
  User,
  Search,
  Mail,
  Bell,
  Settings,
  Heart,
  Star,
  Bookmark,
  Link2,
  Check,
]

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function DesignSystemPage() {
  return (
    <SiteShell>
      <PageHero
        title="Design System & Components"
        description="The color, typography and building blocks that power the Neural Think Labs platform."
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20">
        <Panel title="Color Palette">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {colors.map((c) => (
              <div key={c.name}>
                <div
                  className={`h-20 rounded-xl ring-1 ring-inset ring-black/5 ${c.className}`}
                />
                <p className="mt-2 text-sm font-medium text-ink">{c.name}</p>
                <p className="font-mono text-xs text-slate-400">{c.hex}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Typography">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-400">Inter (UI / Body)</p>
              <p className="mt-2 text-6xl font-semibold tracking-tight text-ink">
                Aa
              </p>
              <p className="mt-3 text-sm text-slate-500">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ
                <br />
                abcdefghijklmnopqrstuvwxyz
                <br />
                0123456789
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">
                JetBrains Mono (Code)
              </p>
              <p className="mt-2 font-mono text-6xl font-semibold tracking-tight text-ink">
                Aa
              </p>
              <p className="mt-3 font-mono text-sm text-slate-500">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ
                <br />
                abcdefghijklmnopqrstuvwxyz
                <br />
                0123456789
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Primary</p>
              <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
                Get Started
              </button>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">
                Secondary
              </p>
              <button className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-slate-50">
                Learn More
              </button>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Ghost</p>
              <button className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink">
                Contact Us
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Form Elements">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Input field
              </span>
              <input
                type="email"
                placeholder="Your email address"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Select
              </span>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20">
                <option>Choose an option</option>
                <option>Option one</option>
                <option>Option two</option>
              </select>
            </label>
          </div>
        </Panel>

        <Panel title="Cards">
          <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-ink">Card title</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Short description goes here. This is a simple example of a card
              component.
            </p>
            <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand">
              Learn more
            </button>
          </div>
        </Panel>

        <Panel title="Icons">
          <div className="flex flex-wrap gap-3">
            {icons.map((Icon, i) => (
              <span
                key={i}
                className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
              >
                <Icon className="size-5" />
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </SiteShell>
  )
}
