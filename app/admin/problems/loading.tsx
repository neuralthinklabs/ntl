export default function AdminProblemsLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  )
}
