// P2 #14: global fallback shown by Next.js while any route segment without
// its own loading.tsx is fetching server data (e.g. first paint of a page
// that awaits Supabase/DB calls). Route-specific skeletons (dashboard,
// admin) below give a closer-to-final layout; this is the safety net for
// everything else.
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
    </div>
  )
}
