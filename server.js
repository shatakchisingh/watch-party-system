require('dotenv').config();

const express = require('express');
const http = require('node:http');
const next = require('next');
const { Server } = require('socket.io');
const { z } = require('zod');
const fallbackMovies = require('./lib/movies/catalog.json');
const { RoomManager } = require('./lib/rooms/room-manager');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const supportedSource = z.string().url().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && /\.(mp4|webm|ogv|ogg)$/i.test(url.pathname);
  } catch {
    return false;
  }
}, 'Use a direct MP4, WebM, or Ogg video URL.');

const createRoomSchema = z.object({
  guestId: z.string().uuid(),
  name: z.string().trim().min(2).max(32),
  roomName: z.string().trim().min(2).max(64).optional(),
});
const joinRoomSchema = z.object({
  roomId: z.string().regex(/^[A-Z0-9]{6}$/),
  guestId: z.string().uuid(),
  name: z.string().trim().min(2).max(32),
});
const roomPayloadSchema = z.object({ roomId: z.string().regex(/^[A-Z0-9]{6}$/) });
const chatSchema = roomPayloadSchema.extend({ message: z.string().trim().min(1).max(500) });
const reactionSchema = roomPayloadSchema.extend({ emoji: z.string().min(1).max(8) });
const playbackSchema = roomPayloadSchema.extend({
  action: z.enum(['playing', 'paused']),
  position: z.number().finite().min(0).max(86_400),
  commandId: z.number().int().nonnegative(),
});
const seekSchema = roomPayloadSchema.extend({
  position: z.number().finite().min(0).max(86_400),
  commandId: z.number().int().nonnegative(),
});
const videoSchema = roomPayloadSchema.extend({
  videoId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(120),
  source: supportedSource.nullable(),
});
const transferHostSchema = roomPayloadSchema.extend({ participantId: z.string().uuid() });
const voteSchema = roomPayloadSchema.extend({ videoId: z.string().trim().min(1).max(100) });

const movieGenres = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  28: 'Action',
  35: 'Comedy',
  53: 'Thriller',
  878: 'Sci-Fi',
};

function mapTmdbMovie(movie) {
  return {
    id: `tmdb-${movie.id}`,
    title: movie.title || 'Untitled',
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
    rating: Number(movie.vote_average || 0).toFixed(1),
    genre: movie.genre_ids?.map((id) => movieGenres[id]).filter(Boolean).join(' / ') || 'Film',
    description: movie.overview || 'No overview is available yet.',
    poster: movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : fallbackMovies[0].poster,
    duration: 'Movie',
    source: null,
  };
}

