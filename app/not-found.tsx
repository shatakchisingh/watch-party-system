import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-7xl font-black text-brand-400">404</div>
      <h1 className="mt-4 text-3xl font-bold text-white">Room not found</h1>
      <p className="mt-2 max-w-md text-slate-400">The party link may be invalid or the room was closed.</p>
      <Link href="/dashboard" className="btn-primary mt-6">Return home</Link>
    </main>
  );
}
