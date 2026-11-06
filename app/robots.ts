import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/profile', '/auth', '/api', '/problems/mine', '/contributions', '/design-system', '/team', '/oauth', '/account', '/workspace', '/community/groups', '/community/notifications', '/community/appeals', '/community/post', '/community/members'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
