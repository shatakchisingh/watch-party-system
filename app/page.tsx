import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  Clapperboard,
  ListVideo,
  MessageCircle,
  Play,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { movies } from '@/lib/movies/catalog';

const steps = [
  { number: '01', icon: Clapperboard, title: 'Create a room', text: 'Start a watch party in seconds. No accounts or setup to get in the way.' },
  { number: '02', icon: Users, title: 'Invite your friends', text: 'Share one simple link or room code and bring everyone to the same place.' },
  { number: '03', icon: Play, title: 'Watch together', text: 'Stay in sync, trade reactions, and decide together what comes next.' },
];

const capabilities = [
  { icon: Radio, title: 'In sync, down to the moment', text: 'Host-led play, pause, and seeking keep the room together. Late arrivals catch up to the current scene.' },
  { icon: MessageCircle, title: 'A little more like movie night', text: 'Send a quick message or a perfectly timed reaction without leaving the room.' },
  { icon: ListVideo, title: 'Pick the next watch, together', text: 'Build a shared playlist, suggest video sources, and vote on what should play next.' },
  { icon: Search, title: 'Find something worth sharing', text: 'Explore movie metadata and inspiration, then bring a pick into your room queue.' },
  { icon: Users, title: 'The host keeps the flow', text: 'A lightweight host role manages playback, changes the video, and can hand controls to another guest.' },
  { icon: ShieldCheck, title: 'Easy to join, easy to return', text: 'Guests can join with a code, and reconnecting participants are brought back to the room state.' },
];

export default function HomePage() {
  const featuredMovie = movies[0];

  return (
    <main>
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0e12]">
        <div className="absolute inset-0 z-0">
          <Image
            src={featuredMovie.poster}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover opacity-[0.2]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0d] via-[#090a0d]/90 to-[#090a0d]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-transparent to-[#090a0d]/20" />
        </div>

        <div className="relative z-10 grid min-h-[640px] items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.03fr,0.97fr] lg:px-16 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-slate-200 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
              The movie night, reimagined
            </p>
            <h1 className="editorial-title text-5xl leading-[0.98] sm:text-6xl lg:text-[5.5rem]">
              Movies hit<br />different <span className="editorial-serif text-[#c4baff]">together.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Your favorite movies, synchronized playback, and your friends — all in one place. Create a room, share the link, and watch together from anywhere.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary">
                Start Watching Together <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/discover" className="btn-secondary">
                Explore Movies
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-xs text-slate-300 sm:text-sm">
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300" /> Rooms in seconds</span>
              <span className="inline-flex items-center gap-2"><Radio className="h-4 w-4 text-violet-300" /> Shared playback</span>
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-violet-300" /> No account needed</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[610px] lg:ml-auto">
            <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-violet-400/10 blur-3xl" />
            <div className="overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#101116]/95 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-sm font-semibold text-white">Friday night cinema</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">A room preview</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> In sync
                </span>
              </div>
              <div className="relative aspect-[16/9] overflow-hidden bg-black">
                <Image src={featuredMovie.poster} alt={`${featuredMovie.title} cinematic preview`} fill unoptimized className="object-cover opacity-75" sizes="(max-width: 1024px) 90vw, 45vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                <div className="absolute left-5 top-4 flex -space-x-2" aria-label="Three friends watching">
                  {['M', 'J', 'A'].map((initial, index) => (
                    <span key={initial} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#14151b] text-[10px] font-bold text-white ${index === 1 ? 'bg-indigo-500' : index === 2 ? 'bg-rose-500' : 'bg-violet-500'}`}>{initial}</span>
                  ))}
                  <span className="ml-2 self-center pl-2 text-xs text-white/90">3 watching</span>
                </div>
                <div className="absolute inset-x-5 bottom-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Now playing</p>
                  <p className="mt-1 text-lg font-semibold text-white">{featuredMovie.title}</p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/30">
                    <div className="h-full w-[42%] rounded-full bg-white" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-3 p-4 sm:p-5">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <MessageCircle className="h-4 w-4 shrink-0 text-violet-200" />
                  <span className="truncate text-xs text-slate-300">That opening scene! 🍿</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-lg" aria-label="Live reactions">
                  <span>🍿</span><span>✨</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#15161c] px-4 py-3 shadow-xl sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-300/10 text-violet-200"><Radio className="h-4 w-4" /></span>
              <span><span className="block text-xs font-semibold text-white">Playback stays together</span><span className="mt-0.5 block text-[11px] text-slate-400">Host controls · live updates</span></span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-b border-white/10 py-10 sm:grid-cols-3 sm:gap-8 sm:py-12" aria-label="Product benefits">
        {[
          ['No sign-up, no waiting', 'Make a room and share the invite.'],
          ['One shared timeline', 'Host playback keeps every screen together.'],
          ['A room with your people', 'Chat, react, and vote while you watch.'],
        ].map(([title, text], index) => (
          <div key={title} className={`sm:px-5 ${index > 0 ? 'sm:border-l sm:border-white/10' : ''}`}>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1.5 text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="scroll-mt-28 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">A better kind of movie night</p>
          <h2 className="editorial-title mt-4 text-4xl sm:text-6xl">Three steps. <span className="editorial-serif text-[#c4baff]">One room.</span></h2>
          <p className="mt-5 text-base leading-7 text-slate-400">The best part is still the people you watch with. We make getting together the easy part.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, text }) => (
            <article key={number} className="card card-hover group min-h-56">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-[0.18em] text-slate-500">{number} / 03</span>
                <Icon className="h-5 w-5 text-violet-200 transition-transform duration-300 group-hover:-translate-y-1" />
              </div>
              <h3 className="mt-10 text-xl font-semibold tracking-tight text-white">{title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-28 py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr,1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">Everything in its place</p>
            <h2 className="editorial-title mt-4 text-4xl sm:text-6xl">Less setup.<br /><span className="editorial-serif text-[#c4baff]">More cinema.</span></h2>
          </div>
          <p className="max-w-xl pb-1 text-base leading-7 text-slate-400 lg:ml-auto">
            Thoughtful tools for the moments around the movie, built into the room and ready when your friends arrive.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {capabilities.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className={`card card-hover group flex min-h-48 flex-col justify-between ${index === 0 ? 'md:row-span-2 md:min-h-[410px] md:p-8' : ''}`}>
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-200/20 bg-violet-200/[0.06] text-violet-200"><Icon className="h-4 w-4" /></span>
                <ArrowDownRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:translate-y-1 group-hover:text-violet-200" />
              </div>
              <div className="mt-9">
                <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#121318] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(129,112,236,0.2),transparent_60%)]" />
          <div className="relative">
            <ShieldCheck className="mx-auto h-5 w-5 text-violet-200" />
            <p className="eyebrow mt-4">Your next movie night starts here</p>
            <h2 className="editorial-title mx-auto mt-4 max-w-3xl text-4xl sm:text-6xl">Bring your people.<br /><span className="editorial-serif text-[#c4baff]">Press play together.</span></h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-slate-400">Create a room, share the invite, and use a supported video source you have permission to watch.</p>
            <Link href="/dashboard" className="btn-primary mt-8">Create Your Watch Party <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-5 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white"><Clapperboard className="h-4 w-4" /> SyncSpace</Link>
        <p>Rooms are temporary. Movie listings are discovery metadata, not streams.</p>
        <nav aria-label="Footer navigation" className="flex gap-5">
          <Link href="/discover" className="transition hover:text-white">Discover</Link>
          <Link href="/dashboard" className="transition hover:text-white">Create a room</Link>
        </nav>
      </footer>
    </main>
  );
}
