import {
  GameRoom,
  Player,
  Question,
  AnswerRecord,
  TypingRecord,
} from "../types/game";
import { generateRoomCode } from "../utils/codeGenerator";

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

interface Socket {
  id: string;
  emit(event: string, data: unknown): void;
  join(room: string): void;
}

interface IO {
  to(room: string): { emit(event: string, data: unknown): void };
}

const MC_DURATION_MS = 15_000;
const TYPING_DURATION_MS = 30_000;

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

function broadcastState(io: IO, room: GameRoom) {
  io.to(room.code).emit("room-state", {
    code: room.code,
    phase: room.phase,
    currentQuestionIndex: room.currentQuestionIndex,
    question: room.questions[room.currentQuestionIndex] ?? null,
    players: Array.from(room.players.values()),
    timerStartedAt: room.timerStartedAt,
    phaseDurationMs: room.phaseDurationMs,
  });
}

// ── Room lifecycle ──────────────────────────────────────────────────

export function handleCreateGame(
  socket: Socket,
  data: CreateGameData,
  rooms: Map<string, GameRoom>,
): void {
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
}

export function handleJoinGame(
  socket: Socket,
  data: JoinGameData,
  rooms: Map<string, GameRoom>,
  io: IO,
): void {
  const room = rooms.get(data.code);

  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }

  if (room.phase !== "lobby") {
    socket.emit("error", { message: "Game already in progress" });
    return;
  }

  const player: Player = {
    socketId: socket.id,
    nickname: data.nickname,
    score: 0,
    hasSubmitted: false,
  };

  room.addPlayer(player);
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
  setPhaseTimer(room, io, MC_DURATION_MS, () => advanceToNextPhase(room, io));
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
  broadcastState(io, room);
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
  advanceToNextPhase(room, io);
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
      setPhaseTimer(room, io, MC_DURATION_MS, () =>
        advanceToNextPhase(room, io),
      );
    } else {
      room.phase = "completed";
      room.clearTimer();
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
      room.players.delete(socketId);

      // Clean submissions from this player
      for (const submissions of room.mcSubmissions.values()) {
        submissions.delete(socketId);
      }
      for (const submissions of room.typingSubmissions.values()) {
        submissions.delete(socketId);
      }
      if (io) {
        broadcastState(io, room);
      }
      return;
    }
  }
}
