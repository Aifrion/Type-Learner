import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Question from "@/pages/Question";

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
  emit: vi.fn(),
  once: vi.fn(),
  connect: vi.fn(),
};

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => socketMock,
}));

describe("Question page", () => {
  beforeEach(() => {
    handlers.clear();
    vi.clearAllMocks();
  });

  it("renders options from room-state and submits selected answer", async () => {
    render(
      <MemoryRouter initialEntries={["/question/ROOM"]}>
        <Routes>
          <Route path="/question/:code" element={<Question />} />
        </Routes>
      </MemoryRouter>
    );

    emitToClient("room-state", {
      code: "ROOM",
      phase: "multiple_choice",
      currentQuestionIndex: 0,
      question: {
        prompt: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctOptionIndex: 1,
      },
      players: [],
    });

    expect(await screen.findByText("What is 2 + 2?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "4" }));

    expect(socketMock.emit).toHaveBeenCalledWith("submit-mc", {
      code: "ROOM",
      answerIndex: 1,
    });
  });

  it("redirects to typing when phase changes", async () => {
    render(
      <MemoryRouter initialEntries={["/question/ROOM"]}>
        <Routes>
          <Route path="/question/:code" element={<Question />} />
          <Route path="/typing/:code" element={<div>Typing Route</div>} />
        </Routes>
      </MemoryRouter>
    );

    emitToClient("room-state", {
      code: "ROOM",
      phase: "typing",
      currentQuestionIndex: 0,
      question: {
        prompt: "Question",
        options: ["A", "B"],
        correctOptionIndex: 0,
      },
      players: [],
    });

    await waitFor(() => {
      expect(screen.getByText("Typing Route")).toBeInTheDocument();
    });
  });

  it("does not submit again when server marks player as submitted", async () => {
    render(
      <MemoryRouter initialEntries={["/question/ROOM"]}>
        <Routes>
          <Route path="/question/:code" element={<Question />} />
        </Routes>
      </MemoryRouter>
    );

    emitToClient("room-state", {
      code: "ROOM",
      phase: "multiple_choice",
      currentQuestionIndex: 0,
      question: {
        prompt: "Already answered",
        options: ["A", "B"],
        correctOptionIndex: 0,
      },
      players: [{ socketId: "socket-1", nickname: "Player", score: 0, hasSubmitted: true }],
    });

    fireEvent.click(await screen.findByRole("button", { name: "A" }));

    expect(socketMock.emit).not.toHaveBeenCalledWith(
      "submit-mc",
      expect.objectContaining({ code: "ROOM" })
    );
  });
});
