const crypto = require('node:crypto');

const CODE_CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROOM_CODE_LENGTH = 6;
const MAX_PARTICIPANTS = 20;
const MAX_MESSAGES = 50;
const MAX_REACTIONS = 30;
const MAX_PLAYLIST_ITEMS = 30;

function makeRoomCode() {
  const bytes = crypto.randomBytes(ROOM_CODE_LENGTH);
  return Array.from(bytes, (byte) => CODE_CHARACTERS[byte % CODE_CHARACTERS.length]).join('');
}

function publicParticipant(participant) {
  return {
    id: participant.id,
    name: participant.name,
    avatar: participant.avatar,
    connected: participant.connections > 0,
  };
}

class RoomManager {
  constructor({ reconnectGraceMs = 60_000, onChange = () => {} } = {}) {
    this.rooms = new Map();
    this.disconnectTimers = new Map();
    this.reconnectGraceMs = reconnectGraceMs;
    this.onChange = onChange;
  }

  create({ guestId, name, roomName }) {
    let id;
    do {
      id = makeRoomCode();
    } while (this.rooms.has(id));

    const now = Date.now();
    const host = {
      id: guestId,
      name,
      avatar: name.slice(0, 2).toUpperCase(),
      connections: 0,
    };
    const room = {
      id,
      roomName: roomName || `${name}'s watch party`,
      hostId: guestId,
      participants: new Map([[guestId, host]]),
      chat: [],
      reactions: [],
      playlist: [],
      state: {
        videoId: null,
        title: 'Choose something for tonight',
        source: null,
        status: 'paused',
        position: 0,
        updatedAt: now,
        revision: 0,
      },
      votesByParticipant: new Map(),
    };

    this.rooms.set(id, room);
    this.scheduleParticipantRemoval(room, guestId);
    return this.snapshot(room);
  }

