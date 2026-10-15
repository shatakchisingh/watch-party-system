'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, DoorOpen, Link2, LoaderCircle, Sparkles, Users } from 'lucide-react';
import { getGuestId, getGuestName, saveGuestName } from '@/lib/browser/guest';
import { movies } from '@/lib/movies/catalog';

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    setName(getGuestName());
  }, []);

  function rememberName(value: string) {
    const trimmed = value.trim();
    saveGuestName(trimmed);
    return trimmed;
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsCreating(true);
    const displayName = rememberName(name);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: getGuestId(), name: displayName, roomName: roomName.trim() || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Unable to create a room. Please try again.');
        return;
      }
      router.push(`/room/${payload.roomId}`);
    } catch {
      setError('Unable to reach SyncSpace. Check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  }

  function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsJoining(true);
    rememberName(name);
    router.push(`/room/${roomCode.trim().toUpperCase()}`);
  }

  return (
    <main className="space-y-12 py-4">
      <section className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{name ? `Welcome back, ${name}` : 'Your movie night starts here'}</p>
          <h1 className="editorial-title mt-3 max-w-3xl text-4xl leading-tight sm:text-6xl">Good stories are <span className="editorial-serif text-[#c4baff]">better shared.</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">Start a room in seconds, invite your people, and settle into a synchronized watch party. No account needed.</p>
        </div>
        <Link href="/discover" className="btn-secondary shrink-0">Browse movie picks <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr,0.92fr]">
        <form onSubmit={createRoom} className="card relative flex flex-col space-y-5 overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-violet-400/[0.08] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-200/20 bg-violet-200/[0.06] text-violet-200"><Sparkles className="h-4 w-4" /></div>
              <p className="eyebrow">Your room, your rules</p>
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Create a watch room</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">You’ll be the host. Choose a name, then invite everyone with a private room link.</p>
          </div>
          <label className="relative block text-sm text-slate-300">
            Your display name
            <input className="input mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" minLength={2} maxLength={32} required />
          </label>
          <label className="relative block text-sm text-slate-300">
            Room name <span className="text-slate-500">(optional)</span>
            <input className="input mt-2" value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Friday night cinema" maxLength={64} />
          </label>
          <button type="submit" className="btn-primary relative w-full sm:w-fit" disabled={isCreating}>
            {isCreating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            {isCreating ? 'Creating your room…' : 'Create Room'}
          </button>
        </form>

        <form onSubmit={joinRoom} className="card flex flex-col space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200"><DoorOpen className="h-4 w-4" /></div>
            <p className="eyebrow">Got an invite?</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Join with room code</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Enter the six-character code shared by your host.</p>
          </div>
          <label className="block text-sm text-slate-300">
            Your display name
            <input className="input mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" minLength={2} maxLength={32} required />
          </label>
          <label className="block text-sm text-slate-300">
            Room code
            <div className="relative mt-2">
              <Link2 className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input aria-label="Room code" className="input pl-11 uppercase tracking-[0.25em]" value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6))} placeholder="ABC234" minLength={6} maxLength={6} required />
            </div>
          </label>
          <button type="submit" className="btn-secondary w-full" disabled={isJoining}>
            {isJoining ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
            Join room
          </button>
        </form>
      </section>

      {error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">A little inspiration</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Movie-night picks</h2>
          </div>
          <Link href="/discover" className="hidden text-sm text-slate-300 transition hover:text-white sm:inline-flex sm:items-center">Explore all <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {movies.slice(0, 3).map((movie) => (
            <article key={movie.id} className="card card-hover group flex gap-4 p-3">
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-black">
                <Image src={movie.poster} alt={`${movie.title} poster`} fill unoptimized sizes="80px" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <p className="eyebrow !text-[9px]">{movie.genre} · {movie.year}</p>
                <h3 className="mt-2 truncate font-semibold text-white">{movie.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{movie.description}</p>
                <span className="mt-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">Discovery pick · not a stream</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className="border-t border-white/10 pt-5 text-xs text-slate-500">Rooms are temporary and live only while the server is running. Your display name is remembered on this device to help you reconnect. No recent rooms are stored.</p>
    </main>
  );
}
