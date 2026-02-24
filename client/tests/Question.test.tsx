import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    useParams: () => ({ code: "ROOM" }),
    useNavigate: () => mockNavigate,
  };
});

const mockData = [
  {
    id: "set1",
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
  },
];
const mockGetDoc = vi.fn();

vi.mock("firebase/firestore", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    doc: vi.fn(() => "docRef"),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
  };
});

vi.mock("@/firebase", () => ({ db: {} }));
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

import Question from "@/pages/Question";

function renderQuestion() {
  return render(
    <MemoryRouter initialEntries={["/question/ROOM"]}>
      <Routes>
        <Route path="/question/:code" element={<Question />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Question page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetDoc.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows loading then renders first question", async () => {
    mockGetDoc.mockResolvedValueOnce({
      id: "ROOM",
      exists: () => true,
      data: () => ({ questions: mockData[0].questions }),
    });

    renderQuestion();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Capital of France/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("boom"));

    renderQuestion();

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });
  });

  it("advances through questions and navigates to typing after the last one", async () => {
    mockGetDoc.mockResolvedValueOnce({
      id: "ROOM",
      exists: () => true,
      data: () => ({ questions: mockData[0].questions }),
    });

    renderQuestion();

    await waitFor(() => screen.getByText(/Capital of France/i));

    await act(async () => {
      screen.getByRole("button", { name: /option 1: paris/i }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /next question/i }).click();
    });

    expect(screen.getByText(/2\+2\?/i)).toBeInTheDocument();
    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button", { name: /option 2: 4/i }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /continue to typing/i }).click();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/typing/ROOM?q=1");
  });

  it("uses a safe fallback index when correctAnswer is out of bounds", async () => {
    mockGetDoc.mockResolvedValueOnce({
      id: "ROOM",
      exists: () => true,
      data: () => ({
        questions: [
          {
            question: "Pick A",
            answers: ["A", "B"],
            correctAnswer: 99,
          },
        ],
      }),
    });

    renderQuestion();

    await waitFor(
      () => {
        expect(screen.getByText(/Pick A/i)).toBeInTheDocument();
      },
    );

    await act(async () => {
      screen.getByRole("button", { name: /option 2: b/i }).click();
    });

    expect(screen.getByText(/the correct answer is A/i)).toBeInTheDocument();
  });

  it("auto navigates to typing when final question time expires", async () => {
    mockGetDoc.mockResolvedValueOnce({
      id: "ROOM",
      exists: () => true,
      data: () => ({ questions: mockData[0].questions }),
    });

    renderQuestion();

    await screen.findByText(/Capital of France/i);

    await act(async () => {
      screen.getByRole("button", { name: /option 1: paris/i }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /next question/i }).click();
    });

    await act(async () => {
      screen.getByText("Mock Timer").click();
    });
    const continueBtn = await screen.findByRole("button", { name: /continue to typing/i });
    await act(async () => {
      continueBtn.click();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/typing/ROOM?q=1");
  });

});
