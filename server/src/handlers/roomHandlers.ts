import {
  GameRoom,
  Question,
  Player,
  AnswerRecord,
  TypingRecord,
} from "../types/game";
import { generateRoomCode } from "../utils/codeGenerator";

interface CreateGameData {
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

interface AdvancePhaseData {
  code: string;
}

interface Socket {
  id: string;
  emit(event: string, data: unknown): void;
  join(room: string): void;
}

interface IOServer {
  to(room: string): { emit(event: string, data: unknown): void };
}

const MC_DURATION_MS = 15_000;
const TYPING_DURATION_MS = 30_000;

function setPhaseTimer(room: GameRoom, io: IOServer, durationMs: number, next: () => void) {
  room.clearTimer();
  room.phaseDurationMs = durationMs;
  room.timerStartedAt = Date.now();
  room.activeTimer = setTimeout(next, durationMs);
  broadcastState(io, room);
}

function broadcastState(io: IOServer, room: GameRoom) {
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

export function handleCreateGame(
  socket: Socket,
  data: CreateGameData,
  rooms: Map<string, GameRoom>
): void {
  const code = generateRoomCode(rooms);

  const room = new GameRoom(code, socket.id, data.questions);

  rooms.set(code, room);
  socket.join(code);
  socket.emit("game-created", { code });
}

export function handleJoinGame(
  socket: Socket,
  data: JoinGameData,
  rooms: Map<string, GameRoom>,
  io: IOServer
): void {
  const room = rooms.get(data.code);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }
  const player: Player = {
    socketId: socket.id,
    nickname: data.nickname,
    score: 0,
    hasSubmitted: false,
  };
  room.addPlayer(player);
  socket.join(room.code);
  socket.emit("joined-room", { code: room.code, phase: room.phase });
  broadcastState(io, room);
}

export function handleStartGame(
  socket: Socket,
  data: StartGameData,
  rooms: Map<string, GameRoom>,
  io: IOServer
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
  room.phase = "multiple_choice";
  room.currentQuestionIndex = 0;
  setPhaseTimer(room, io, MC_DURATION_MS, () =>
    advanceToNextPhase(room, io)
  );
}

export function handleSubmitMultipleChoice(
  socket: Socket,
  data: SubmitMCData,
  rooms: Map<string, GameRoom>,
  io: IOServer
): void {
  const room = rooms.get(data.code);
  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }
  if (room.phase !== "multiple_choice") {
    socket.emit("error", { message: "Not accepting multiple choice answers now" });
    return;
  }
  const player = room.players.get(socket.id);
  if (!player) {
    socket.emit("error", { message: "Player not in room" });
    return;
  }
  const existing =
    room.mcSubmissions.get(room.currentQuestionIndex)?.get(socket.id);
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
  io: IOServer
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
  const existing =
    room.typingSubmissions.get(room.currentQuestionIndex)?.get(socket.id);
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
  io: IOServer
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

function scoreMultipleChoice(room: GameRoom) {
  const answers = room.mcSubmissions.get(room.currentQuestionIndex);
  if (!answers) return;
  for (const [socketId, record] of answers.entries()) {
    const player = room.players.get(socketId);
    if (!player) continue;
    const correct =
      record.answerIndex ===
      room.questions[room.currentQuestionIndex]?.correctAnswerIndex;
    if (correct) player.score += 10;
  }
}

function scoreTyping(room: GameRoom) {
  const typing = room.typingSubmissions.get(room.currentQuestionIndex);
  if (!typing) return;
  for (const [socketId, record] of typing.entries()) {
    const player = room.players.get(socketId);
    if (!player) continue;
    // Simple scoring: wpm * accuracy%
    const score = Math.round(record.wpm * (record.accuracy / 100));
    player.score += score;
  }
}

function advanceToNextPhase(room: GameRoom, io: IOServer) {
  // End current phase scoring
  if (room.phase === "multiple_choice") {
    scoreMultipleChoice(room);
    room.phase = "typing";
    setPhaseTimer(room, io, TYPING_DURATION_MS, () =>
      advanceToNextPhase(room, io)
    );
    return;
  }

  if (room.phase === "typing") {
    scoreTyping(room);
    if (room.currentQuestionIndex < room.questions.length - 1) {
      room.currentQuestionIndex += 1;
      room.phase = "multiple_choice";
      setPhaseTimer(room, io, MC_DURATION_MS, () =>
        advanceToNextPhase(room, io)
      );
    } else {
      room.phase = "completed";
      room.clearTimer();
      broadcastState(io, room);
    }
  }
}

export function handleHostDisconnect(
  hostSocketId: string,
  rooms: Map<string, GameRoom>,
  io?: IOServer
): void {
  for (const [code, room] of rooms) {
    if (room.hostSocketId === hostSocketId) {
      room.clearTimer();

      if (io) {
        io.to(code).emit("game-ended", { reason: "host-disconnected" });
      }

      rooms.delete(code);
      break;
    }
  }
}

export function handleDisconnect(
  socketId: string,
  rooms: Map<string, GameRoom>,
  io?: IOServer
): void {
  for (const [code, room] of rooms) {
    // Host disconnect retains previous behavior
    if (room.hostSocketId === socketId) {
      handleHostDisconnect(socketId, rooms, io);
      return;
    }

    // Remove regular player
    if (room.players.has(socketId)) {
      room.players.delete(socketId);

      // Clean any submissions from this player across questions
      for (const submissions of room.mcSubmissions.values()) {
        submissions.delete(socketId);
      }
      for (const submissions of room.typingSubmissions.values()) {
        submissions.delete(socketId);
      }

      // If room becomes empty, remove it; else broadcast updated state
      if (room.players.size === 0 && io) {
        room.clearTimer();
        rooms.delete(code);
      } else if (io) {
        broadcastState(io, room);
      }
      return;
    }
  }
}
