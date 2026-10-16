export default function TeamLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-16 sm:px-6">
      <div className="h-8 w-56 rounded bg-slate-100" />
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  )
}
