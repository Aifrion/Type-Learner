import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateAnimalNickname,
  getOrCreateNickname,
} from "@/utils/nicknameGenerator";

describe("nicknameGenerator", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("generates a title-cased adjective + animal nickname", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);

    expect(generateAnimalNickname()).toBe("Delicate Alpaca");
  });

  it("returns existing non-legacy nickname from storage", () => {
    sessionStorage.setItem("nickname", "Delicate Kangaroo");

    expect(getOrCreateNickname()).toBe("Delicate Kangaroo");
  });

  it("replaces legacy Player-XXXX nickname with generated animal nickname", () => {
    sessionStorage.setItem("nickname", "Player-AB12");
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);

    const nickname = getOrCreateNickname();

    expect(nickname).toBe("Delicate Alpaca");
    expect(sessionStorage.getItem("nickname")).toBe("Delicate Alpaca");
  });

  it("generates and stores a nickname when storage is empty", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);

    const nickname = getOrCreateNickname();

    expect(nickname).toBe("Delicate Alpaca");
    expect(sessionStorage.getItem("nickname")).toBe("Delicate Alpaca");
  });
});
