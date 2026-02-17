import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (orig) => {
  const actual = await orig();
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
const mockGetDocs = vi.fn();

vi.mock("firebase/firestore", async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    collection: vi.fn(() => "collectionRef"),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
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
    mockGetDocs.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows loading then renders first question", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: mockData.map((d) => ({ id: d.id, data: () => ({ questions: d.questions }) })),
    });

    renderQuestion();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Capital of France/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("boom"));

    renderQuestion();

    await waitFor(() => {
      expect(screen.getByText(/boom/i)).toBeInTheDocument();
    });
  });

  it("auto navigates to typing on answer or time up", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: mockData.map((d) => ({ id: d.id, data: () => ({ questions: d.questions }) })),
    });

    renderQuestion();

    await waitFor(() => screen.getByText(/Capital of France/i));

    // Answer the question (first option)
    await act(async () => {
      screen.getByRole("button", { name: /option 1: paris/i }).click();
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/typing/ROOM");
      },
      { timeout: 2500 },
    );
  });

  it("auto navigates to typing when time expires", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: mockData.map((d) => ({ id: d.id, data: () => ({ questions: d.questions }) })),
    });

    renderQuestion();

    await screen.findByText(/Capital of France/i);

    await act(async () => {
      screen.getByText("Mock Timer").click();
    });
    const continueBtn = await screen.findByRole("button", { name: /continue to typing/i });
    await act(async () => {
      continueBtn.click();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/typing/ROOM");
  });

  it("navigates immediately when continue button is clicked", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: mockData.map((d) => ({ id: d.id, data: () => ({ questions: d.questions }) })),
    });

    renderQuestion();

    await waitFor(() => screen.getByText(/Capital of France/i));

    await act(async () => {
      screen.getByRole("button", { name: /option 1: paris/i }).click();
    });
    const continueBtn = await screen.findByRole("button", { name: /continue to typing/i });
    await act(async () => {
      continueBtn.click();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/typing/ROOM");
  });
});
