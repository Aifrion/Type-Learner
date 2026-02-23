import type { TypingSession } from "@/types";

const SESSION_KEY_PREFIX = "typingSession";

export function saveTypingSession(code: string, session: TypingSession): void {
  const key = `${SESSION_KEY_PREFIX}:${code}`;
  try {
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save typing session:", error);
  }
}

export function getTypingSession(code: string): TypingSession | null {
  const key = `${SESSION_KEY_PREFIX}:${code}`;
  try {
    const data = sessionStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as TypingSession;
  } catch (error) {
    console.error("Failed to retrieve typing session:", error);
    return null;
  }
}

export function clearTypingSession(code: string): void {
  const key = `${SESSION_KEY_PREFIX}:${code}`;
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear typing session:", error);
  }
}

export function clearAllTypingSessions(): void {
  try {
    const keys = Object.keys(sessionStorage).filter((key) =>
      key.startsWith(SESSION_KEY_PREFIX),
    );
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear all typing sessions:", error);
  }
}
