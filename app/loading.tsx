export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-brand-100">
        <div className="h-3 w-3 animate-pulse rounded-full bg-brand-400" />
        Loading your watch party...
      </div>
    </main>
  );
}
