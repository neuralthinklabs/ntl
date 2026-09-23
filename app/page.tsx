import { SiteShell } from '@/components/site/site-shell'
import { HomeHero } from '@/components/home/hero'
import {
  CurrentFocus,
  FeaturedStory,
  HomeCta,
  HomeStats,
} from '@/components/home/sections'

export default function HomePage() {
  return (
    <SiteShell>
      <HomeHero />
      <HomeStats />
      <CurrentFocus />
      <FeaturedStory />
      <HomeCta />
    </SiteShell>
  )
}
