import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DebugRoom from "@/pages/DebugRoom";

const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("socket.io-client", () => ({
  io: () => ({
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    connect: mockConnect,
    disconnect: mockDisconnect,
  }),
}));

describe("DebugRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits create-game when clicking Create Game", () => {
    render(<DebugRoom />);
    fireEvent.click(screen.getByText(/Create Game/i));
    expect(mockEmit).toHaveBeenCalledWith("create-game", expect.any(Object));
  });

  it("emits join-game with room code and nickname", () => {
    render(<DebugRoom />);
    fireEvent.change(screen.getByPlaceholderText(/Room code/i), {
      target: { value: "ABC123" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Nickname/i), {
      target: { value: "Tester" },
    });
    fireEvent.click(screen.getByText(/Join Game/i));
    expect(mockEmit).toHaveBeenCalledWith("join-game", {
      code: "ABC123",
      nickname: "Tester",
    });
  });
});
