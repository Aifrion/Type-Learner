import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";

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
      screen.getByRole("heading", { name: /type learner/i })
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
