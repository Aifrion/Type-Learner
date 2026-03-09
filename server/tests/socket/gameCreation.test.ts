/**
 * gameCreation.test.ts — Integration tests for game creation over Socket.IO.
 *
 * These tests spin up a real Socket.IO server and connect with socket.io-client
 * to verify the end-to-end flow: connecting, creating a game, and host disconnect.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { setupServer } from "../../src/index";
import { rooms } from "../../src/state/rooms";
import { SAMPLE_QUESTIONS } from "../sampleData/gameData";
import type { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let httpServer: HttpServer;
let io: Server;
let clientSocket: ClientSocket;
let port: number;

beforeEach(
  () =>
    new Promise<void>((resolve) => {
      ({ httpServer, io } = setupServer());
      // Listen on port 0 to get a random available port
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    })
);

afterEach(
  () =>
    new Promise<void>((resolve) => {
      rooms.clear();
      if (clientSocket?.connected) clientSocket.disconnect();
      io.close(() => {
        httpServer.close(() => resolve());
      });
    })
);

describe("Socket — Game Creation", () => {
  it("should allow a client to connect to the server", () =>
    new Promise<void>((resolve) => {
      clientSocket = ioClient(`http://localhost:${port}`);
      clientSocket.on("connect", () => {
        expect(clientSocket.connected).toBe(true);
        resolve();
      });
    }));

  it("should emit 'game-created' with a room code when 'create-game' is sent", () =>
    new Promise<void>((resolve) => {
      clientSocket = ioClient(`http://localhost:${port}`);
      clientSocket.on("connect", () => {
        clientSocket.emit("create-game", { questions: SAMPLE_QUESTIONS });
      });
      clientSocket.on("game-created", (data: { code: string }) => {
        expect(data.code).toBeDefined();
        expect(typeof data.code).toBe("string");
        expect(data.code.length).toBe(6);
        resolve();
      });
    }));

  it("should add the room to the rooms registry after creation", () =>
    new Promise<void>((resolve) => {
      clientSocket = ioClient(`http://localhost:${port}`);
      clientSocket.on("connect", () => {
        clientSocket.emit("create-game", { questions: SAMPLE_QUESTIONS });
      });
      clientSocket.on("game-created", (data: { code: string }) => {
        expect(rooms.size).toBe(1);
        expect(rooms.has(data.code)).toBe(true);
        resolve();
      });
    }));

  it("should store the correct questions in the created room", () =>
    new Promise<void>((resolve) => {
      clientSocket = ioClient(`http://localhost:${port}`);
      clientSocket.on("connect", () => {
        clientSocket.emit("create-game", { questions: SAMPLE_QUESTIONS });
      });
      clientSocket.on("game-created", (data: { code: string }) => {
        const room = rooms.get(data.code);
        expect(room?.questions).toEqual(SAMPLE_QUESTIONS);
        resolve();
      });
    }));

  it("should set the host socket ID on the created room", () =>
    new Promise<void>((resolve) => {
      clientSocket = ioClient(`http://localhost:${port}`);
      clientSocket.on("connect", () => {
        clientSocket.emit("create-game", { questions: SAMPLE_QUESTIONS });
      });
      clientSocket.on("game-created", (data: { code: string }) => {
        const room = rooms.get(data.code);
        expect(room?.hostSocketId).toBe(clientSocket.id);
        resolve();
      });
    }));

  it("should remove the room when the host disconnects", () =>
    new Promise<void>((resolve) => {
      clientSocket = ioClient(`http://localhost:${port}`);
      clientSocket.on("connect", () => {
        clientSocket.emit("create-game", { questions: SAMPLE_QUESTIONS });
      });
      clientSocket.on("game-created", () => {
        expect(rooms.size).toBe(1);
        clientSocket.disconnect();

        // Give the server a moment to process the disconnect
        setTimeout(() => {
          expect(rooms.size).toBe(0);
          resolve();
        }, 100);
      });
    }));
});
