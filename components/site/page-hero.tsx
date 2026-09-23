import Image from 'next/image'
import { cn } from '@/lib/utils'

export function PageHero({
  title,
  description,
  image,
  className,
}: {
  title: string
  description?: string
  image?: string
  className?: string
}) {
  return (
    <section className={cn('relative overflow-hidden bg-ink text-white', className)}>
      {image && (
        <div className="absolute inset-0">
          <Image src={image} alt="" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/50" />
        </div>
      )}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/70">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
