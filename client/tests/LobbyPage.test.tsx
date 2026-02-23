import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Lobby from "@/pages/Lobby";

type SocketHandler = (payload: any) => void;

const handlers = new Map<string, SocketHandler>();
const emitMock = vi.fn();

const mockSocket = {
  on: vi.fn((event: string, handler: SocketHandler) => {
    handlers.set(event, handler);
  }),
  off: vi.fn((event: string) => {
    handlers.delete(event);
  }),
  emit: emitMock,
};

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => mockSocket,
}));

describe("Lobby page", () => {
  beforeEach(() => {
    handlers.clear();
    emitMock.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
  });

  it("shows players in lobby and lets host start the game", async () => {
    render(
      <MemoryRouter initialEntries={["/lobby/ROOM?role=host"]}>
        <Routes>
          <Route path="/lobby/:code" element={<Lobby />} />
        </Routes>
      </MemoryRouter>
    );

    const roomStateHandler = handlers.get("room-state");
    expect(roomStateHandler).toBeDefined();

    act(() => {
      roomStateHandler?.({
        code: "ROOM",
        phase: "lobby",
        currentQuestionIndex: 0,
        players: [
          {
            socketId: "student-1",
            nickname: "Ada",
            score: 120,
            hasSubmitted: false,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Ada")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    expect(emitMock).toHaveBeenCalledWith("start-game", { code: "ROOM" });
  });

  it("allows a student to join a room", () => {
    render(
      <MemoryRouter initialEntries={["/lobby/ROOM?role=student"]}>
        <Routes>
          <Route path="/lobby/:code" element={<Lobby />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your nickname/i), {
      target: { value: "Kai" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join room/i }));

    expect(emitMock).toHaveBeenCalledWith("join-game", {
      code: "ROOM",
      nickname: "Kai",
    });
  });
});
