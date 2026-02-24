import { describe, it, expect } from "vitest";
import { SAFE_CHARACTERS } from "../sampleData/gameData";
import { generateRoomCode } from "../../src/utils/codeGenerator";

describe("generateRoomCode", () => {
  // ─── Format Validation ───────────────────────────────────────────

  it("should generate a code that is exactly 6 characters long", () => {
    const code = generateRoomCode(new Map());
    expect(code).toHaveLength(6);
  });

  it("should only contain characters from the safe alphabet", () => {
    const code = generateRoomCode(new Map());
    for (const char of code) {
      expect(SAFE_CHARACTERS).toContain(char);
    }
  });

  // ─── Uniqueness ──────────────────────────────────────────────────

  it("should not collide with existing room codes in the registry", () => {
    const existingRooms = new Map();
    existingRooms.set("ABC123", {});
    existingRooms.set("XYZ789", {});

    const code = generateRoomCode(existingRooms);
    expect(existingRooms.has(code)).toBe(false);
  });

  it("should generate different codes on successive calls", () => {
    const codes = new Set<string>();
    const iterations = 20;

    for (let i = 0; i < iterations; i++) {
      codes.add(generateRoomCode(new Map()));
    }

    expect(codes.size).toBe(iterations);
  });
});
