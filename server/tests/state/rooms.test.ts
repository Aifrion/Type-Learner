import { describe, it, expect } from "vitest";
import { rooms } from "../../src/state/rooms";

describe("rooms registry", () => {
  it("should export an empty Map", () => {
    expect(rooms).toBeInstanceOf(Map);
    expect(rooms.size).toBe(0);
  });
});
