import { render, screen } from "@testing-library/react";
import { act } from "react";
import { vi, describe, it, expect } from "vitest";
import Timer from "@/pages/Game/components/Timer";

describe("Timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down to zero and calls onTimeUp", () => {
    const onTimeUp = vi.fn();

    render(<Timer duration={3} onTimeUp={onTimeUp} isRunning />);

    expect(screen.getByText("00:03")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onTimeUp).toHaveBeenCalledTimes(1);
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("stays idle when not running", () => {
    const onTimeUp = vi.fn();

    render(<Timer duration={5} onTimeUp={onTimeUp} isRunning={false} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onTimeUp).not.toHaveBeenCalled();
    expect(screen.getByText("00:05")).toBeInTheDocument();
  });
});
