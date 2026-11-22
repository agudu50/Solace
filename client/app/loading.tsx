/**
 * Shown instantly while a route segment loads. Keeps the click feeling
 * responsive (the progress bar in NavProgress runs above it).
 */
export default function Loading() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-10 w-full max-w-xl rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-full max-w-md rounded bg-slate-200/70 dark:bg-white/[0.06]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616]" />
          ))}
        </div>
      </div>
    </div>
  );
}
