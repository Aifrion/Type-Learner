import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useSocket } from "@/hooks/useSocket";
import Leaderboard from "@/pages/Results/components/Leaderboard";
import type { LeaderboardEntry, LeaderboardUpdate, RoomState } from "@/types";

export default function Results() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") ?? "student";
  const nickname = searchParams.get("name") ?? "";
  const socket = useSocket();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [phase, setPhase] = useState<string>("scoreboard");

  useEffect(() => {
    if (!socket || !code) {
      return;
    }

    const persistLeaderboard = async (leaderboard: LeaderboardEntry[], roomPhase: string) => {
      await setDoc(
        doc(db, "rooms", code),
        {
          code,
          phase: roomPhase,
          leaderboard,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    };

    const handleLeaderboard = (payload: LeaderboardUpdate) => {
      if (payload.code !== code) {
        return;
      }

      setPhase(payload.phase);
      setEntries(payload.leaderboard);
      void persistLeaderboard(payload.leaderboard, payload.phase).catch(() => {
        // Keep real-time leaderboard updates responsive even if persistence fails.
      });
    };

    const handleRoomState = (state: RoomState) => {
      if (state.code !== code || state.players.length === 0) {
        return;
      }

      setPhase(state.phase);
      const leaderboard = [...state.players]
        .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
        .map((player, index) => ({
          socketId: player.socketId,
          nickname: player.nickname,
          score: player.score,
          rank: index + 1,
        }));

      setEntries(leaderboard);
    };

    socket.on("leaderboard-updated", handleLeaderboard);
    socket.on("room-state", handleRoomState);

    if (role === "student" && nickname.trim()) {
      socket.emit("join-game", { code, nickname });
    }

    return () => {
      socket.off("leaderboard-updated", handleLeaderboard);
      socket.off("room-state", handleRoomState);
    };
  }, [code, nickname, role, socket]);

  return (
    <div className="min-h-screen bg-purple-100 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Results: {code}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Live phase: <span className="font-semibold text-gray-700">{phase}</span>
        </p>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Leaderboard</h2>
          <Leaderboard entries={entries} />
        </div>
      </div>
    </div>
  );
}
