import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AnswerCard from "@/pages/Question/components/AnswerCard";

describe("AnswerCard", () => {
  it("fires onSelect when enabled", () => {
    const onSelect = vi.fn();

    render(
      <AnswerCard
        label="1"
        text="Option A"
        state="default"
        disabled={false}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /option 1: option a/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("is disabled when marked correct or wrong", () => {
    const onSelect = vi.fn();

    render(
      <AnswerCard
        label="2"
        text="Option B"
        state="correct"
        disabled={false}
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole("button", { name: /option 2: option b/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onSelect).not.toHaveBeenCalled();
  });
});
