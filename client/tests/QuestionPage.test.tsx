import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Question from "@/pages/Question";
import { getDocs } from "firebase/firestore";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/firebase", () => ({
  db: { kind: "db" },
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock("@/pages/Game/components/Timer", () => ({
  default: ({
    onTimeUp,
    isRunning,
  }: {
    onTimeUp: () => void;
    isRunning: boolean;
  }) => (
    <button onClick={onTimeUp} disabled={!isRunning}>
      Mock Timer
    </button>
  ),
}));

const getDocsMock = vi.mocked(getDocs);

const snapshot = {
  docs: [
    {
      id: "set-1",
      data: () => ({
        questions: [
          {
            question: "What is 2 + 2?",
            answers: ["4", "5"],
            correctAnswer: 0,
          },
        ],
      }),
    },
  ],
};

const renderQuestion = (code = "ROOM") => {
  render(
    <MemoryRouter initialEntries={[`/question/${code}`]}>
      <Routes>
        <Route path="/question/:code" element={<Question />} />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  getDocsMock.mockResolvedValue(snapshot as never);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Question page", () => {
  it("auto-advances to typing after answering", async () => {
    renderQuestion();

    await screen.findByText("What is 2 + 2?");

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: /option 1: 4/i }));

    screen.getByRole("button", { name: /continue to typing/i });
    expect(navigateMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(navigateMock).toHaveBeenCalledWith("/typing/ROOM");
  });

  it("auto-advances to typing when time expires", async () => {
    renderQuestion("ABC");

    await screen.findByText("What is 2 + 2?");

    vi.useFakeTimers();
    fireEvent.click(screen.getByText("Mock Timer"));

    screen.getByRole("button", { name: /continue to typing/i });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(navigateMock).toHaveBeenCalledWith("/typing/ABC");
  });

  it("navigates immediately when continue is clicked", async () => {
    renderQuestion("FAST");

    await screen.findByText("What is 2 + 2?");

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: /option 1: 4/i }));

    const continueButton = screen.getByRole("button", {
      name: /continue to typing/i,
    });
    fireEvent.click(continueButton);

    expect(navigateMock).toHaveBeenCalledWith("/typing/FAST");

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});
