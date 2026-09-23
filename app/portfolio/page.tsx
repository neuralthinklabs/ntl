import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { PortfolioList } from '@/components/portfolio/portfolio-list'

export const metadata: Metadata = {
  title: 'Portfolio — Neural Think Labs',
  description:
    'Products, services, ventures and more — built by our teams and partners, and designed for real-world impact.',
}

export default function PortfolioPage() {
  return (
    <SiteShell>
      <PageHero
        title="Our Portfolio"
        description="Products, services, ventures and more — built by our teams and partners, and designed for real-world impact."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <PortfolioList />
      </div>
    </SiteShell>
  )
}
