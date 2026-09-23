import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  tone = 'light',
}: {
  className?: string
  tone?: 'light' | 'dark'
}) {
  return (
    <Link
      href="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Neural Think Labs home"
    >
      <span className="relative inline-flex size-7 items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="size-7"
          aria-hidden="true"
        >
          <circle cx="16" cy="6" r="3" className="fill-brand" />
          <circle cx="6" cy="22" r="3" className="fill-brand" />
          <circle cx="26" cy="22" r="3" className="fill-brand" />
          <circle
            cx="16"
            cy="16"
            r="2.2"
            className={tone === 'light' ? 'fill-white' : 'fill-ink'}
          />
          <path
            d="M16 6 16 16 6 22M16 16 26 22"
            className="stroke-brand"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          'text-[13px] font-semibold tracking-[0.18em]',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        NEURAL THINK LABS
      </span>
    </Link>
  )
}
