import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { rooms } from "./state/rooms";
import {
  handleCreateGame,
  handleHostDisconnect,
  handleJoinGame,
  handlePlayerDisconnect,
} from "./handlers/roomHandlers";

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

    socket.on("disconnect", () => {
      handleHostDisconnect(socket.id, rooms, io);
      handlePlayerDisconnect(socket.id, rooms, io);
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
