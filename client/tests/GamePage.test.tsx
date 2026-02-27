import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Game from "@/pages/Game";
import type { TypingStats } from "@/types";

const handlers = new Map<string, Set<(payload: unknown) => void>>();

const addHandler = (event: string, cb: (payload: unknown) => void) => {
  if (!handlers.has(event)) {
    handlers.set(event, new Set());
  }
  handlers.get(event)?.add(cb);
};

const removeHandler = (event: string, cb: (payload: unknown) => void) => {
  handlers.get(event)?.delete(cb);
};

const emitToClient = (event: string, payload: unknown) => {
  act(() => {
    handlers.get(event)?.forEach((cb) => cb(payload));
  });
};

const socketMock = {
  connected: true,
  id: "socket-1",
  on: vi.fn((event: string, cb: (payload: unknown) => void) => {
    addHandler(event, cb);
    return socketMock;
  }),
  off: vi.fn((event: string, cb: (payload: unknown) => void) => {
    removeHandler(event, cb);
    return socketMock;
  }),
  once: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
};

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => socketMock,
}));

const phaseStats: TypingStats = {
  wpm: 33,
  accuracy: 91,
  correctChars: 33,
  totalChars: 36,
};

vi.mock("@/pages/Game/components/TypingPhase", () => ({
  default: ({
    question,
    currentQuestionNumber,
    totalQuestions,
    onPhaseComplete,
  }: {
    question: { text: string };
    currentQuestionNumber: number;
    totalQuestions: number;
    onPhaseComplete: (stats: TypingStats) => void;
  }) => (
    <div>
      <p>Mock TypingPhase</p>
      <p>{question.text}</p>
      <p>
        Q{currentQuestionNumber}/{totalQuestions}
      </p>
      <button onClick={() => onPhaseComplete(phaseStats)}>Finish Phase</button>
    </div>
  ),
}));

describe("Game page", () => {
  beforeEach(() => {
    handlers.clear();
    vi.clearAllMocks();
  });

  it("requests room state on mount", () => {
    render(
      <MemoryRouter initialEntries={["/typing/ROOM"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    expect(socketMock.emit).toHaveBeenCalledWith(
      "request-room-state",
      { code: "ROOM" }
    );
  });

  it("renders typing content from room-state and submits typing stats", async () => {
    render(
      <MemoryRouter initialEntries={["/typing/ROOM"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    emitToClient("room-state", {
      code: "ROOM",
      phase: "typing",
      currentQuestionIndex: 1,
      totalQuestions: 5,
      question: {
        prompt: "Type this answer",
        options: ["Correct answer text", "B", "C", "D"],
        correctOptionIndex: 0,
      },
      players: [],
    });

    expect(await screen.findByText("Mock TypingPhase")).toBeInTheDocument();
    expect(screen.getByText("Type this answer")).toBeInTheDocument();
    expect(screen.getByText("Q2/5")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Finish Phase"));
    expect(socketMock.emit).toHaveBeenCalledWith("submit-typing", {
      code: "ROOM",
      wpm: 33,
      accuracy: 91,
    });
  });

  it("redirects back to multiple-choice when phase changes", async () => {
    render(
      <MemoryRouter initialEntries={["/typing/ROOM"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
          <Route path="/question/:code" element={<div>Question Route</div>} />
        </Routes>
      </MemoryRouter>
    );

    emitToClient("room-state", {
      code: "ROOM",
      phase: "multiple_choice",
      currentQuestionIndex: 0,
      totalQuestions: 2,
      question: {
        prompt: "MC prompt",
        options: ["A", "B"],
        correctOptionIndex: 0,
      },
      players: [],
    });

    await waitFor(() => {
      expect(screen.getByText("Question Route")).toBeInTheDocument();
    });
  });

  it("does not submit typing stats twice when server marks player submitted", async () => {
    render(
      <MemoryRouter initialEntries={["/typing/ROOM"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    emitToClient("room-state", {
      code: "ROOM",
      phase: "typing",
      currentQuestionIndex: 0,
      totalQuestions: 1,
      question: {
        prompt: "Typing prompt",
        options: ["A", "B"],
        correctOptionIndex: 0,
      },
      players: [{ socketId: "socket-1", nickname: "Player", score: 0, hasSubmitted: true }],
    });

    fireEvent.click(await screen.findByText("Finish Phase"));

    expect(socketMock.emit).not.toHaveBeenCalledWith(
      "submit-typing",
      expect.objectContaining({ code: "ROOM" })
    );
  });
});
