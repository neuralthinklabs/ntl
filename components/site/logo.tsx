import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// The logo artwork is white with a blue-violet accent, so it is meant for the
// dark (bg-ink) navbar and footer. Size it with `className` (height-based).
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn('inline-flex items-center', className)}
      aria-label="Neural Think Labs home"
    >
      <Image
        src="/images/ntl-logo.png"
        alt="Neural Think Labs"
        width={1200}
        height={123}
        priority
        className="h-10 w-auto"
      />
    </Link>
  )
}
