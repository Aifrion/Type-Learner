import {
  GameRoom,
  Player,
  Question,
  AnswerRecord,
  TypingRecord,
} from "../types/game";
import { generateRoomCode } from "../utils/codeGenerator";
import { calculateScore } from "../utils/score";

interface CreateGameData {
  title: string;
  ownerId: string;
  questions: Question[];
}

interface JoinGameData {
  code: string;
  nickname: string;
}

interface StartGameData {
  code: string;
}

interface SubmitMCData {
  code: string;
  answerIndex: number;
}

interface SubmitTypingData {
  code: string;
  wpm: number;
  accuracy: number;
}

interface SubmitScoreData {
  code: string;
  isCorrect: boolean;
  typingSpeed: number;
  accuracy: number;
}

interface RequestRoomStateData {
  code: string;
}

interface Socket {
  id: string;
  emit(event: string, data: unknown): void;
  join(room: string): void;
}

interface IO {
  to(room: string): { emit(event: string, data: unknown): void };
}

export interface LeaderboardEntry {
  socketId: string;
  nickname: string;
  score: number;
  rank: number;
}

type PersistRoomScores = (
  roomCode: string,
  leaderboard: LeaderboardEntry[],
) => Promise<void> | void;

const MC_DURATION_MS = 15_000;
const TYPING_DURATION_MS = 30_000;

function normalizeNickname(rawNickname: string): string {
  return rawNickname.trim().replace(/\s+/g, " ");
}

function getUniqueNickname(
  room: GameRoom,
  requestedNickname: string,
  socketId: string,
): string {
  const normalizedNickname = normalizeNickname(requestedNickname);
  const usedNicknames = new Set(
    Array.from(room.players.values())
      .filter((player) => player.socketId !== socketId)
      .map((player) => player.nickname.toLowerCase()),
  );

  if (!usedNicknames.has(normalizedNickname.toLowerCase())) {
    return normalizedNickname;
  }

  // Strip trailing numeric suffix so "Name 2" conflicts still produce "Name 3".
  const baseNickname =
    normalizedNickname.replace(/\s+\d+$/, "") || normalizedNickname;

  let suffix = 2;
  let candidateNickname = `${baseNickname} ${suffix}`;
  while (usedNicknames.has(candidateNickname.toLowerCase())) {
    suffix += 1;
    candidateNickname = `${baseNickname} ${suffix}`;
  }

  return candidateNickname;
}

function setPhaseTimer(
  room: GameRoom,
  io: IO,
  durationMs: number,
  next: () => void,
) {
  room.clearTimer();
  room.phaseDurationMs = durationMs;
  room.timerStartedAt = Date.now();
  room.activeTimer = setTimeout(next, durationMs);
  broadcastState(io, room);
}

function toRoomState(room: GameRoom) {
  return {
    code: room.code,
    phase: room.phase,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
    question: room.questions[room.currentQuestionIndex] ?? null,
    players: Array.from(room.players.values()),
    timerStartedAt: room.timerStartedAt,
    phaseDurationMs: room.phaseDurationMs,
  };
}

function broadcastState(io: IO, room: GameRoom) {
  io.to(room.code).emit("room-state", toRoomState(room));
}

export function getLeaderboard(room: GameRoom): LeaderboardEntry[] {
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
    .map((player, index) => ({
      socketId: player.socketId,
      nickname: player.nickname,
      score: player.score,
      rank: index + 1,
    }));
}

function resetPlayerSubmissionState(room: GameRoom) {
  for (const player of room.players.values()) {
    player.hasSubmitted = false;
  }
}

function removePlayerSubmissions(room: GameRoom, socketId: string) {
  for (const submissions of room.mcSubmissions.values()) {
    submissions.delete(socketId);
  }
  for (const submissions of room.typingSubmissions.values()) {
    submissions.delete(socketId);
  }
}

function everyoneHasSubmitted(room: GameRoom): boolean {
  if (room.players.size === 0) return false;
  for (const player of room.players.values()) {
    if (!player.hasSubmitted) return false;
  }
  return true;
}

function removePlayerFromRoom(room: GameRoom, socketId: string) {
  room.removePlayer(socketId);
  removePlayerSubmissions(room, socketId);
}

// ── Room lifecycle ──────────────────────────────────────────────────

export function handleCreateGame(
  socket: Socket,
  data: CreateGameData,
  rooms: Map<string, GameRoom>,
): void {
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    socket.emit("error", { message: "At least one question is required" });
    return;
  }
  const code = generateRoomCode(rooms);
  const room = new GameRoom(
    code,
    socket.id,
    data.title,
    data.ownerId,
    data.questions,
  );
  rooms.set(code, room);
  socket.join(code);
  socket.emit("game-created", { code });
  socket.emit("room-state", toRoomState(room));
}

