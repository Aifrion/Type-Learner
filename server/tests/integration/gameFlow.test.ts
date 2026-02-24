import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { io as Client } from "socket.io-client";
import { setupServer } from "../../src/index";
import { rooms } from "../../src/state/rooms";
import { SAMPLE_QUESTIONS } from "../sampleData/gameData";

describe("Game flow (integration)", () => {
  const { httpServer, io } = setupServer();
  let port: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      const listener = httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (typeof addr === "object" && addr) port = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    httpServer.close();
  });

  it("creates a game and broadcasts state on start/advance", async () => {
    const host = Client(`http://localhost:${port}`, { autoConnect: true });

    const events: any[] = [];
    host.on("game-created", (data) => events.push(["game-created", data]));
    host.on("room-state", (data) => events.push(["room-state", data]));

    host.emit("create-game", { questions: SAMPLE_QUESTIONS });

    await waitFor(() => events.some(([e]) => e === "game-created"));
    const code = events.find(([e]) => e === "game-created")[1].code;

    host.emit("start-game", { code });
    await waitFor(() => events.some(([e, d]) => e === "room-state" && d.phase === "multiple_choice"));

    host.emit("advance-phase", { code });
    await waitFor(() => events.some(([e, d]) => e === "room-state" && d.phase === "typing"));

    host.close();
  });
});

async function waitFor(check: () => boolean, timeout = 2000, interval = 50) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const timer = setInterval(() => {
      if (check()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error("timeout"));
      }
    }, interval);
  });
}
