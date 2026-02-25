import { GameRoom, Player, Question } from "../types/game";
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

interface Socket {
  id: string;
  emit(event: string, data: unknown): void;
  join(room: string): void;
}

interface IO {
  to(room: string): { emit(event: string, data: unknown): void };
}

export function handleCreateGame(
  socket: Socket,
  data: CreateGameData,
  rooms: Map<string, GameRoom>
): void {
  const code = generateRoomCode(rooms);

  const room = new GameRoom(code, socket.id, data.title, data.ownerId, data.questions);

  rooms.set(code, room);
  socket.join(code);
  socket.emit("game-created", { code });
}

export function handleHostDisconnect(
  hostSocketId: string,
  rooms: Map<string, GameRoom>,
  io?: IO
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

export function handleJoinGame(
  socket: Socket,
  data: JoinGameData,
  rooms: Map<string, GameRoom>,
  io: IO
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

  // Send current player list to the joining player
  const playerList = Array.from(room.players.values()).map((p) => p.nickname);
  socket.emit("player-list", { players: playerList });

  // Broadcast to room that a new player joined
  io.to(data.code).emit("player-joined", { nickname: data.nickname });
}

export function handlePlayerDisconnect(
  socketId: string,
  rooms: Map<string, GameRoom>,
  io: IO
): void {
  for (const [code, room] of rooms) {
    const player = room.players.get(socketId);
    if (player) {
      room.removePlayer(socketId);
      io.to(code).emit("player-left", { nickname: player.nickname });
      break;
    }
  }
}