export function handleSubmitScore(
  socket: Socket,
  data: SubmitScoreData,
  rooms: Map<string, GameRoom>,
  io: IO,
  persistRoomScores?: PersistRoomScores,
): void {
  const room = rooms.get(data.code);

  if (!room) {
    socket.emit("score-error", { message: "Room not found." });
    return;
  }

  const player = room.players.get(socket.id);
  if (!player) {
    socket.emit("score-error", { message: "Player not found in room." });
    return;
  }

  if (player.hasSubmitted) {
    socket.emit("score-submitted", {
      accepted: false,
      reason: "already-submitted",
    });
    return;
  }

  const earnedScore = calculateScore({
    isCorrect: data.isCorrect,
    typingSpeed: data.typingSpeed,
    accuracy: data.accuracy,
  });

  player.score += earnedScore;
  player.hasSubmitted = true;

  const allSubmitted =
    room.players.size > 0 && [...room.players.values()].every((entry) => entry.hasSubmitted);

  if (allSubmitted) {
    room.phase = "scoreboard";
    room.players.forEach((entry) => {
      entry.hasSubmitted = false;
    });
  }

  const leaderboard = getLeaderboard(room);

  socket.emit("score-submitted", {
    accepted: true,
    earnedScore,
    totalScore: player.score,
  });

  io.to(room.code).emit("leaderboard-updated", {
    code: room.code,
    phase: room.phase,
    leaderboard,
  });

  if (persistRoomScores) {
    void Promise.resolve(persistRoomScores(room.code, leaderboard)).catch(() => {
      // Persistence failures should not block gameplay event flow.
    });
  }

  broadcastState(io, room);

  if (allSubmitted) {
    io.to(room.code).emit("phase-changed", { phase: room.phase });
  }
}

export function handleJoinGame(
  socket: Socket,
  data: JoinGameData,
  rooms: Map<string, GameRoom>,
  io: IO,
): void {
  const room = rooms.get(data.code);
  const nickname = data.nickname ? normalizeNickname(data.nickname) : "";

  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }
  if (!nickname) {
    socket.emit("error", { message: "Nickname is required" });
    return;
  }

  if (room.phase !== "lobby") {
    socket.emit("error", { message: "Game already in progress" });
    return;
  }

  const uniqueNickname = getUniqueNickname(room, nickname, socket.id);

  const existingPlayer = room.players.get(socket.id);
  if (existingPlayer) {
    existingPlayer.nickname = uniqueNickname;
  } else {
    const player: Player = {
      socketId: socket.id,
      nickname: uniqueNickname,
      score: 0,
      hasSubmitted: false,
    };
    room.addPlayer(player);
  }

  socket.join(data.code);
  broadcastState(io, room);
}

// ── Game flow ───────────────────────────────────────────────────────

export function handleStartGame(
  socket: Socket,
  data: StartGameData,
  rooms: Map<string, GameRoom>,
  io: IO,
): void {
  const room = rooms.get(data.code);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }
  if (room.hostSocketId !== socket.id) {
    socket.emit("error", { message: "Only host can start the game" });
    return;
  }
  if (room.phase !== "lobby") {
    socket.emit("error", { message: "Game is not ready" });
    return;
  }
  room.phase = "multiple_choice";
  room.currentQuestionIndex = 0;
  resetPlayerSubmissionState(room);
  io.to(room.code).emit("game-started", { code: room.code, phase: room.phase });
  setPhaseTimer(room, io, MC_DURATION_MS, () =>
    advanceToNextPhase(room, io)
  );
}

export function handleSubmitMultipleChoice(
  socket: Socket,
  data: SubmitMCData,
  rooms: Map<string, GameRoom>,
  io: IO,
): void {
  const room = rooms.get(data.code);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }
  if (room.phase !== "multiple_choice") {
    socket.emit("error", {
      message: "Not accepting multiple choice answers now",
    });
    return;
  }
  if (
    !Number.isInteger(data.answerIndex) ||
    data.answerIndex < 0 ||
    data.answerIndex >= room.questions[room.currentQuestionIndex].options.length
  ) {
    socket.emit("error", { message: "Invalid answer option" });
    return;
  }
  const player = room.players.get(socket.id);
  if (!player) {
    socket.emit("error", { message: "Player not in room" });
    return;
  }
  const existing = room.mcSubmissions
    .get(room.currentQuestionIndex)
    ?.get(socket.id);
  if (existing) {
    socket.emit("error", { message: "Answer already submitted" });
    return;
  }

  const record: AnswerRecord = {
    answerIndex: data.answerIndex,
    submittedAt: Date.now(),
  };
  if (!room.mcSubmissions.has(room.currentQuestionIndex)) {
    room.mcSubmissions.set(room.currentQuestionIndex, new Map());
  }
  room.mcSubmissions.get(room.currentQuestionIndex)!.set(socket.id, record);
  player.hasSubmitted = true;
  broadcastState(io, room);
  if (everyoneHasSubmitted(room)) {
    room.clearTimer();
    advanceToNextPhase(room, io);
  }
}

