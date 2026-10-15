const express = require('express');
const { createRoomSchema } = require('../validation');
const { searchMovies } = require('../movies/tmdb');

function registerHttpRoutes(serverApp, { manager, tmdbApiKey, fallbackMovies }) {
  serverApp.use(express.json({ limit: '16kb' }));

  serverApp.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: manager.rooms.size, roomStorage: 'in-memory' });
  });

  serverApp.get('/api/movies', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const result = await searchMovies({ apiKey: tmdbApiKey, query, fallbackMovies });
    res.json(result);
  });

  serverApp.post('/api/rooms', (req, res) => {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Enter a valid display name.' });
    }
    const room = manager.create(parsed.data);
    return res.status(201).json({ roomId: room.id });
  });
}

module.exports = { registerHttpRoutes };
