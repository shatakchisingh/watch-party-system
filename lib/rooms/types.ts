export type PlaybackStatus = 'playing' | 'paused';

export type Participant = {
  id: string;
  name: string;
  avatar: string;
  connected: boolean;
};

export type RoomVideo = {
  id: string;
  title: string;
  source: string | null;
  submittedBy: string;
  votes: string[];
};

export type ChatMessage = {
  id: string;
  participantId: string;
  user: string;
  text: string;
  time: string;
};

export type RoomReaction = {
  id: string;
  participantId: string;
  name: string;
  emoji: string;
  time: string;
};

export type PlaybackState = {
  videoId: string | null;
  title: string;
  source: string | null;
  status: PlaybackStatus;
  position: number;
  updatedAt: number;
  revision: number;
};

export type RoomSnapshot = {
  id: string;
  roomName: string;
  hostId: string;
  participants: Participant[];
  chat: ChatMessage[];
  reactions: RoomReaction[];
  playlist: RoomVideo[];
  state: PlaybackState;
  serverTime: number;
};

export type ClientToServerEvents = {
  'join-room': (payload: { roomId: string; guestId: string; name: string }) => void;
  'chat-message': (payload: { roomId: string; message: string }) => void;
  reaction: (payload: { roomId: string; emoji: string }) => void;
  'playback-command': (payload: { roomId: string; action: PlaybackStatus; position: number; commandId: number }) => void;
  seek: (payload: { roomId: string; position: number; commandId: number }) => void;
  'change-video': (payload: { roomId: string; videoId: string; title: string; source: string | null; commandId: number }) => void;
  'suggest-video': (payload: { roomId: string; videoId: string; title: string; source: string | null }) => void;
  'vote-video': (payload: { roomId: string; videoId: string }) => void;
  'transfer-host': (payload: { roomId: string; participantId: string }) => void;
};

export type ServerToClientEvents = {
  'room-state': (room: RoomSnapshot) => void;
  'room-error': (payload: { message: string }) => void;
};
