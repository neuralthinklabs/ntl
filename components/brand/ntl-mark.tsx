// App icon only. The full logo is the existing /images/ntl-logo.png via components/site/logo.tsx.
export function NtlAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="NTL">
      <rect width="64" height="64" rx="14" fill="#0A1428" />
      <path d="M18 16h8l12 18V16h8v32h-8L26 30v18h-8z" fill="#fff" />
      <rect x="27" y="39" width="8" height="8" fill="#38B6FF" />
    </svg>
  )
}
