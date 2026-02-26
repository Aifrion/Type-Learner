import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import App from "@/App";

vi.mock("@/firebase", () => ({
  auth: { kind: "auth" },
  db: { kind: "db" },
}));

const socketMock = {
  connected: false,
  id: "socket-1",
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  once: vi.fn(),
};

vi.mock("@/hooks/useSocket", () => ({
  SocketProvider: () => {
    const { Outlet } = require("react-router-dom");
    return <Outlet />;
  },
  useSocket: () => socketMock,
}));

const renderWithRoute = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  );

describe("App routing", () => {
  it("shows the home page at root", () => {
    renderWithRoute("/");
    expect(
      screen.getByRole("heading", {
        name: /build speed and confidence with every session/i,
      })
    ).toBeInTheDocument();
  });

  it("renders lobby page with code", () => {
    renderWithRoute("/lobby/ABCD");
    expect(screen.getByRole("heading", { name: /lobby/i })).toBeInTheDocument();
    expect(screen.getByText(/ABCD/)).toBeInTheDocument();
  });

  it("renders game page with code", async () => {
    renderWithRoute("/typing/practice");
    expect(await screen.findByText(/Connecting.../i)).toBeInTheDocument();
  });

  it("renders question page with code", async () => {
    renderWithRoute("/question/ABCD");
    expect(await screen.findByText(/Multiple Choice/i)).toBeInTheDocument();
  });

  it("renders results page with code", () => {
    renderWithRoute("/results/final");
    expect(screen.getByText(/results: final/i)).toBeInTheDocument();
  });

  it("renders quiz create page", () => {
    renderWithRoute("/create");
    expect(
      screen.getByRole("heading", { name: /create quiz/i })
    ).toBeInTheDocument();
  });
});
