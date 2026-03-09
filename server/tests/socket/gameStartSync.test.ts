import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import type { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { setupServer } from "../../src/index";
import { rooms } from "../../src/state/rooms";
import { SAMPLE_QUESTIONS } from "../sampleData/gameData";

let httpServer: HttpServer;
let io: Server;
let hostSocket: ClientSocket;
let studentSocket: ClientSocket;
let port: number;

beforeEach(
  () =>
    new Promise<void>((resolve) => {
      ({ httpServer, io } = setupServer());
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
      if (hostSocket?.connected) hostSocket.disconnect();
      if (studentSocket?.connected) studentSocket.disconnect();
      io.close(() => {
        httpServer.close(() => resolve());
      });
    })
);

describe("Socket — lobby state synchronization", () => {
  it("syncs player list and phase when host starts the game", () =>
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for game start synchronization."));
      }, 5000);

      let roomCode = "";
      let hostSawPlayerInLobby = false;
      let hostSawGameStart = false;
      let studentSawGameStart = false;

      const finishIfReady = () => {
        if (hostSawPlayerInLobby && hostSawGameStart && studentSawGameStart) {
          clearTimeout(timeout);
          resolve();
        }
      };

      hostSocket = ioClient(`http://localhost:${port}`);

      hostSocket.on("connect", () => {
        hostSocket.emit("create-game", { questions: SAMPLE_QUESTIONS });
      });

      hostSocket.on("game-created", (data: { code: string }) => {
        roomCode = data.code;
        studentSocket = ioClient(`http://localhost:${port}`);

        studentSocket.on("connect", () => {
          studentSocket.emit("join-game", { code: roomCode, nickname: "Ada" });
        });

        studentSocket.on("game-started", (payload: { phase: string }) => {
          expect(payload.phase).toBe("multiple_choice");
          studentSawGameStart = true;
          finishIfReady();
        });
      });

      hostSocket.on(
        "room-state",
        (state: { code: string; phase: string; players: Array<{ nickname: string }> }) => {
          if (state.code !== roomCode) {
            return;
          }

          if (state.phase === "lobby" && state.players.some((player) => player.nickname === "Ada")) {
            hostSawPlayerInLobby = true;
            hostSocket.emit("start-game", { code: roomCode });
          }

          if (state.phase === "multiple_choice") {
            hostSawGameStart = true;
            finishIfReady();
          }
        }
      );
    }));
});
