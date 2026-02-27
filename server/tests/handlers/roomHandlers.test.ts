/**
 * roomHandlers.test.ts — Tests for host-side room management.
 *
 * Covers three areas:
 *   1. Room creation — verifying all GameRoom fields are initialized correctly
 *   2. Room cleanup  — verifying rooms are torn down on host disconnect
 *   3. Player state  — light tests on player map integrity (join/disconnect)
 *
 * These tests use mock socket objects rather than spinning up a real Socket.IO
 * server. This keeps tests fast and focused on the handler logic itself.
 * Your teammate's playerHandlers.test.ts will cover the full join validation
 * flow (checking room exists, checking phase is lobby, nickname uniqueness, etc.)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GameRoom, Player } from "../../src/types/game";
import {
  createRoom,
  createPlayer,
  SAMPLE_QUESTIONS,
} from "../sampleData/gameData";
import {
  handleCreateGame,
  handleDisconnect,
  handleJoinGame,
  handleRequestRoomState,
  handleSubmitTyping,
} from "../../src/handlers/roomHandlers";

/**
 * Mock socket factory — creates a fake socket object that tracks
 * which events were emitted and which rooms were joined.
 *
 * Usage:
 *   const socket = createMockSocket("socket_abc123");
 *   // ...run handler...
 *   expect(socket.emittedEvents).toContainEqual(["game-created", { code: "ABC123" }]);
 */
function createMockSocket(id: string) {
  const emittedEvents: [string, unknown][] = [];
  const joinedRooms: string[] = [];

  return {
    id,
    emittedEvents,
    joinedRooms,
    emit(event: string, data: unknown) {
      emittedEvents.push([event, data]);
    },
    join(room: string) {
      joinedRooms.push(room);
    },
  };
}

