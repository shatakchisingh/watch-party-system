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
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="SyncSpace home">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#101116]">
                <Clapperboard className="h-4 w-4" />
              </span>
              <span className="text-base font-bold tracking-[-0.04em] text-white sm:text-lg">SyncSpace</span>
            </Link>

            <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
              <Link href="/discover" className="quiet-link">Discover</Link>
              <Link href="/#how-it-works" className="quiet-link">How it works</Link>
              <Link href="/#features" className="quiet-link">Features</Link>
            </nav>

            <Link href="/dashboard" className="btn-primary shrink-0 px-4 py-2.5 text-xs sm:text-sm">
              <span className="hidden sm:inline">Start a Watch Party</span>
              <span className="sm:hidden">Start a party</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </header>

          <nav aria-label="Mobile navigation" className="mb-7 flex gap-6 overflow-x-auto border-b border-white/10 px-1 pb-3 text-sm text-slate-300 md:hidden">
            <Link href="/discover" className="whitespace-nowrap transition hover:text-white">Discover</Link>
            <Link href="/#how-it-works" className="whitespace-nowrap transition hover:text-white">How it works</Link>
            <Link href="/#features" className="whitespace-nowrap transition hover:text-white">Features</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
