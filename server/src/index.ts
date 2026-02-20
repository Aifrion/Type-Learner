import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { rooms } from "./state/rooms";
import {
  handleCreateGame,
  handleHostDisconnect,
} from "./handlers/roomHandlers";

export function setupServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("create-game", (data) => {
      handleCreateGame(socket, data, rooms);
    });

    // TODO: handle "join-game" event for students joining a room

    socket.on("disconnect", () => {
      handleHostDisconnect(socket.id, rooms, io);
    });
  });

  return { httpServer, io };
}

const { httpServer } = setupServer();

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});