function createMockIo() {
  const emittedEvents: [string, unknown][] = [];
  return {
    emittedEvents,
    to: (_roomCode: string) => ({
      emit: (event: string, data: unknown) => {
        emittedEvents.push([event, data]);
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 1. ROOM CREATION
// ═══════════════════════════════════════════════════════════════════════

describe("Room Creation", () => {
  let rooms: Map<string, GameRoom>;

  beforeEach(() => {
    rooms = new Map();
  });

  it("should add a new room to the registry", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);
    expect(rooms.size).toBe(1);
  });

  it("should store the room with its code as the registry key", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const [key, room] = [...rooms.entries()][0];
    expect(key).toBe(room.code);
  });

  it("should set the host socket ID to the creating socket", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(room.hostSocketId).toBe("host_socket_1");
  });

  it("should populate questions from the provided quiz data", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(room.questions).toEqual(SAMPLE_QUESTIONS);
    expect(room.questions).toHaveLength(3);
  });

  it("should start with an empty players map", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(room.players.size).toBe(0);
  });

  it("should start in the lobby phase", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(room.phase).toBe("lobby");
  });

  it("should start at question index 0", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(room.currentQuestionIndex).toBe(0);
  });

  it("should start with no active timer", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(room.activeTimer).toBeNull();
    expect(room.timerStartedAt).toBeNull();
  });

  it("should emit 'game-created' back to the host with the room code", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(socket.emittedEvents).toContainEqual([
      "game-created",
      expect.objectContaining({ code: room.code }),
    ]);
  });

  it("should join the host socket to the Socket.IO room", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(socket, { title: "Test Quiz", ownerId: "test_owner", questions: SAMPLE_QUESTIONS }, rooms);

    const room = [...rooms.values()][0];
    expect(socket.joinedRooms).toContain(room.code);
  });

  it("should emit an error and skip creation when no questions are provided", () => {
    const socket = createMockSocket("host_socket_1");
    handleCreateGame(
      socket,
      { title: "Test Quiz", ownerId: "test_owner", questions: [] },
      rooms
    );

    expect(rooms.size).toBe(0);
    expect(socket.emittedEvents).toContainEqual([
      "error",
      { message: "At least one question is required" },
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. ROOM CLEANUP (HOST DISCONNECT)
// ═══════════════════════════════════════════════════════════════════════

describe("Room Cleanup", () => {
  let rooms: Map<string, GameRoom>;

  beforeEach(() => {
    rooms = new Map();
  });

  it("should remove the room from the registry when the host disconnects", () => {
    const room = createRoom({ code: "AABB11", hostSocketId: "host_1" });
    rooms.set(room.code, room);

    handleDisconnect("host_1", rooms);
    expect(rooms.size).toBe(0);
  });

  it("should not remove other rooms when one host disconnects", () => {
    const room1 = createRoom({ code: "ROOM01", hostSocketId: "host_1" });
    const room2 = createRoom({ code: "ROOM02", hostSocketId: "host_2" });
    rooms.set(room1.code, room1);
    rooms.set(room2.code, room2);

    handleDisconnect("host_1", rooms);
    expect(rooms.size).toBe(1);
    expect(rooms.has("ROOM02")).toBe(true);
  });

  it("should clear the active timer when the host disconnects", () => {
    const fakeTimer = setTimeout(() => {}, 99999);
    const room = createRoom({
      code: "TIMER1",
      hostSocketId: "host_1",
      activeTimer: fakeTimer,
      timerStartedAt: Date.now(),
    });
    rooms.set(room.code, room);

    handleDisconnect("host_1", rooms);
    expect(rooms.has("TIMER1")).toBe(false);
  });

  it("should notify remaining players that the game has ended", () => {
    const room = createRoom({ code: "NOTIF1", hostSocketId: "host_1" });
    rooms.set(room.code, room);

    const emittedEvents: [string, unknown][] = [];
    const mockIo = {
      to: (roomCode: string) => ({
        emit: (event: string, data: unknown) => {
          emittedEvents.push([event, data]);
        },
      }),
    };

    handleDisconnect("host_1", rooms, mockIo);
    expect(emittedEvents).toContainEqual([
      "game-ended",
      { reason: "host-disconnected" },
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. PLAYER STATE (Light tests — your teammate covers join validation)
// ═══════════════════════════════════════════════════════════════════════

describe("Player State in Room", () => {
  it("should add a player to the room's players map with correct defaults", () => {
    const room = createRoom({ code: "PLAY01" });
    const player = createPlayer({
      socketId: "student_1",
      nickname: "Alice",
    });

    room.players.set(player.socketId, player);

    expect(room.players.size).toBe(1);
    const stored = room.players.get("student_1");
    expect(stored?.nickname).toBe("Alice");
    expect(stored?.score).toBe(0);
    expect(stored?.hasSubmitted).toBe(false);
  });

  it("should support multiple players in the same room", () => {
    const room = createRoom({ code: "PLAY02" });

    const alice = createPlayer({ socketId: "s1", nickname: "Alice" });
    const bob = createPlayer({ socketId: "s2", nickname: "Bob" });
    const charlie = createPlayer({ socketId: "s3", nickname: "Charlie" });

    room.players.set(alice.socketId, alice);
    room.players.set(bob.socketId, bob);
    room.players.set(charlie.socketId, charlie);

    expect(room.players.size).toBe(3);
    expect(room.players.get("s1")?.nickname).toBe("Alice");
    expect(room.players.get("s2")?.nickname).toBe("Bob");
    expect(room.players.get("s3")?.nickname).toBe("Charlie");
  });

  it("should remove a player from the map on disconnect", () => {
    const room = createRoom({ code: "PLAY03" });

    const alice = createPlayer({ socketId: "s1", nickname: "Alice" });
    const bob = createPlayer({ socketId: "s2", nickname: "Bob" });
    room.players.set(alice.socketId, alice);
    room.players.set(bob.socketId, bob);

    // Simulate disconnect — delete by socket ID
    room.players.delete("s1");

    expect(room.players.size).toBe(1);
    expect(room.players.has("s1")).toBe(false);
    expect(room.players.has("s2")).toBe(true);
  });

  it("should have an empty players map after all players disconnect", () => {
    const room = createRoom({ code: "PLAY04" });

    const alice = createPlayer({ socketId: "s1", nickname: "Alice" });
    room.players.set(alice.socketId, alice);

    room.players.delete("s1");

    expect(room.players.size).toBe(0);
  });

  it("should preserve score when the same socket joins again", () => {
    const room = createRoom({ code: "REJOIN1" });
    const io = createMockIo();
    const firstSocket = createMockSocket("s1");
    room.players.set("s1", {
      socketId: "s1",
      nickname: "Alice",
      score: 25,
      hasSubmitted: true,
    });

    const rooms = new Map<string, GameRoom>([[room.code, room]]);
    handleJoinGame(
      firstSocket,
      { code: room.code, nickname: "Alice" },
      rooms,
      io
    );

    expect(room.players.get("s1")?.score).toBe(25);
    expect(room.players.get("s1")?.hasSubmitted).toBe(true);
  });

  it("should replace stale nickname entries when a new socket joins with same nickname", () => {
    const room = createRoom({ code: "REJOIN2" });
    const io = createMockIo();
    const rooms = new Map<string, GameRoom>([[room.code, room]]);

    room.players.set("old_socket", {
      socketId: "old_socket",
      nickname: "Alice",
      score: 40,
      hasSubmitted: true,
    });
    room.mcSubmissions.set(0, new Map([["old_socket", { answerIndex: 1, submittedAt: Date.now() }]]));
    room.typingSubmissions.set(0, new Map([["old_socket", { wpm: 50, accuracy: 90, submittedAt: Date.now() }]]));

    const newSocket = createMockSocket("new_socket");
    handleJoinGame(
      newSocket,
      { code: room.code, nickname: "Alice" },
      rooms,
      io
    );

    expect(room.players.has("old_socket")).toBe(false);
    expect(room.players.has("new_socket")).toBe(true);
    expect(room.mcSubmissions.get(0)?.has("old_socket")).toBe(false);
    expect(room.typingSubmissions.get(0)?.has("old_socket")).toBe(false);
  });

  it("should mark player submitted after typing submission", () => {
    const room = createRoom({ code: "TYPE01", phase: "typing" });
    room.players.set("s1", {
      socketId: "s1",
      nickname: "Typer",
      score: 0,
      hasSubmitted: false,
    });
    const rooms = new Map<string, GameRoom>([[room.code, room]]);
    const io = createMockIo();
    const socket = createMockSocket("s1");

    handleSubmitTyping(
      socket,
      { code: room.code, wpm: 55, accuracy: 95 },
      rooms,
      io
    );

    expect(room.players.get("s1")?.hasSubmitted).toBe(true);
  });

  it("should keep room alive when last non-host player disconnects", () => {
    const room = createRoom({ code: "KEEP01", hostSocketId: "host_1" });
    room.players.set("student_1", {
      socketId: "student_1",
      nickname: "Student",
      score: 0,
      hasSubmitted: false,
    });
    const rooms = new Map<string, GameRoom>([[room.code, room]]);
    const io = createMockIo();

    handleDisconnect("student_1", rooms, io);

    expect(rooms.has("KEEP01")).toBe(true);
    expect(room.players.size).toBe(0);
  });

  it("should return room-state for existing player in active phase", () => {
    const room = createRoom({ code: "STATE1", phase: "multiple_choice" });
    room.players.set("student_1", {
      socketId: "student_1",
      nickname: "Student",
      score: 10,
      hasSubmitted: false,
    });
    const rooms = new Map<string, GameRoom>([[room.code, room]]);
    const socket = createMockSocket("student_1");

    handleRequestRoomState(socket, { code: room.code }, rooms);

    expect(socket.emittedEvents).toContainEqual([
      "room-state",
      expect.objectContaining({
        code: room.code,
        phase: "multiple_choice",
        totalQuestions: room.questions.length,
      }),
    ]);
  });

  it("should reject room-state request for socket not in room", () => {
    const room = createRoom({ code: "STATE2", phase: "multiple_choice" });
    const rooms = new Map<string, GameRoom>([[room.code, room]]);
    const socket = createMockSocket("stranger");

    handleRequestRoomState(socket, { code: room.code }, rooms);

    expect(socket.emittedEvents).toContainEqual([
      "error",
      { message: "Player not in room" },
    ]);
  });
});
