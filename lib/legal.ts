// Organisation details for the Privacy and Terms pages. Set these in your
// environment (NEXT_PUBLIC_* values are baked in at build time, so redeploy
// after changing them).
export const legal = {
  name: process.env.NEXT_PUBLIC_LEGAL_NAME || 'Neural Think Labs',
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || '',
  jurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION || '',
  email: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'hello@neuralthinklabs.org',
  // Set NEXT_PUBLIC_LEGAL_REVIEWED=true once a lawyer has approved both pages;
  // that removes the "draft" notice.
  reviewed: process.env.NEXT_PUBLIC_LEGAL_REVIEWED === 'true',
  updated: '29 October 2026',
}
