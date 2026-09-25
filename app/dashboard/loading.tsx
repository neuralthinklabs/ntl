// P2 #14: skeleton matching components/dashboard/dashboard.tsx's layout
// (sidebar + stat cards + activity list) so the dashboard doesn't flash
// blank while its DB queries (profile, problems, activity, achievements,
// registrations) resolve.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6">
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-slate-100" />
            ))}
          </div>
        </aside>
        <main>
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100" />
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
