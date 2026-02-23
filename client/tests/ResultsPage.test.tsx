import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import Results from "@/pages/Results";

type SocketHandler = (payload: any) => void;

const handlers = new Map<string, SocketHandler>();
const emitMock = vi.fn();

const mockSocket = {
  on: vi.fn((event: string, handler: SocketHandler) => {
    handlers.set(event, handler);
  }),
  off: vi.fn((event: string) => {
    handlers.delete(event);
  }),
  emit: emitMock,
};

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => mockSocket,
}));

vi.mock("@/firebase", () => ({
  db: { kind: "db" },
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => "doc-ref"),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => "SERVER_TIME"),
}));

const docMock = vi.mocked(doc);
const setDocMock = vi.mocked(setDoc);
const serverTimestampMock = vi.mocked(serverTimestamp);

describe("Results page", () => {
  beforeEach(() => {
    handlers.clear();
    emitMock.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    docMock.mockClear();
    setDocMock.mockClear();
    serverTimestampMock.mockClear();
  });

  it("renders ranked leaderboard and persists score snapshots to Firestore", async () => {
    render(
      <MemoryRouter initialEntries={["/results/ROOM?role=student&name=Ada"]}>
        <Routes>
          <Route path="/results/:code" element={<Results />} />
        </Routes>
      </MemoryRouter>
    );

    const leaderboardHandler = handlers.get("leaderboard-updated");
    expect(leaderboardHandler).toBeDefined();

    act(() => {
      leaderboardHandler?.({
        code: "ROOM",
        phase: "scoreboard",
        leaderboard: [
          { socketId: "s1", nickname: "Chris", score: 210, rank: 3 },
          { socketId: "s2", nickname: "Ada", score: 380, rank: 1 },
          { socketId: "s3", nickname: "Ben", score: 280, rank: 2 },
        ],
      });
    });

    const rows = await screen.findAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("#1 Ada");
    expect(rows[1]).toHaveTextContent("#2 Ben");
    expect(rows[2]).toHaveTextContent("#3 Chris");

    await waitFor(() => {
      expect(docMock).toHaveBeenCalledWith(expect.anything(), "rooms", "ROOM");
      expect(serverTimestampMock).toHaveBeenCalled();
      expect(setDocMock).toHaveBeenCalledWith(
        "doc-ref",
        expect.objectContaining({
          code: "ROOM",
          phase: "scoreboard",
          leaderboard: expect.any(Array),
          updatedAt: "SERVER_TIME",
        }),
        { merge: true }
      );
    });
  });
});
