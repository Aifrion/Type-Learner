import { describe, expect, it } from "vitest";
import { calculateScore } from "../../src/utils/score";

describe("calculateScore", () => {
  it("returns 0 for incorrect submissions", () => {
    expect(
      calculateScore({ isCorrect: false, typingSpeed: 80, accuracy: 95 })
    ).toBe(0);
  });

  it("rewards higher speed and higher accuracy", () => {
    const slower = calculateScore({
      isCorrect: true,
      typingSpeed: 35,
      accuracy: 88,
    });

    const faster = calculateScore({
      isCorrect: true,
      typingSpeed: 90,
      accuracy: 96,
    });

    expect(faster).toBeGreaterThan(slower);
  });

  it("clamps values to safe bounds", () => {
    const clampedLow = calculateScore({
      isCorrect: true,
      typingSpeed: -20,
      accuracy: -10,
    });
    const clampedHigh = calculateScore({
      isCorrect: true,
      typingSpeed: 999,
      accuracy: 999,
    });

    expect(clampedLow).toBe(0);
    expect(clampedHigh).toBe(1000);
  });
});
