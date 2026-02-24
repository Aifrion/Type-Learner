import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import QuestionPhase, { type MultipleChoiceQuestion } from "@/pages/Question/components/QuestionPhase";

vi.mock("@/pages/Game/components/Timer", () => ({
  default: ({ onTimeUp, isRunning }: { onTimeUp: () => void; isRunning: boolean }) => (
    <button onClick={onTimeUp} disabled={!isRunning}>
      Mock Timer
    </button>
  ),
}));

const baseQuestion: MultipleChoiceQuestion = {
  id: "q1",
  text: "What is 2+2?",
  timeLimit: 15,
  options: [
    { text: "3" },
    { text: "4" },
    { text: "5" },
    { text: "6" },
  ],
  correctIndex: 1,
};

describe("QuestionPhase", () => {
  it("shows question text, numbering, and options", () => {
    render(
      <QuestionPhase
        question={baseQuestion}
        currentQuestionNumber={2}
        totalQuestions={5}
      />,
    );

    expect(screen.getByText("Question 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /answer options/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /option/i })).toHaveLength(4);
  });

  it("marks correct and wrong states after a selection and stops timer", () => {
    const onAnswered = vi.fn();

    render(
      <QuestionPhase
        question={baseQuestion}
        currentQuestionNumber={1}
        totalQuestions={4}
        onAnswered={onAnswered}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /option 1: 3/i }));

    expect(onAnswered).toHaveBeenCalledWith(0);
    expect(screen.getByText(/the correct answer is 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock Timer/i)).toBeDisabled();
  });

  it("invokes onTimeUp and allows continue button after time expires", () => {
    const onTimeUp = vi.fn();
    const onContinue = vi.fn();

    render(
      <QuestionPhase
        question={baseQuestion}
        currentQuestionNumber={1}
        totalQuestions={4}
        onTimeUp={onTimeUp}
        onContinue={onContinue}
      />,
    );

    fireEvent.click(screen.getByText("Mock Timer"));

    expect(onTimeUp).toHaveBeenCalledTimes(1);
    const continueBtn = screen.getByRole("button", { name: /continue to typing/i });
    expect(continueBtn).toBeInTheDocument();
    fireEvent.click(continueBtn);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("does not allow changing answer after first selection", () => {
    render(
      <QuestionPhase
        question={baseQuestion}
        currentQuestionNumber={3}
        totalQuestions={4}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /option 2: 4/i }));
    fireEvent.click(screen.getByRole("button", { name: /option 3: 5/i }));

    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /option 3: 5/i })).toBeDisabled();
  });
});
