import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { rooms } from "./state/rooms";
import {
  handleCreateGame,
  handleJoinGame,
  handleStartGame,
  handleSubmitMultipleChoice,
  handleSubmitTyping,
  handleAdvancePhase,
  handleRequestRoomState,
  handleDisconnect,
} from "./handlers/roomHandlers";
import { persistRoomLeaderboard } from "./services/roomPersistence";

export function setupServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });

  app.use(cors());

  // Simple REST endpoint to verify if a room code is currently active.
  app.get("/api/rooms/:code", (req, res) => {
    const { code } = req.params;
    const exists = rooms.has(code);
    res.json({ exists });
  });

  // Debug/list endpoint: returns all active room codes (no secrets included).
  app.get("/api/rooms", (_req, res) => {
    const codes = Array.from(rooms.keys());
    res.json({ count: codes.length, codes });
  });

  io.on("connection", (socket) => {
    socket.on("create-game", (data) => {
      handleCreateGame(socket, data, rooms);
    });

    socket.on("join-game", (data) => {
      handleJoinGame(socket, data, rooms, io);
    });

    socket.on("start-game", (data) => {
      handleStartGame(socket, data, rooms, io);
    });

    socket.on("submit-mc", (data) => {
      handleSubmitMultipleChoice(socket, data, rooms, io);
    });

    socket.on("submit-typing", (data) => {
      handleSubmitTyping(socket, data, rooms, io);
    });

    socket.on("advance-phase", (data) => {
      handleAdvancePhase(socket, data.code, rooms, io);
    });

    socket.on("request-room-state", (data) => {
      handleRequestRoomState(socket, data, rooms);
    });

    socket.on("disconnect", () => {
      handleDisconnect(socket.id, rooms, io);
    });
  });

  return { httpServer, io };
}

if (require.main === module) {
  const { httpServer } = setupServer();
  const PORT = Number(process.env.PORT) || 8080;

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