app.prepare().then(() => {
  const serverApp = express();
  const server = http.createServer(serverApp);
  const io = new Server(server);
  const manager = new RoomManager({
    onChange: (snapshot) => io.to(snapshot.id).emit('room-state', snapshot),
  });

  serverApp.use(express.json({ limit: '16kb' }));
  serverApp.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: manager.rooms.size, roomStorage: 'in-memory' });
  });

  serverApp.get('/api/movies', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const fallback = () => (query
      ? fallbackMovies.filter((movie) => `${movie.title} ${movie.genre} ${movie.description}`.toLowerCase().includes(query))
      : fallbackMovies);
    if (!process.env.TMDB_API_KEY) {
      return res.json({ movies: fallback(), source: 'mock' });
    }

    const tmdbQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const endpoint = tmdbQuery
      ? 'https://api.themoviedb.org/3/search/movie'
      : 'https://api.themoviedb.org/3/movie/popular';
    const url = new URL(endpoint);
    url.searchParams.set('api_key', process.env.TMDB_API_KEY);
    if (tmdbQuery) url.searchParams.set('query', tmdbQuery);

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        console.warn(`TMDB request failed with status ${response.status}; serving local movie data.`);
        return res.json({ movies: fallback(), source: 'mock', notice: 'Movie metadata is temporarily unavailable; showing local picks.' });
      }
      const payload = await response.json();
      return res.json({ movies: (payload.results || []).map(mapTmdbMovie), source: 'tmdb' });
    } catch (error) {
      console.warn('TMDB request failed; serving local movie data:', error.message);
      return res.json({ movies: fallback(), source: 'mock', notice: 'Movie metadata is temporarily unavailable; showing local picks.' });
    }
  });

  serverApp.post('/api/rooms', (req, res) => {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Enter a valid display name.' });
    }
    const room = manager.create(parsed.data);
    return res.status(201).json({ roomId: room.id });
  });

  io.on('connection', (socket) => {
    socket.data.rateLimits = new Map();
    socket.data.lastCommandId = -1;

    function reportError(message) {
      socket.emit('room-error', { message });
    }

    function joinedRoom(payload) {
      const parsed = roomPayloadSchema.safeParse(payload);
      if (!parsed.success || socket.data.roomId !== parsed.data.roomId || !socket.data.guestId) {
        reportError('Join the room before using its controls.');
        return null;
      }
      const room = manager.get(parsed.data.roomId);
      const participant = room?.participants.get(socket.data.guestId);
      if (!room || !participant) {
        reportError('This room is no longer available. Return to the room page to rejoin.');
        return null;
      }
      return { room, participant };
    }

    function isRateLimited(event, limit, intervalMs) {
      const now = Date.now();
      const recent = (socket.data.rateLimits.get(event) || []).filter((time) => time > now - intervalMs);
      if (recent.length >= limit) {
        reportError('You are sending that a little too quickly. Please wait a moment.');
        socket.data.rateLimits.set(event, recent);
        return true;
      }
      recent.push(now);
      socket.data.rateLimits.set(event, recent);
      return false;
    }

    function acceptsCommand(commandId) {
      if (commandId <= socket.data.lastCommandId) return false;
      socket.data.lastCommandId = commandId;
      return true;
    }

    socket.on('join-room', (payload) => {
      const parsed = joinRoomSchema.safeParse(payload);
      if (!parsed.success) {
        reportError('Enter a valid room code and display name.');
        return;
      }
      if (socket.data.roomId) {
        socket.leave(socket.data.roomId);
        manager.disconnect(socket.data.roomId, socket.data.guestId);
      }
      const result = manager.join(parsed.data.roomId, parsed.data);
      if (result.error) {
        reportError(result.error);
        return;
      }
      socket.data.roomId = parsed.data.roomId;
      socket.data.guestId = parsed.data.guestId;
      socket.data.lastCommandId = -1;
      socket.join(parsed.data.roomId);
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(manager.get(parsed.data.roomId)));
    });

    socket.on('chat-message', (payload) => {
      const parsed = chatSchema.safeParse(payload);
      if (!parsed.success) return reportError('Messages must be between 1 and 500 characters.');
      if (isRateLimited('chat', 6, 10_000)) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      manager.addChat(joined.room, joined.participant, parsed.data.message);
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('reaction', (payload) => {
      const parsed = reactionSchema.safeParse(payload);
      if (!parsed.success) return;
      if (isRateLimited('reaction', 8, 5_000)) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      manager.addReaction(joined.room, joined.participant, parsed.data.emoji);
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('playback-command', (payload) => {
      const parsed = playbackSchema.safeParse(payload);
      if (!parsed.success) return reportError('That playback command is invalid.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (joined.room.hostId !== joined.participant.id) return reportError('Only the host can control playback.');
      if (!acceptsCommand(parsed.data.commandId)) return;
      manager.setPlayback(joined.room, parsed.data.action, parsed.data.position);
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('seek', (payload) => {
      const parsed = seekSchema.safeParse(payload);
      if (!parsed.success) return reportError('That seek position is invalid.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (joined.room.hostId !== joined.participant.id) return reportError('Only the host can seek.');
      if (!acceptsCommand(parsed.data.commandId)) return;
      manager.seek(joined.room, parsed.data.position);
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('change-video', (payload) => {
      const parsed = videoSchema.safeParse(payload);
      if (!parsed.success) return reportError(parsed.error.issues[0]?.message || 'That video source is not supported.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (joined.room.hostId !== joined.participant.id) return reportError('Only the host can change the video.');
      if (!acceptsCommand(parsed.data.commandId)) return;
      manager.changeVideo(joined.room, { ...parsed.data, submittedBy: joined.participant.id });
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('suggest-video', (payload) => {
      const parsed = videoSchema.safeParse(payload);
      if (!parsed.success) return reportError(parsed.error.issues[0]?.message || 'That video suggestion is invalid.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      const added = manager.suggestVideo(joined.room, { ...parsed.data, submittedBy: joined.participant.id });
      if (!added) return reportError('That video is already queued or the playlist is full.');
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('vote-video', (payload) => {
      const parsed = voteSchema.safeParse(payload);
      if (!parsed.success) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (!manager.vote(joined.room, parsed.data.videoId, joined.participant.id)) return;
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('transfer-host', (payload) => {
      const parsed = transferHostSchema.safeParse(payload);
      if (!parsed.success) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (!manager.transferHost(joined.room, joined.participant.id, parsed.data.participantId)) {
        return reportError('Choose someone in the room to receive host controls.');
      }
      io.to(parsed.data.roomId).emit('room-state', manager.snapshot(joined.room));
    });

    socket.on('disconnect', () => {
      if (socket.data.roomId && socket.data.guestId) {
        manager.disconnect(socket.data.roomId, socket.data.guestId);
      }
      socket.data.rateLimits.clear();
    });
  });

  const syncTimer = setInterval(() => {
    for (const room of manager.rooms.values()) {
      io.to(room.id).emit('room-state', manager.snapshot(room));
    }
  }, 2000);
  syncTimer.unref?.();

  serverApp.all('*', (req, res) => handle(req, res));

  server.listen(port, hostname, () => {
    console.log(`SyncSpace server ready at http://${hostname}:${port}`);
  });
});
