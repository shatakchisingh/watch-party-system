import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clapperboard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SyncSpace — Watch together',
  description: 'Bring your people together for a perfectly synced movie night.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <header className="glass sticky top-4 z-40 mb-8 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 font-bold text-white">
                  <Clapperboard className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold tracking-tight">SyncSpace</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">watch party</div>
                </div>
              </Link>

              <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
                <Link href="/" className="transition hover:text-white">Home</Link>
                <Link href="/dashboard" className="transition hover:text-white">Start a party</Link>
                <Link href="/discover" className="transition hover:text-white">Discover</Link>
              </nav>

              <Link href="/dashboard" className="btn-primary hidden sm:inline-flex">
                Create a room <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <nav className="mt-3 flex gap-5 border-t border-white/5 pt-3 text-sm text-slate-300 md:hidden">
              <Link href="/dashboard" className="transition hover:text-white">Start a party</Link>
              <Link href="/discover" className="transition hover:text-white">Discover</Link>
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
