import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameRoom } from "../../src/types/game";
import { SAMPLE_QUESTIONS } from "../sampleData/gameData";
import {
  getLeaderboard,
  handleJoinGame,
  handleStartGame,
  handleSubmitScore,
} from "../../src/handlers/roomHandlers";

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
  const emitted: { room: string; event: string; data: unknown }[] = [];

  return {
    emitted,
    to(room: string) {
      return {
        emit(event: string, data: unknown) {
          emitted.push({ room, event, data });
        },
      };
    },
  };
}

describe("game flow handlers", () => {
  let rooms: Map<string, GameRoom>;

  beforeEach(() => {
    rooms = new Map();
  });

  it("adds a student to the lobby and broadcasts room-state sync", () => {
    const room = new GameRoom("ROOM01", "host_socket", SAMPLE_QUESTIONS);
    rooms.set(room.code, room);

    const student = createMockSocket("student_socket");
    const io = createMockIo();

    handleJoinGame(student, { code: room.code, nickname: "Ada" }, rooms, io);

    expect(room.players.get("student_socket")?.nickname).toBe("Ada");
    expect(student.joinedRooms).toContain("ROOM01");
    expect(
      io.emitted.some((entry) => entry.room === "ROOM01" && entry.event === "room-state")
    ).toBe(true);
  });

  it("allows the host to start the game and transition to multiple_choice", () => {
    const room = new GameRoom("ROOM01", "host_socket", SAMPLE_QUESTIONS);
    room.addPlayer({
      socketId: "student_socket",
      nickname: "Ada",
      score: 0,
      hasSubmitted: false,
    });
    rooms.set(room.code, room);

    const host = createMockSocket("host_socket");
    const io = createMockIo();

    handleStartGame(host, { code: room.code }, rooms, io);

    expect(room.phase).toBe("multiple_choice");
    expect(
      io.emitted.some(
        (entry) =>
          entry.room === "ROOM01" &&
          entry.event === "game-started" &&
          entry.data &&
          typeof entry.data === "object"
      )
    ).toBe(true);
  });

  it("blocks non-host users from starting the game", () => {
    const room = new GameRoom("ROOM01", "host_socket", SAMPLE_QUESTIONS);
    rooms.set(room.code, room);

    const student = createMockSocket("student_socket");
    const io = createMockIo();

    handleStartGame(student, { code: room.code }, rooms, io);

    expect(room.phase).toBe("lobby");
    expect(student.emittedEvents).toContainEqual([
      "start-game-error",
      { message: "Only the host can start the game." },
    ]);
  });

  it("updates scores, emits leaderboard updates, and transitions to scoreboard after all submissions", () => {
    const room = new GameRoom("ROOM01", "host_socket", SAMPLE_QUESTIONS);
    room.phase = "multiple_choice";
    room.addPlayer({
      socketId: "s1",
      nickname: "Ada",
      score: 0,
      hasSubmitted: false,
    });
    room.addPlayer({
      socketId: "s2",
      nickname: "Ben",
      score: 0,
      hasSubmitted: false,
    });
    rooms.set(room.code, room);

    const studentOne = createMockSocket("s1");
    const studentTwo = createMockSocket("s2");
    const io = createMockIo();
    const persistScores = vi.fn();

    handleSubmitScore(
      studentOne,
      {
        code: room.code,
        isCorrect: true,
        typingSpeed: 72,
        accuracy: 94,
      },
      rooms,
      io,
      persistScores
    );

    expect(room.phase).toBe("multiple_choice");
    expect(room.players.get("s1")?.score).toBeGreaterThan(0);

    handleSubmitScore(
      studentTwo,
      {
        code: room.code,
        isCorrect: true,
        typingSpeed: 60,
        accuracy: 85,
      },
      rooms,
      io,
      persistScores
    );

    expect(room.phase).toBe("scoreboard");
    expect(persistScores).toHaveBeenCalledTimes(2);

    const leaderboard = getLeaderboard(room);
    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0].score).toBeGreaterThanOrEqual(leaderboard[1].score);
    expect(io.emitted.some((entry) => entry.event === "leaderboard-updated")).toBe(true);
    expect(io.emitted.some((entry) => entry.event === "phase-changed")).toBe(true);
  });
});
