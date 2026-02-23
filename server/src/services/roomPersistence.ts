import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { LeaderboardEntry } from "../handlers/roomHandlers";

let triedInit = false;
let db: ReturnType<typeof getFirestore> | null = null;

function getDb() {
  if (!triedInit) {
    triedInit = true;
    try {
      if (getApps().length === 0) {
        initializeApp({ credential: applicationDefault() });
      }
      db = getFirestore();
    } catch {
      db = null;
    }
  }

  return db;
}

export async function persistRoomLeaderboard(
  roomCode: string,
  leaderboard: LeaderboardEntry[]
): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }

  await db.collection("rooms").doc(roomCode).set(
    {
      code: roomCode,
      leaderboard,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
