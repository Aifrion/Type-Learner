import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import JoinPage from "@/pages/Join";

const mockNavigate = vi.fn();
const mockCheckRoomExists = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/api", () => ({
  checkRoomExists: (...args: unknown[]) => mockCheckRoomExists(...args),
}));

const setup = () =>
  render(
    <MemoryRouter>
      <JoinPage />
    </MemoryRouter>
  );

beforeEach(() => {
  mockNavigate.mockReset();
  mockCheckRoomExists.mockReset();
});

describe("JoinPage", () => {
  it("uppercases typed letters", async () => {
    setup();
    const [first] = screen.getAllByRole("textbox");
    await userEvent.type(first, "a");
    expect(first).toHaveValue("A");
  });

  it("prevents typing past the first empty slot", async () => {
    setup();
    const inputs = screen.getAllByRole("textbox");

    // Click third box and try to type; should be ignored and not fill later boxes.
    await userEvent.click(inputs[2]);
    await userEvent.type(inputs[2], "B");

    await waitFor(() => expect(inputs[0]).toHaveValue(""));
    await waitFor(() => expect(inputs[2]).toHaveValue(""));
  });

  it("pastes alphanumeric code and uppercases it", async () => {
    setup();
    const inputs = screen.getAllByRole("textbox");

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: (type: string) =>
          type === "text/plain" || type === "text" ? "abc123" : "",
      },
    });

    expect(inputs.map((i) => (i as HTMLInputElement).value)).toEqual([
      "A",
      "B",
      "C",
      "1",
      "2",
      "3",
    ]);
  });

  it("navigates to lobby when code exists", async () => {
    mockCheckRoomExists.mockResolvedValue({ exists: true });
    setup();
    const inputs = screen.getAllByRole("textbox");

    const code = ["A", "B", "C", "1", "2", "3"];
    for (let i = 0; i < code.length; i++) {
      await userEvent.type(inputs[i], code[i]);
    }

    await userEvent.click(screen.getByRole("button", { name: /join room/i }));
    expect(mockCheckRoomExists).toHaveBeenCalledWith("ABC123");
    expect(mockNavigate).toHaveBeenCalledWith("/lobby/ABC123");
  });

  it("shows error when code does not exist", async () => {
    mockCheckRoomExists.mockResolvedValue({ exists: false });
    setup();
    const inputs = screen.getAllByRole("textbox");

    const code = ["A", "B", "C", "1", "2", "3"];
    for (let i = 0; i < code.length; i++) {
      await userEvent.type(inputs[i], code[i]);
    }

    await userEvent.click(screen.getByRole("button", { name: /join room/i }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/code doesn't exist/i)
    ).toBeInTheDocument();
  });
});
