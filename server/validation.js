const { z } = require('zod');

const supportedVideoSource = z.string().url().max(2048).refine((value) => {
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
  source: supportedVideoSource.nullable(),
});
const transferHostSchema = roomPayloadSchema.extend({ participantId: z.string().uuid() });
const voteSchema = roomPayloadSchema.extend({ videoId: z.string().trim().min(1).max(100) });

module.exports = {
  chatSchema,
  createRoomSchema,
  joinRoomSchema,
  playbackSchema,
  reactionSchema,
  roomPayloadSchema,
  seekSchema,
  transferHostSchema,
  videoSchema,
  voteSchema,
};
