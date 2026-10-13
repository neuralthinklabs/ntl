export function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`
}
