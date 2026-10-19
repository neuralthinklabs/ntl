// Safe to import from client components (no DB imports).
export type AtlasLevel = 'zone' | 'subzone' | 'cluster'
export const ATLAS_LEVELS: readonly AtlasLevel[] = ['zone', 'subzone', 'cluster']
export const LEVEL_LABEL: Record<AtlasLevel, string> = { zone: 'Zone', subzone: 'Subzone', cluster: 'Cluster' }
export const LEVEL_PLURAL: Record<AtlasLevel, string> = { zone: 'Zones', subzone: 'Subzones', cluster: 'Clusters' }
export const PARENT_LEVEL: Record<AtlasLevel, AtlasLevel | null> = { zone: null, subzone: 'zone', cluster: 'subzone' }
export const CHILD_LEVEL: Record<AtlasLevel, AtlasLevel | null> = { zone: 'subzone', subzone: 'cluster', cluster: null }
