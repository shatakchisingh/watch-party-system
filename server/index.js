require('dotenv').config();

const express = require('express');
const http = require('node:http');
const next = require('next');
const { Server } = require('socket.io');
const fallbackMovies = require('../lib/movies/catalog.json');
const { loadConfig } = require('./config');
const { registerHttpRoutes } = require('./http/routes');
const { registerRoomEvents } = require('./realtime/register-room-events');
const { RoomManager } = require('./rooms/room-manager');

const config = loadConfig();
const nextApp = next({ dev: !config.isProduction, hostname: config.HOST, port: config.PORT });
const handleNextRequest = nextApp.getRequestHandler();

async function startServer() {
  await nextApp.prepare();

  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  const manager = new RoomManager({
    onChange: (snapshot) => io.to(snapshot.id).emit('room-state', snapshot),
  });

  registerHttpRoutes(app, {
    manager,
    tmdbApiKey: config.TMDB_API_KEY,
    fallbackMovies,
  });
  registerRoomEvents(io, manager);
  app.all('*', (req, res) => handleNextRequest(req, res));

  const syncTimer = setInterval(() => {
    for (const room of manager.rooms.values()) {
      io.to(room.id).emit('room-state', manager.snapshot(room));
    }
  }, 2000);
  syncTimer.unref?.();

  httpServer.on('error', (error) => {
    console.error('SyncSpace HTTP server error:', error);
    process.exitCode = 1;
  });

  httpServer.listen(config.PORT, config.HOST, () => {
    console.log(`SyncSpace server ready at http://${config.HOST}:${config.PORT}`);
  });

  async function shutdown(signal) {
    console.log(`Received ${signal}; closing SyncSpace server.`);
    clearInterval(syncTimer);
    manager.close();
    let shutdownError;
    try {
      await new Promise((resolve, reject) => {
        io.close((error) => (error ? reject(error) : resolve()));
      });
    } catch (error) {
      shutdownError = error;
    }
    try {
      await nextApp.close();
    } catch (error) {
      shutdownError ??= error;
    }
    if (shutdownError) throw shutdownError;
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      shutdown(signal).catch((error) => {
        console.error('Error while shutting down SyncSpace:', error);
        process.exitCode = 1;
      });
    });
  }
}

startServer().catch((error) => {
  console.error('Unable to start SyncSpace:', error);
  process.exitCode = 1;
});
