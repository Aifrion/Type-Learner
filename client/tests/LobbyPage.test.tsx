import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Lobby from "@/pages/Lobby";
import TeacherWaitingRoom from "@/pages/TeacherWaitingRoom";

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
  connected: true,
};

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => mockSocket,
}));

vi.mock("@/utils/nicknameGenerator", () => ({
  getOrCreateNickname: () => "Kai",
}));

vi.mock("@/firebase", () => ({
  auth: { currentUser: { uid: "host-uid" } },
}));

describe("Lobby page", () => {
  beforeEach(() => {
    handlers.clear();
    emitMock.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
  });

  it("shows players in lobby after auto-joining", async () => {
    render(
      <MemoryRouter initialEntries={["/lobby/ROOM?role=student"]}>
        <Routes>
          <Route path="/lobby/:code" element={<Lobby />} />
        </Routes>
      </MemoryRouter>
    );

    expect(emitMock).toHaveBeenCalledWith("join-game", {
      code: "ROOM",
      nickname: "Kai",
    });

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
    expect(screen.getByRole("button", { name: /leave lobby/i })).toBeInTheDocument();
  });

  it("lets host start the game from teacher waiting room", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/host/waiting-room",
            state: {
              set: {
                id: "set-1",
                title: "Test Quiz",
                ownerId: "host-uid",
                questions: [
                  {
                    prompt: "What does HTML stand for?",
                    options: ["A", "B", "C", "D"],
                    correctOptionIndex: 0,
                  },
                ],
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/host/waiting-room" element={<TeacherWaitingRoom />} />
        </Routes>
      </MemoryRouter>
    );

    expect(emitMock).toHaveBeenCalledWith("create-game", expect.objectContaining({
      title: "Test Quiz",
      ownerId: "host-uid",
    }));

    const gameCreatedHandler = handlers.get("game-created");
    const roomStateHandler = handlers.get("room-state");
    expect(gameCreatedHandler).toBeDefined();
    expect(roomStateHandler).toBeDefined();

    act(() => {
      gameCreatedHandler?.({ code: "ROOM" });
      roomStateHandler?.({
        code: "ROOM",
        phase: "lobby",
        currentQuestionIndex: 0,
        players: [{ socketId: "student-1", nickname: "Ada", score: 0 }],
      });
    });

    const startButton = screen.getByRole("button", { name: /start game/i });
    expect(startButton).not.toBeDisabled();
    fireEvent.click(startButton);

    expect(emitMock).toHaveBeenCalledWith("start-game", { code: "ROOM" });
  });
});
