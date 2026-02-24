import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Game from "@/pages/Game";
import type { TypingStats } from "@/types";

const phaseStats: TypingStats = { wpm: 1, accuracy: 100, correctChars: 1, totalChars: 1 };

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
  it("renders TypingPhase with fetched typing data from question set and query index", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        questions: [
          {
            question: "Capital of France?",
            answers: ["Paris", "London", "Berlin", "Rome"],
            correctAnswer: 0,
          },
          {
            question: "2+2?",
            answers: ["3", "4", "5", "6"],
            correctAnswer: 1,
          },
        ],
      }),
    });

    render(
      <MemoryRouter initialEntries={["/typing/ROOM?q=1"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mock TypingPhase/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/2\+2\?/i)).toBeInTheDocument();
    expect(screen.getByText("Q2/2")).toBeInTheDocument();
  });

  it("falls back to practice mock question without firestore fetch", async () => {
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
  });
});
