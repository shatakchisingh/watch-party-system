'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, DoorOpen, Link2, LoaderCircle, Users } from 'lucide-react';
import { getGuestId, getGuestName, saveGuestName } from '@/lib/browser/guest';

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
    <main className="space-y-8 py-4">
      <section className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Your movie night, together</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Every great story is better shared.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-400">
          Start a room in seconds, invite your people, and settle into a synchronized watch party. No account needed.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createRoom} className="card space-y-5 p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-200"><Users className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Create a watch room</h2>
              <p className="text-sm text-slate-400">You’ll be the host. Bring everyone else along.</p>
            </div>
          </div>
          <label className="block text-sm text-slate-300">
            Your display name
            <input className="input mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" minLength={2} maxLength={32} required />
          </label>
          <label className="block text-sm text-slate-300">
            Room name <span className="text-slate-500">(optional)</span>
            <input className="input mt-2" value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Friday night cinema" maxLength={64} />
          </label>
          <button type="submit" className="btn-primary w-full" disabled={isCreating}>
            {isCreating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            {isCreating ? 'Creating your room…' : 'Create room'}
          </button>
        </form>

        <form onSubmit={joinRoom} className="card space-y-5 p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-200"><DoorOpen className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Join your friends</h2>
              <p className="text-sm text-slate-400">Enter the six-character code from your invite.</p>
            </div>
          </div>
          <label className="block text-sm text-slate-300">
            Your display name
            <input className="input mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" minLength={2} maxLength={32} required />
          </label>
          <label className="block text-sm text-slate-300">
            Room code
            <div className="relative mt-2">
              <Link2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input className="input pl-10 uppercase tracking-[0.25em]" value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6))} placeholder="ABC234" minLength={6} maxLength={6} required />
            </div>
          </label>
          <button type="submit" className="btn-secondary w-full" disabled={isJoining}>
            {isJoining ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <DoorOpen className="mr-2 h-4 w-4" />}
            Join room
          </button>
        </form>
      </section>

      {error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      <p className="text-sm text-slate-500">Rooms are temporary and live only while the server is running. Your display name is remembered on this device to help you reconnect.</p>
    </main>
  );
}
