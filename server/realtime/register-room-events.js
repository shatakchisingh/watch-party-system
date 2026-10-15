const {
  chatSchema,
  joinRoomSchema,
  playbackSchema,
  reactionSchema,
  roomPayloadSchema,
  seekSchema,
  transferHostSchema,
  videoSchema,
  voteSchema,
} = require('../validation');

function registerRoomEvents(io, manager) {
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

    function broadcastRoom(room) {
      io.to(room.id).emit('room-state', manager.snapshot(room));
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
      broadcastRoom(manager.get(parsed.data.roomId));
    });

    socket.on('chat-message', (payload) => {
      const parsed = chatSchema.safeParse(payload);
      if (!parsed.success) return reportError('Messages must be between 1 and 500 characters.');
      if (isRateLimited('chat', 6, 10_000)) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      manager.addChat(joined.room, joined.participant, parsed.data.message);
      broadcastRoom(joined.room);
    });

    socket.on('reaction', (payload) => {
      const parsed = reactionSchema.safeParse(payload);
      if (!parsed.success) return;
      if (isRateLimited('reaction', 8, 5_000)) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      manager.addReaction(joined.room, joined.participant, parsed.data.emoji);
      broadcastRoom(joined.room);
    });

    socket.on('playback-command', (payload) => {
      const parsed = playbackSchema.safeParse(payload);
      if (!parsed.success) return reportError('That playback command is invalid.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (joined.room.hostId !== joined.participant.id) return reportError('Only the host can control playback.');
      if (!acceptsCommand(parsed.data.commandId)) return;
      manager.setPlayback(joined.room, parsed.data.action, parsed.data.position);
      broadcastRoom(joined.room);
    });

    socket.on('seek', (payload) => {
      const parsed = seekSchema.safeParse(payload);
      if (!parsed.success) return reportError('That seek position is invalid.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (joined.room.hostId !== joined.participant.id) return reportError('Only the host can seek.');
      if (!acceptsCommand(parsed.data.commandId)) return;
      manager.seek(joined.room, parsed.data.position);
      broadcastRoom(joined.room);
    });

    socket.on('change-video', (payload) => {
      const parsed = videoSchema.safeParse(payload);
      if (!parsed.success) return reportError(parsed.error.issues[0]?.message || 'That video source is not supported.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (joined.room.hostId !== joined.participant.id) return reportError('Only the host can change the video.');
      if (!acceptsCommand(parsed.data.commandId)) return;
      manager.changeVideo(joined.room, { ...parsed.data, submittedBy: joined.participant.id });
      broadcastRoom(joined.room);
    });

    socket.on('suggest-video', (payload) => {
      const parsed = videoSchema.safeParse(payload);
      if (!parsed.success) return reportError(parsed.error.issues[0]?.message || 'That video suggestion is invalid.');
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      const added = manager.suggestVideo(joined.room, { ...parsed.data, submittedBy: joined.participant.id });
      if (!added) return reportError('That video is already queued or the playlist is full.');
      broadcastRoom(joined.room);
    });

    socket.on('vote-video', (payload) => {
      const parsed = voteSchema.safeParse(payload);
      if (!parsed.success) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (!manager.vote(joined.room, parsed.data.videoId, joined.participant.id)) return;
      broadcastRoom(joined.room);
    });

    socket.on('transfer-host', (payload) => {
      const parsed = transferHostSchema.safeParse(payload);
      if (!parsed.success) return;
      const joined = joinedRoom(parsed.data);
      if (!joined) return;
      if (!manager.transferHost(joined.room, joined.participant.id, parsed.data.participantId)) {
        return reportError('Choose someone in the room to receive host controls.');
      }
      broadcastRoom(joined.room);
    });

    socket.on('disconnect', () => {
      if (socket.data.roomId && socket.data.guestId) {
        manager.disconnect(socket.data.roomId, socket.data.guestId);
      }
      socket.data.rateLimits.clear();
    });
  });
}

module.exports = { registerRoomEvents };
