import { GameRoom, Question } from "../types/game";
import { generateRoomCode } from "../utils/codeGenerator";

interface CreateGameData {
  title: string;
  ownerId: string;
  questions: Question[];
}

interface Socket {
  id: string;
  emit(event: string, data: unknown): void;
  join(room: string): void;
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
  io?: { to(room: string): { emit(event: string, data: unknown): void } }
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