  join(roomId, { guestId, name }) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'That room does not exist or has already ended.' };

    const timerKey = `${roomId}:${guestId}`;
    const timer = this.disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(timerKey);
    }

    let participant = room.participants.get(guestId);
    if (!participant) {
      if (room.participants.size >= MAX_PARTICIPANTS) {
        return { error: 'This room is full. Try joining again later.' };
      }
      participant = {
        id: guestId,
        name,
        avatar: name.slice(0, 2).toUpperCase(),
        connections: 0,
      };
      room.participants.set(guestId, participant);
    }
    participant.name = name;
    participant.avatar = name.slice(0, 2).toUpperCase();
    participant.connections += 1;

    return { snapshot: this.snapshot(room), participantId: participant.id };
  }

  disconnect(roomId, guestId) {
    const room = this.rooms.get(roomId);
    const participant = room?.participants.get(guestId);
    if (!room || !participant) return;

    participant.connections = Math.max(0, participant.connections - 1);
    if (participant.connections > 0) {
      this.onChange(this.snapshot(room));
      return;
    }

    this.onChange(this.snapshot(room));
    this.scheduleParticipantRemoval(room, guestId);
  }

  scheduleParticipantRemoval(room, guestId) {
    const timerKey = `${room.id}:${guestId}`;
    const oldTimer = this.disconnectTimers.get(timerKey);
    if (oldTimer) clearTimeout(oldTimer);
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(timerKey);
      const currentRoom = this.rooms.get(room.id);
      const currentParticipant = currentRoom?.participants.get(guestId);
      if (!currentRoom || !currentParticipant || currentParticipant.connections > 0) return;

      currentRoom.participants.delete(guestId);
      currentRoom.votesByParticipant.delete(guestId);
      for (const item of currentRoom.playlist) {
        item.votes = item.votes.filter((id) => id !== guestId);
      }
      if (currentRoom.hostId === guestId) {
        const nextHost = Array.from(currentRoom.participants.values()).find((person) => person.connections > 0)
          || currentRoom.participants.values().next().value;
        currentRoom.hostId = nextHost?.id || '';
      }
      if (currentRoom.participants.size === 0) {
        this.rooms.delete(room.id);
        return;
      }
      this.onChange(this.snapshot(currentRoom));
    }, this.reconnectGraceMs);
    timer.unref?.();
    this.disconnectTimers.set(timerKey, timer);
  }

  transferHost(room, currentHostId, nextHostId) {
    const nextHost = room.participants.get(nextHostId);
    if (room.hostId !== currentHostId || !nextHost || nextHost.connections < 1) return false;
    room.hostId = nextHostId;
    room.state.revision += 1;
    room.state.updatedAt = Date.now();
    return true;
  }

  setPlayback(room, status, position) {
    room.state.position = Math.max(0, position);
    room.state.status = status;
    room.state.updatedAt = Date.now();
    room.state.revision += 1;
  }

  seek(room, position) {
    room.state.position = Math.max(0, position);
    room.state.updatedAt = Date.now();
    room.state.revision += 1;
  }

  changeVideo(room, { videoId, title, source, submittedBy }) {
    room.state.videoId = videoId;
    room.state.title = title;
    room.state.source = source;
    room.state.status = 'paused';
    room.state.position = 0;
    room.state.updatedAt = Date.now();
    room.state.revision += 1;
    if (submittedBy) {
      const queuedIndex = room.playlist.findIndex((item) => item.id === videoId);
      if (queuedIndex !== -1) room.playlist.splice(queuedIndex, 1);
    }
  }

  suggestVideo(room, { videoId, title, source, submittedBy }) {
    if (room.playlist.some((item) => item.id === videoId)) return false;
    if (room.playlist.length >= MAX_PLAYLIST_ITEMS) return false;
    room.playlist.push({ id: videoId, title, source, submittedBy, votes: [] });
    room.state.revision += 1;
    room.state.updatedAt = Date.now();
    return true;
  }

  vote(room, videoId, participantId) {
    const item = room.playlist.find((entry) => entry.id === videoId);
    if (!item) return false;
    const previousVote = room.votesByParticipant.get(participantId);
    if (previousVote === videoId) return false;
    if (previousVote) {
      const previousItem = room.playlist.find((entry) => entry.id === previousVote);
      if (previousItem) previousItem.votes = previousItem.votes.filter((id) => id !== participantId);
    }
    item.votes.push(participantId);
    room.votesByParticipant.set(participantId, videoId);
    room.state.revision += 1;
    room.state.updatedAt = Date.now();
    return true;
  }

  addChat(room, participant, text) {
    room.chat.push({
      id: crypto.randomUUID(),
      participantId: participant.id,
      user: participant.name,
      text,
      time: new Date().toISOString(),
    });
    room.chat = room.chat.slice(-MAX_MESSAGES);
  }

  addReaction(room, participant, emoji) {
    room.reactions.push({
      id: crypto.randomUUID(),
      participantId: participant.id,
      name: participant.name,
      emoji,
      time: new Date().toISOString(),
    });
    room.reactions = room.reactions.slice(-MAX_REACTIONS);
  }

  get(roomId) {
    return this.rooms.get(roomId);
  }

  snapshot(room) {
    const position = room.state.status === 'playing'
      ? room.state.position + (Date.now() - room.state.updatedAt) / 1000
      : room.state.position;
    return {
      id: room.id,
      roomName: room.roomName,
      hostId: room.hostId,
      participants: Array.from(room.participants.values(), publicParticipant),
      chat: room.chat.map((message) => ({ ...message })),
      reactions: room.reactions.map((reaction) => ({ ...reaction })),
      playlist: room.playlist.map((item) => ({ ...item, votes: [...item.votes] })),
      state: { ...room.state, position },
      serverTime: Date.now(),
    };
  }

  close() {
    for (const timer of this.disconnectTimers.values()) clearTimeout(timer);
    this.disconnectTimers.clear();
  }
}

module.exports = { RoomManager, makeRoomCode };
