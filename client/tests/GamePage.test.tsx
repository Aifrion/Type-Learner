import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Game from "@/pages/Game";
import type { TypingStats } from "@/types";
import {
  saveTypingSession,
  getTypingSession,
  clearTypingSession,
} from "@/services/sessionStorage";

const phaseStats: TypingStats = { wpm: 1, accuracy: 100, correctChars: 1, totalChars: 1 };

vi.mock("@/services/sessionStorage", () => ({
  saveTypingSession: vi.fn(),
  getTypingSession: vi.fn(),
  clearTypingSession: vi.fn(),
}));

const saveTypingSessionMock = vi.mocked(saveTypingSession);
const getTypingSessionMock = vi.mocked(getTypingSession);
const clearTypingSessionMock = vi.mocked(clearTypingSession);

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

const mockGetDoc = vi.fn();

vi.mock("firebase/firestore", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    doc: vi.fn(() => "doc-ref"),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
  };
});

vi.mock("@/firebase", () => ({ db: {} }));

describe("Game page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTypingSessionMock.mockReturnValue(null);
  });

  it("renders TypingPhase with mock question data", async () => {
    render(
      <MemoryRouter initialEntries={["/typing/practice"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mock TypingPhase/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/What gas do plants absorb from the atmosphere during photosynthesis\?/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Q4/10")).toBeInTheDocument();
    expect(saveTypingSessionMock).toHaveBeenCalledWith(
      "practice",
      expect.objectContaining({
        code: "practice",
        question: expect.objectContaining({
          answer:
            "Plants absorb carbon dioxide from the atmosphere during photosynthesis.",
        }),
      })
    );
  });

  it("handles phase completion without error", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        questions: [
          {
            question: "Capital of France?",
            answers: ["Paris", "London", "Berlin", "Rome"],
            correctAnswer: 0,
          },
        ],
      }),
    });

    render(
      <MemoryRouter initialEntries={["/typing/ROOM?q=0"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mock TypingPhase/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Finish Phase"));

    // No visible output from handler, just ensure click doesn't throw and button remains
    expect(screen.getByText("Finish Phase")).toBeInTheDocument();
    expect(clearTypingSessionMock).toHaveBeenCalledWith("ROOM");
  });

  it("uses existing session data when available", () => {
    getTypingSessionMock.mockReturnValue({
      code: "ROOM",
      question: {
        id: "q-2",
        text: "Stored question text",
        answer: "Stored answer",
        timeLimit: 25,
      },
      gameState: {
        currentQuestion: 2,
        totalQuestions: 7,
      },
      startedAt: 123,
    });

    render(
      <MemoryRouter initialEntries={["/typing/ROOM"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Stored question text")).toBeInTheDocument();
    expect(screen.getByText("Q2/7")).toBeInTheDocument();
    expect(saveTypingSessionMock).not.toHaveBeenCalled();
  });
});
