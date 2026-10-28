import Image from 'next/image'
import { cn } from '@/lib/utils'
import { DotGrid, EarthGlow } from '@/components/brand/graphics'

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
  children?: React.ReactNode
}) {
  return (
    <section className={cn('relative overflow-hidden bg-ink text-white', className)}>
      {image && (
        <div className="absolute inset-0">
          <Image src={image} alt="" fill sizes="100vw" className="object-cover opacity-40 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/60" />
        </div>
      )}
      <DotGrid className="absolute inset-0 text-white/10 [mask-image:linear-gradient(to_right,black,transparent_65%)]" />
      <EarthGlow className="-right-48 top-6 hidden size-[34rem] rounded-full opacity-80 md:block" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <span aria-hidden className="mt-4 block h-0.5 w-10 bg-brand" />
        {description && (
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
