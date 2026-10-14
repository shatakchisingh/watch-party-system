'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import {
  ArrowLeftRight,
  Check,
  CircleAlert,
  Copy,
  LoaderCircle,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  Radio,
  Send,
  Users,
  Vote,
} from 'lucide-react';
import type { ClientToServerEvents, RoomSnapshot, ServerToClientEvents } from '@/lib/rooms/types';
import { getGuestId, getGuestName, saveGuestName } from '@/lib/browser/guest';

type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function supportsVideoUrl(value: string) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && /\.(mp4|webm|ogv|ogg)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = typeof params?.roomId === 'string' ? params.roomId.toUpperCase() : '';
  const [socket, setSocket] = useState<RoomSocket | null>(null);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [guestId, setGuestId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [error, setError] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const [copied, setCopied] = useState(false);
  const roomRef = useRef<RoomSnapshot | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const commandIdRef = useRef(0);
  const serverOffsetRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const suggestedRef = useRef(false);

  useEffect(() => {
    const id = getGuestId();
    const savedName = getGuestName();
    setGuestId(id);
    setNameInput(savedName);
    if (savedName) setDisplayName(savedName);
  }, []);

  const connect = useCallback((name: string) => {
    if (!guestId || !roomId) return;
    saveGuestName(name);
    setDisplayName(name);
    setError('');
  }, [guestId, roomId]);

  useEffect(() => {
    if (!guestId || !displayName || !roomId) return;

    const client = io({
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    }) as RoomSocket;
    setSocket(client);
    setConnectionState('connecting');

    client.on('connect', () => {
      setConnectionState('connected');
      client.emit('join-room', { roomId, guestId, name: displayName });
    });
    client.on('disconnect', () => setConnectionState('reconnecting'));
    client.on('connect_error', () => setConnectionState('reconnecting'));
    client.on('room-error', ({ message }) => setError(message));
    client.on('room-state', (nextRoom) => {
      roomRef.current = nextRoom;
      serverOffsetRef.current = nextRoom.serverTime - Date.now();
      setRoom(nextRoom);
      setError('');

      if (!suggestedRef.current && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const videoId = params.get('suggest');
        const title = params.get('title');
        if (videoId && title) {
          client.emit('suggest-video', { roomId, videoId, title, source: null });
          suggestedRef.current = true;
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    return () => {
      client.disconnect();
      setSocket(null);
    };
  }, [displayName, guestId, roomId]);

  const currentVideo = room?.state;
  const hostIsUser = Boolean(room && room.hostId === guestId);
  const expectedPosition = useCallback((snapshot: RoomSnapshot) => {
    if (snapshot.state.status !== 'playing') return snapshot.state.position;
    const estimatedServerNow = Date.now() + serverOffsetRef.current;
    return snapshot.state.position + Math.max(0, estimatedServerNow - snapshot.serverTime) / 1000;
  }, []);

  const applyPlayback = useCallback(() => {
    const video = videoRef.current;
    const snapshot = roomRef.current;
    if (!video || !snapshot?.state.source || video.readyState < 1) return;

    const targetPosition = expectedPosition(snapshot);
    applyingRemoteRef.current = true;
    if (Math.abs(video.currentTime - targetPosition) > 0.5) {
      video.currentTime = targetPosition;
    }
    if (snapshot.state.status === 'playing') {
      void video.play().then(() => setPlaybackError('')).catch(() => {
        setPlaybackError('Playback was blocked by your browser. Press play to continue in sync.');
      });
    } else {
      video.pause();
      video.playbackRate = 1;
    }
    window.setTimeout(() => { applyingRemoteRef.current = false; }, 0);
  }, [expectedPosition]);

  useEffect(() => {
    if (room?.state.source) applyPlayback();
  }, [applyPlayback, room?.state.revision, room?.state.source]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const video = videoRef.current;
      const snapshot = roomRef.current;
      if (!video || !snapshot?.state.source || snapshot.state.status !== 'playing' || video.readyState < 1) return;

      const drift = expectedPosition(snapshot) - video.currentTime;
      if (Math.abs(drift) > 0.5) {
        applyingRemoteRef.current = true;
        video.currentTime = expectedPosition(snapshot);
        video.playbackRate = 1;
        window.setTimeout(() => { applyingRemoteRef.current = false; }, 0);
      } else {
        video.playbackRate = 1;
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [expectedPosition]);

  const command = useCallback(() => {
    commandIdRef.current += 1;
    return commandIdRef.current;
  }, []);

  const sendChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim() || !socket || !room) return;
    socket.emit('chat-message', { roomId, message: chatInput.trim() });
    setChatInput('');
  };

  const togglePlayback = () => {
    if (!socket || !room || !hostIsUser || !room.state.source) return;
    socket.emit('playback-command', {
      roomId,
      action: room.state.status === 'playing' ? 'paused' : 'playing',
      position: videoRef.current?.currentTime ?? room.state.position,
      commandId: command(),
    });
  };

  const seekTo = (position: number) => {
    if (!socket || !hostIsUser || !room?.state.source) return;
    socket.emit('seek', { roomId, position, commandId: command() });
    setSeekPreview(null);
  };

  const submitVideo = (playNow: boolean) => {
    if (!socket || !room || !videoTitle.trim()) return;
    if (!supportsVideoUrl(videoUrl)) {
      setError('Use a direct MP4, WebM, or Ogg video URL over HTTPS or HTTP.');
      return;
    }

    const videoId = `video-${crypto.randomUUID()}`;
    const video = { videoId, title: videoTitle.trim(), source: videoUrl.trim() };
    if (playNow && hostIsUser) {
      socket.emit('change-video', { roomId, ...video, commandId: command() });
    } else {
      socket.emit('suggest-video', { roomId, ...video });
    }
    setVideoTitle('');
    setVideoUrl('');
    setError('');
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy the invite link. You can share the room code instead.');
    }
  };

  const currentPosition = useMemo(
    () => room ? expectedPosition(room) : 0,
    [expectedPosition, room],
  );

  if (!displayName) {
    return (
      <main className="mx-auto max-w-xl py-12">
        <form onSubmit={(event) => { event.preventDefault(); connect(nameInput.trim()); }} className="card space-y-5 p-7">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand-200">You’re invited</p>
            <h1 className="mt-2 text-3xl font-black text-white">Join the watch party</h1>
            <p className="mt-2 text-sm text-slate-400">Choose a display name to join room {roomId}.</p>
          </div>
          <label className="block text-sm text-slate-300">
            Display name
            <input autoFocus className="input mt-2" value={nameInput} onChange={(event) => setNameInput(event.target.value)} minLength={2} maxLength={32} placeholder="e.g. Alex" required />
          </label>
          {error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
          <button className="btn-primary w-full" type="submit" disabled={nameInput.trim().length < 2}>Join room</button>
          <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary w-full"><ArrowLeftRight className="mr-2 h-4 w-4" /> Use another room</button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-6 py-4">
      <section className="card flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Watch room · {roomId}</p>
          <h1 className="mt-2 text-3xl font-black text-white">{room?.roomName ?? 'Joining the room…'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${connectionState === 'connected' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
            <span className={`h-2 w-2 rounded-full ${connectionState === 'connected' ? 'bg-emerald-400' : 'animate-pulse bg-amber-300'}`} />
            {connectionState === 'connected' ? 'Connected' : connectionState === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
          </span>
          <span>{room?.participants.length ?? 0} watching</span>
          <button type="button" onClick={copyInvite} className="btn-secondary px-3 py-2">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy invite'}
          </button>
          <button type="button" onClick={() => router.push('/dashboard')} className="text-slate-400 transition hover:text-white">Leave room</button>
        </div>
      </section>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.5fr,0.75fr]">
        <div className="space-y-4">
          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950/80 md:min-h-[460px]">
            {currentVideo?.source ? (
              <video
                key={currentVideo.source}
                ref={videoRef}
                className="max-h-[70vh] w-full bg-black object-contain"
                src={currentVideo.source}
                playsInline
                preload="metadata"
                onLoadedMetadata={applyPlayback}
                onError={() => setPlaybackError('This video URL could not be played. Check the direct video link and try another source.')}
              />
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-200"><Radio className="h-7 w-7" /></div>
                <h2 className="mt-5 text-xl font-semibold text-white">{currentVideo?.title || 'Waiting for the room host'}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Movie picks are suggestions, not streams. Add a direct MP4, WebM, or Ogg video URL below to watch a supported source together.
                </p>
              </div>
            )}
            {playbackError ? (
              <div role="status" className="absolute bottom-4 left-4 right-4 rounded-xl border border-amber-400/20 bg-slate-950/90 p-3 text-sm text-amber-100">{playbackError}</div>
            ) : null}
            {room?.reactions.slice(-6).map((reaction, index) => (
              <div key={reaction.id} className="absolute right-5 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-2xl shadow-lg" style={{ top: `${20 + index * 48}px` }} title={`${reaction.name} reacted`}>
                {reaction.emoji}
              </div>
            ))}
          </div>

          <div className="card p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-brand-200">Now playing</div>
                <div className="mt-2 text-2xl font-bold text-white">{currentVideo?.title ?? 'Waiting for room state'}</div>
              </div>
              <div className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-sm text-brand-100">
                {currentVideo?.status ?? 'connecting'}
              </div>
            </div>

            <div className="space-y-3">
              <input
                aria-label="Playback position"
                type="range"
                min={0}
                max={Math.max(1, Math.ceil(videoRef.current?.duration || 3600))}
                value={seekPreview ?? currentPosition}
                onChange={(event) => setSeekPreview(Number(event.target.value))}
                onPointerUp={() => { if (seekPreview !== null) seekTo(seekPreview); }}
                onKeyUp={() => { if (seekPreview !== null) seekTo(seekPreview); }}
                disabled={!hostIsUser || !currentVideo?.source}
                className="w-full accent-brand-500 disabled:opacity-40"
              />
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>{formatTime(seekPreview ?? currentPosition)}</span>
                <span>{hostIsUser ? 'You are hosting' : `Hosted by ${room?.participants.find((person) => person.id === room.hostId)?.name ?? 'a room guest'}`}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={togglePlayback} className="btn-primary" disabled={!hostIsUser || !currentVideo?.source}>
                {currentVideo?.status === 'playing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {currentVideo?.status === 'playing' ? 'Pause' : 'Play'}
              </button>
              {!hostIsUser ? <span className="text-sm text-slate-500">The host controls playback.</span> : null}
            </div>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); submitVideo(hostIsUser); }} className="card space-y-3 p-4">
            <div>
              <h2 className="font-semibold text-white">{hostIsUser ? 'Add a video source' : 'Suggest a video source'}</h2>
              <p className="mt-1 text-xs text-slate-500">Direct MP4, WebM, or Ogg URLs only. Movie metadata does not include streaming rights or video.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[0.6fr,1fr,auto]">
              <input className="input" value={videoTitle} onChange={(event) => setVideoTitle(event.target.value)} placeholder="Video title" maxLength={120} required />
              <input className="input" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://example.com/video.mp4" required />
              <button type="submit" className="btn-secondary whitespace-nowrap"><Plus className="mr-2 h-4 w-4" />{hostIsUser ? 'Play now' : 'Suggest'}</button>
            </div>
            {hostIsUser ? (
              <button type="button" className="text-xs text-slate-500 hover:text-slate-300" onClick={() => submitVideo(false)}>
                Add the URL to the shared playlist instead
              </button>
            ) : null}
          </form>
        </div>

        <aside className="space-y-6">
          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Participants</h2>
              <div className="flex items-center gap-2 text-sm text-slate-300"><Users className="h-4 w-4" /> {room?.participants.length ?? 0}</div>
            </div>
            <div className="space-y-3">
              {!room ? <div className="flex items-center gap-2 p-3 text-sm text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Connecting to the room…</div> : null}
              {room?.participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-xs font-bold text-white">{participant.avatar}</div>
                    <div>
                      <div className="font-medium text-white">{participant.name}{participant.id === guestId ? ' (you)' : ''}</div>
                      <div className="text-xs text-slate-400">{participant.id === room.hostId ? 'Host' : participant.connected ? 'Watching' : 'Reconnecting…'}</div>
                    </div>
                  </div>
                  {hostIsUser && participant.id !== guestId && participant.connected ? (
                    <button type="button" title={`Transfer host to ${participant.name}`} aria-label={`Transfer host to ${participant.name}`} onClick={() => socket?.emit('transfer-host', { roomId, participantId: participant.id })} className="rounded-lg p-2 text-slate-400 hover:bg-brand-500/10 hover:text-brand-200">
                      <ArrowLeftRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className={`h-2.5 w-2.5 rounded-full ${participant.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Chat</h2>
              <MessageSquareText className="h-4 w-4 text-brand-200" />
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {room?.chat.length ? room.chat.slice(-12).map((message) => (
                <div key={message.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="truncate">{message.user}</span>
                    <span className="shrink-0">{new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="break-words text-sm text-slate-200">{message.text}</div>
                </div>
              )) : <p className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">Say hi and start the movie-night chat.</p>}
            </div>
            <form onSubmit={sendChat} className="mt-4 flex gap-2">
              <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} className="input flex-1" placeholder="Send a message" maxLength={500} />
              <button type="submit" className="btn-primary px-3" aria-label="Send message" disabled={!chatInput.trim()}><Send className="h-4 w-4" /></button>
            </form>
            <div className="mt-3 flex gap-2">
              {['🔥', '🎉', '👏', '😂', '😍', '😮'].map((emoji) => (
                <button key={emoji} type="button" onClick={() => socket?.emit('reaction', { roomId, emoji })} className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-1 text-lg hover:border-brand-500" aria-label={`React ${emoji}`}>{emoji}</button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Shared playlist</h2>
                <p className="text-xs text-slate-500">Vote for what we watch next</p>
              </div>
              <Vote className="h-4 w-4 text-brand-200" />
            </div>
            {room?.playlist.length ? (
              <div className="space-y-3">
                {room.playlist.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">Suggested by {room.participants.find((participant) => participant.id === item.submittedBy)?.name ?? 'a guest'} · {item.source ? 'video attached' : 'metadata suggestion'}</div>
                      </div>
                      <button type="button" onClick={() => socket?.emit('vote-video', { roomId, videoId: item.id })} className="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-brand-500 hover:text-white" aria-label={`Vote for ${item.title}`}>
                        ▲ {item.votes.length}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hostIsUser ? (
                        <button type="button" onClick={() => {
                          if (!socket) return;
                          socket.emit('change-video', { roomId, videoId: item.id, title: item.title, source: item.source, commandId: command() });
                        }} className="text-xs text-brand-200 hover:text-white">Play this</button>
                      ) : null}
                      {item.votes.includes(guestId) ? <span className="flex items-center gap-1 text-xs text-emerald-300"><Check className="h-3 w-3" /> Your vote</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">No suggestions yet. Add a video URL or queue a movie from Discover.</p>}
          </div>
        </aside>
      </section>
    </main>
  );
}
