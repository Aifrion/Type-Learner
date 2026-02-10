import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TypingPhase from "@/pages/Game/components/TypingPhase";
import type { Question, TypingStats } from "@/types";

const mockStats: TypingStats = { wpm: 12, accuracy: 95, correctChars: 10, totalChars: 10 };

vi.mock("@/pages/Game/components/Timer", () => ({
  default: ({ onTimeUp, isRunning }: { onTimeUp: () => void; isRunning: boolean }) => (
    <button onClick={onTimeUp} disabled={!isRunning}>
      Mock Timer
    </button>
  ),
}));

vi.mock("@/pages/Game/components/TypingInput", () => ({
  default: ({
    targetText,
    onStatsUpdate,
    onComplete,
  }: {
    targetText: string;
    onStatsUpdate: (stats: TypingStats) => void;
    onComplete: (stats: TypingStats) => void;
  }) => (
    <div>
      <span>Mock Input {targetText}</span>
      <button
        onClick={() => {
          onStatsUpdate(mockStats);
          onComplete(mockStats);
        }}
      >
        Finish Typing
      </button>
    </div>
  ),
}));

const sampleQuestion: Question = {
  id: "q1",
  text: "Sample question?",
  answer: "Sample answer.",
  timeLimit: 15,
};

describe("TypingPhase", () => {
  it("shows question details and answer", () => {
    const onPhaseComplete = vi.fn();

    render(
      <TypingPhase
        question={sampleQuestion}
        currentQuestionNumber={2}
        totalQuestions={5}
        onPhaseComplete={onPhaseComplete}
      />
    );

    expect(screen.getByText("Question 2 of 5")).toBeInTheDocument();
    expect(screen.getByText(sampleQuestion.text)).toBeInTheDocument();
    expect(screen.getAllByText(/Sample answer\./i).length).toBeGreaterThan(0);
  });

  it("completes the phase when typing finishes", () => {
    const onPhaseComplete = vi.fn();

    render(
      <TypingPhase
        question={sampleQuestion}
        currentQuestionNumber={1}
        totalQuestions={3}
        onPhaseComplete={onPhaseComplete}
      />
    );

    fireEvent.click(screen.getByText("Finish Typing"));

    expect(onPhaseComplete).toHaveBeenCalledWith(mockStats);
    expect(
      screen.getByText(/Completed! Final WPM: 12, Accuracy: 95%/i)
    ).toBeInTheDocument();
  });

  it("invokes completion when time is up before finishing", () => {
    const onPhaseComplete = vi.fn();

    render(
      <TypingPhase
        question={sampleQuestion}
        currentQuestionNumber={1}
        totalQuestions={3}
        onPhaseComplete={onPhaseComplete}
      />
    );

    fireEvent.click(screen.getByText("Mock Timer"));

    expect(onPhaseComplete).toHaveBeenCalledWith({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      totalChars: 0,
    });
  });
});
