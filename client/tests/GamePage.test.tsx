import { render, screen, fireEvent } from "@testing-library/react";
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

describe("Game page", () => {
  it("renders TypingPhase with mock question data", () => {
    render(
      <MemoryRouter initialEntries={["/typing/ROOM"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Mock TypingPhase/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /What gas do plants absorb from the atmosphere during photosynthesis\?/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Q4/10")).toBeInTheDocument();
  });

  it("handles phase completion without error", () => {
    render(
      <MemoryRouter initialEntries={["/typing/ROOM"]}>
        <Routes>
          <Route path="/typing/:code" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Finish Phase"));

    // No visible output from handler, just ensure click doesn't throw and button remains
    expect(screen.getByText("Finish Phase")).toBeInTheDocument();
  });
});
