// Safe to import from client components (no DB imports).
export const COLLECTION_KINDS = ['series', 'magazine'] as const
export type CollectionKind = (typeof COLLECTION_KINDS)[number]
export const COLLECTION_LABEL: Record<CollectionKind, string> = { series: 'Series', magazine: 'Magazine' }
export const COLLECTION_PLURAL: Record<CollectionKind, string> = { series: 'Series', magazine: 'Magazines' }
export const COLLECTION_PATH: Record<CollectionKind, string> = { series: '/series', magazine: '/magazines' }
