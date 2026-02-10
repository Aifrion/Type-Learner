import { render, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";
import TypingInput from "@/pages/Game/components/TypingInput";

describe("TypingInput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks incorrect then correct keystrokes", () => {
    const onStatsUpdate = vi.fn();
    const onComplete = vi.fn();
    vi.spyOn(Date, "now").mockReturnValue(1000);

    render(
      <TypingInput
        targetText="ab"
        disabled={false}
        onStatsUpdate={onStatsUpdate}
        onComplete={onComplete}
      />
    );

    fireEvent.keyDown(window, { key: "x" });
    expect(onStatsUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ correctChars: 0, totalChars: 1, accuracy: 0 })
    );
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "a" });
    expect(onStatsUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ correctChars: 1, totalChars: 2, accuracy: 50 })
    );
  });

  it("calls onComplete when the target text is finished", () => {
    const onStatsUpdate = vi.fn();
    const onComplete = vi.fn();
    // First call sets start time, subsequent calls return one minute later
    vi.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValue(61000);

    render(
      <TypingInput
        targetText="hi"
        disabled={false}
        onStatsUpdate={onStatsUpdate}
        onComplete={onComplete}
      />
    );

    fireEvent.keyDown(window, { key: "h" });
    fireEvent.keyDown(window, { key: "i" });

    expect(onComplete).toHaveBeenCalledTimes(1);
    const finalStats = onComplete.mock.calls[0][0];
    expect(finalStats.correctChars).toBe(2);
    expect(finalStats.totalChars).toBe(2);
    expect(onStatsUpdate).toHaveBeenCalledTimes(2);
  });
});