export function handleSubmitTyping(
  socket: Socket,
  data: SubmitTypingData,
  rooms: Map<string, GameRoom>,
  io: IO,
): void {
  const room = rooms.get(data.code);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }
  if (room.phase !== "typing") {
    socket.emit("error", { message: "Not accepting typing submissions now" });
    return;
  }
  if (!Number.isFinite(data.wpm) || data.wpm < 0) {
    socket.emit("error", { message: "Invalid wpm value" });
    return;
  }
  if (!Number.isFinite(data.accuracy) || data.accuracy < 0 || data.accuracy > 100) {
    socket.emit("error", { message: "Invalid accuracy value" });
    return;
  }
  const player = room.players.get(socket.id);
  if (!player) {
    socket.emit("error", { message: "Player not in room" });
    return;
  }
  const existing = room.typingSubmissions
    .get(room.currentQuestionIndex)
    ?.get(socket.id);
  if (existing) {
    socket.emit("error", { message: "Typing already submitted" });
    return;
  }

  const record: TypingRecord = {
    wpm: data.wpm,
    accuracy: data.accuracy,
    submittedAt: Date.now(),
  };
  if (!room.typingSubmissions.has(room.currentQuestionIndex)) {
    room.typingSubmissions.set(room.currentQuestionIndex, new Map());
  }
  room.typingSubmissions.get(room.currentQuestionIndex)!.set(socket.id, record);
  player.hasSubmitted = true;
  broadcastState(io, room);
  if (everyoneHasSubmitted(room)) {
    room.clearTimer();
    advanceToNextPhase(room, io);
  }
}

export function handleAdvancePhase(
  socket: Socket,
  code: string,
  rooms: Map<string, GameRoom>,
  io: IO,
): void {
  const room = rooms.get(code);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }
  if (room.hostSocketId !== socket.id) {
    socket.emit("error", { message: "Only host can advance phase" });
    return;
  }
  if (room.phase === "completed") {
    socket.emit("error", { message: "Game already completed" });
    return;
  }
  advanceToNextPhase(room, io);
}

export function handleRequestRoomState(
  socket: Socket,
  data: RequestRoomStateData,
  rooms: Map<string, GameRoom>,
): void {
  const room = rooms.get(data.code);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }

  const isHost = room.hostSocketId === socket.id;
  const isPlayer = room.players.has(socket.id);
  if (!isHost && !isPlayer) {
    socket.emit("error", { message: "Player not in room" });
    return;
  }

  socket.join(room.code);
  socket.emit("room-state", toRoomState(room));
}

// ── Scoring ─────────────────────────────────────────────────────────

function scoreMultipleChoice(room: GameRoom) {
  const answers = room.mcSubmissions.get(room.currentQuestionIndex);
  if (!answers) return;
  for (const [socketId, record] of answers.entries()) {
    const player = room.players.get(socketId);
    if (!player) continue;
    const correct =
      record.answerIndex ===
      room.questions[room.currentQuestionIndex]?.correctOptionIndex;
    if (correct) player.score += 10;
  }
}

function scoreTyping(room: GameRoom) {
  const typing = room.typingSubmissions.get(room.currentQuestionIndex);
  if (!typing) return;
  for (const [socketId, record] of typing.entries()) {
    const player = room.players.get(socketId);
    if (!player) continue;
    const score = Math.round(record.wpm * (record.accuracy / 100));
    player.score += score;
  }
}

function advanceToNextPhase(room: GameRoom, io: IO) {
  if (room.phase === "multiple_choice") {
    scoreMultipleChoice(room);
    room.phase = "typing";
    resetPlayerSubmissionState(room);
    setPhaseTimer(room, io, TYPING_DURATION_MS, () =>
      advanceToNextPhase(room, io),
    );
    return;
  }

  if (room.phase === "typing") {
    scoreTyping(room);
    if (room.currentQuestionIndex < room.questions.length - 1) {
      room.currentQuestionIndex += 1;
      room.phase = "multiple_choice";
      resetPlayerSubmissionState(room);
      setPhaseTimer(room, io, MC_DURATION_MS, () =>
        advanceToNextPhase(room, io),
      );
    } else {
      room.phase = "completed";
      room.clearTimer();
      io.to(room.code).emit("leaderboard-updated", {
        code: room.code,
        phase: room.phase,
        leaderboard: getLeaderboard(room),
      });
      broadcastState(io, room);
    }
  }
}

// ── Disconnect ──────────────────────────────────────────────────────

export function handleDisconnect(
  socketId: string,
  rooms: Map<string, GameRoom>,
  io?: IO,
): void {
  for (const [code, room] of rooms) {
    // Host disconnect — tear down the whole room
    if (room.hostSocketId === socketId) {
      room.clearTimer();
      if (io) {
        io.to(code).emit("game-ended", { reason: "host-disconnected" });
        broadcastState(io, room);
      }
      rooms.delete(code);
      return;
    }

    // Regular player disconnect
    if (room.players.has(socketId)) {
      removePlayerFromRoom(room, socketId);
      if (io) {
        broadcastState(io, room);
      }
      return;
    }
  }
}
