'use client';

export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-5xl font-black text-brand-400">Oops</div>
      <h1 className="mt-4 text-3xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-slate-400">The room couldn’t load correctly. Please retry.</p>
      <button onClick={() => reset()} className="btn-primary mt-6">Retry</button>
    </main>
  );
}
