import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import App from "@/App";

vi.mock("@/firebase", () => ({
  auth: { kind: "auth" },
  db: { kind: "db" },
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
    expect(screen.getByText(/lobby: abcd/i)).toBeInTheDocument();
  });

  it("renders game page with code", () => {
    renderWithRoute("/typing/42");
    expect(
      screen.getByText(
        /What gas do plants absorb from the atmosphere during photosynthesis\?/i
      )
    ).toBeInTheDocument();
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
