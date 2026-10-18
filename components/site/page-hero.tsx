import Image from 'next/image'
import { cn } from '@/lib/utils'

export function PageHero({
  title,
  description,
  image,
  className,
  children,
}: {
  title: string
  description?: string
  image?: string
  className?: string
  /** Optional single action, e.g. one button. */
  children?: React.ReactNode
}) {
  return (
    <section className={cn('relative overflow-hidden bg-ink text-white', className)}>
      {image && (
        <div className="absolute inset-0">
          <Image src={image} alt="" fill sizes="100vw" className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/60" />
        </div>
      )}
      <div aria-hidden="true" className="bg-hero-glow absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {description && (
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
