import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessagesSquare, PlayCircle, Radio, Sparkles, Users } from 'lucide-react';
import { movies } from '@/lib/movies/catalog';

export default function HomePage() {
  return (
    <main className="space-y-16">
      <section className="grid gap-8 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/60 p-6 md:grid-cols-[1.3fr,0.7fr] md:p-10">
        <div className="space-y-8 py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            Real-time co-watching
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Shared stories, synced moments, unstoppable nights in.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-300">
              Create a room, invite your friends, and settle into a shared screen with synced playback, live chat, reactions, and a vote-powered queue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="btn-primary">
              Start a watch party <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/discover" className="btn-secondary">
              Explore movies
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 text-sm text-slate-300">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-300" /> No account needed</div>
            <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-brand-300" /> Live room sync</div>
            <div className="flex items-center gap-2"><MessagesSquare className="h-4 w-4 text-brand-300" /> Chat & reactions</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-brand-500/30 via-indigo-500/20 to-blue-500/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/50">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-300">
              <span>Room preview</span>
              <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-1 text-brand-200">Sync ready</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Image src={movies[0].poster} alt={movies[0].title} width={900} height={1100} className="h-80 w-full object-cover" priority />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-white">{movies[0].title}</p>
                  <p className="text-sm text-slate-400">{movies[0].genre} · {movies[0].year}</p>
                </div>
                <button className="rounded-xl bg-brand-500/20 p-2 text-brand-200">
                  <PlayCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-brand-500 to-indigo-500" />
                </div>
                <div className="flex justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  <span>Host controlled</span>
                  <span>Shared playback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { icon: Users, title: 'Your people, one room', text: 'Share a simple invite code and meet your friends on the same screen.' },
          { icon: Sparkles, title: 'Stay in sync', text: 'Playback state follows the host, with late-join catch-up and drift correction.' },
          { icon: MessagesSquare, title: 'Make it social', text: 'Chat, react, build a shared queue, and vote on what comes next.' },
        ].map((feature) => (
          <div key={feature.title} className="card space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-200">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="text-sm leading-6 text-slate-400">{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[32px] border border-white/10 bg-slate-900/60 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Popular right now</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Tonight’s featured picks</h2>
          </div>
          <Link href="/discover" className="text-sm font-medium text-brand-200 hover:text-white">Browse all</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {movies.slice(0, 3).map((movie) => (
            <div key={movie.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
              <Image src={movie.poster} alt={movie.title} width={900} height={600} className="h-60 w-full object-cover" />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
                    <p className="text-sm text-slate-400">{movie.genre} · {movie.year}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">★ {movie.rating}</span>
                </div>
                <p className="text-sm text-slate-400">{movie.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-brand-500/20 bg-gradient-to-br from-brand-500/15 via-slate-900/70 to-indigo-500/10 p-8 md:flex md:items-center md:justify-between md:p-10">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Bring everyone to the same scene</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Your next movie night starts here.</h2>
          <p className="mt-2 text-slate-300">SyncSpace plays supported video URLs you provide; it does not stream commercial films.</p>
        </div>
        <Link href="/dashboard" className="btn-primary mt-6 md:mt-0">
          Create your room <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
