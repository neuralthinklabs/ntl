export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}
