// The mock arrays that used to live here (portfolio, events, stories, goals,
// stats) were removed: every page now reads real rows from the database.
// Only the shared type is re-exported so existing imports keep working.
export type { PortfolioType } from './portfolio'
