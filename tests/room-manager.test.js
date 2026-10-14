import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { RoomManager } = require('../lib/rooms/room-manager');

const hostGuest = { guestId: '0196c100-0000-7000-8000-000000000001', name: 'Host' };
const friendGuest = { guestId: '0196c100-0000-7000-8000-000000000002', name: 'Friend' };

describe('in-memory room manager', () => {
  let manager;

  afterEach(() => manager?.close());

  it('creates unique joinable rooms and returns the current playback snapshot to late joiners', () => {
    manager = new RoomManager();
    const created = manager.create(hostGuest);
    const secondRoom = manager.create({ ...friendGuest, roomName: 'Movie night' });

    expect(created.id).toMatch(/^[A-Z0-9]{6}$/);
    expect(secondRoom.id).not.toBe(created.id);

    manager.join(created.id, hostGuest);
    const room = manager.get(created.id);
    manager.changeVideo(room, {
      videoId: 'clip',
      title: 'A shared clip',
      source: 'https://example.com/clip.mp4',
      submittedBy: hostGuest.guestId,
    });
    manager.setPlayback(room, 'playing', 48);

    const lateJoin = manager.join(created.id, friendGuest);
    expect(lateJoin.snapshot.state.title).toBe('A shared clip');
    expect(lateJoin.snapshot.state.status).toBe('playing');
    expect(lateJoin.snapshot.state.position).toBeGreaterThanOrEqual(48);
    expect(lateJoin.snapshot.participants).toHaveLength(2);
  });

  it('supports playlist suggestions, one-vote-per-guest polls, and host transfer', () => {
    manager = new RoomManager();
    const created = manager.create(hostGuest);
    manager.join(created.id, hostGuest);
    manager.join(created.id, friendGuest);
    const room = manager.get(created.id);

    expect(manager.suggestVideo(room, {
      videoId: 'suggestion',
      title: 'Suggested clip',
      source: null,
      submittedBy: friendGuest.guestId,
    })).toBe(true);
    expect(manager.vote(room, 'suggestion', hostGuest.guestId)).toBe(true);
    expect(manager.vote(room, 'suggestion', hostGuest.guestId)).toBe(false);
    expect(room.playlist[0].votes).toEqual([hostGuest.guestId]);

    expect(manager.transferHost(room, hostGuest.guestId, friendGuest.guestId)).toBe(true);
    expect(room.hostId).toBe(friendGuest.guestId);
    expect(manager.transferHost(room, hostGuest.guestId, friendGuest.guestId)).toBe(false);
  });

  it('keeps a reconnecting participant during the grace period and cleans up an empty room', async () => {
    manager = new RoomManager({ reconnectGraceMs: 25 });
    const created = manager.create(hostGuest);
    manager.join(created.id, hostGuest);
    manager.join(created.id, friendGuest);

    manager.disconnect(created.id, friendGuest.guestId);
    expect(manager.snapshot(manager.get(created.id)).participants.find((person) => person.id === friendGuest.guestId)?.connected).toBe(false);
    expect(manager.transferHost(manager.get(created.id), hostGuest.guestId, friendGuest.guestId)).toBe(false);

    manager.join(created.id, friendGuest);
    await new Promise((resolve) => setTimeout(resolve, 45));
    expect(manager.get(created.id).participants.has(friendGuest.guestId)).toBe(true);

    manager.disconnect(created.id, hostGuest.guestId);
    manager.disconnect(created.id, friendGuest.guestId);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(manager.get(created.id)).toBeUndefined();
  });
});
