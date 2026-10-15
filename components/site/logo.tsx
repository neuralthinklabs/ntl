import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  tone = 'light',
}: {
  className?: string
  tone?: 'light' | 'dark'
}) {
  const text = tone === 'light' ? 'text-white' : 'text-ink'
  return (
    <Link
      href="/"
      className={cn('group inline-flex items-center gap-3', className)}
      aria-label="Neural Think Labs home"
    >
      <span className={cn('text-2xl font-light leading-none tracking-[0.12em]', text)}>NTL</span>
      <span aria-hidden="true" className={cn('h-5 w-px', tone === 'light' ? 'bg-white/25' : 'bg-ink/20')} />
      <span className={cn('hidden text-[13px] font-medium sm:inline', text)}>Neural Think Labs</span>
    </Link>
  )
}
