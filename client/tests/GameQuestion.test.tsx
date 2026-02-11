import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Game from "@/pages/Game";

function renderGame(path = "/game/123") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/game/:code" element={<Game />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Game question UI", () => {
  it("shows the question prompt and all answer options", () => {
    renderGame();

    expect(screen.getByTestId("question-text")).toHaveTextContent(
      /what gas do plants absorb/i
    );

    const buttons = screen.getAllByRole("button", { name: /option/i });
    expect(buttons).toHaveLength(4);
  });

  it("allows selecting an answer by click and then disables further input", async () => {
    const user = userEvent.setup();
    renderGame();

    const option = screen.getByRole("button", { name: /option 1/i });
    await user.click(option);

    expect(option).toHaveAttribute("aria-pressed", "true");
    screen.getAllByRole("button", { name: /option/i }).forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("allows selecting an answer with number keys", async () => {
    const user = userEvent.setup();
    renderGame();

    await user.keyboard("2");

    const optionTwo = screen.getByRole("button", { name: /option 2/i });
    expect(optionTwo).toHaveAttribute("aria-pressed", "true");
  });
});
