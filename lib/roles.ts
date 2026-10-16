// Single source of truth for roles. Safe to import from client components.
export const ROLES = ['member', 'volunteer', 'core_team', 'admin'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  volunteer: 'Volunteer',
  core_team: 'Core team',
  admin: 'Admin',
}

/** Roles that get the /team workspace. */
export const TEAM_ROLES: readonly string[] = ['volunteer', 'core_team', 'admin']

/** Roles an admin may hand work to. */
export const ASSIGNABLE_ROLES: readonly string[] = ['volunteer', 'core_team']

export const isTeamRole = (r?: string | null) => !!r && TEAM_ROLES.includes(r)

/** Public label: only volunteers and core team are shown as such. */
export const publicRoleLabel = (r?: string | null) =>
  r === 'volunteer' || r === 'core_team' ? ROLE_LABELS[r] : null
