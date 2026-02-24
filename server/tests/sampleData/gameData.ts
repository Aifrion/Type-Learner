/**
Sample data used for the purpose of testing
 */

import { Question, Player, GameRoom, Phase } from "../../src/types/game";

// Sample Questions

export const SAMPLE_QUESTIONS: Question[] = [
  {
    text: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "Hot Mail",
      "How To Make Lasagna",
      "Hyper Tool Multi Language",
    ],
    correctAnswerIndex: 0,
    correctAnswerText: "Hyper Text Markup Language",
  },
  {
    text: "Which keyword declares a constant in JavaScript?",
    options: ["var", "let", "const", "fixed"],
    correctAnswerIndex: 2,
    correctAnswerText: "const",
  },
  {
    text: "What does CSS stand for?",
    options: [
      "Computer Style Sheets",
      "Cascading Style Sheets",
      "Creative Style System",
      "Colorful Style Sheets",
    ],
    correctAnswerIndex: 1,
    correctAnswerText: "Cascading Style Sheets",
  },
];

// Player Factory

/**
 Create a sample player
 Usage:
 createPlayer({ nickname: "Alice", socketId: "socket_1" })
 */
export function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    socketId: overrides.socketId ?? "default_socket_id",
    nickname: overrides.nickname ?? "TestPlayer",
    score: overrides.score ?? 0,
    hasSubmitted: overrides.hasSubmitted ?? false,
  };
}

// Room Factory

/**
  Creates a GameRoom with sensible defaults matching a freshly created room.
  The room starts in lobby phase with no players, no timer, and the sample
  questions loaded.

  Usage:
    createRoom({ code: "ABC123", hostSocketId: "host_socket" })
 */
export function createRoom(
  overrides: Partial<GameRoom> = {}
): GameRoom {
  const room = new GameRoom(
    overrides.code ?? "TEST01",
    overrides.hostSocketId ?? "host_default_socket",
    overrides.questions ?? [...SAMPLE_QUESTIONS]
  );

  if (overrides.players) room.players = overrides.players;
  if (overrides.phase !== undefined) room.phase = overrides.phase;
  if (overrides.currentQuestionIndex !== undefined)
    room.currentQuestionIndex = overrides.currentQuestionIndex;
  if (overrides.activeTimer !== undefined)
    room.activeTimer = overrides.activeTimer;
  if (overrides.timerStartedAt !== undefined)
    room.timerStartedAt = overrides.timerStartedAt;

  return room;
}

// Safe Character Set
/**
  The set of characters allowed in room codes.
  Excludes ambiguous characters: O, I, L, 0, 1
  Exported so codeGenerator tests can validate against it.
 */
export const SAFE_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
