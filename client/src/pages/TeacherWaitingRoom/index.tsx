import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { useSocket } from "@/hooks/useSocket";
import type { QuestionSetSummary } from "@/types";

type Player = {
  socketId: string;
  nickname: string;
  score: number;
};

type RoomState = {
  code: string;
  phase: string;
  currentQuestionIndex: number;
  players: Player[];
};

export default function TeacherWaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const set = (location.state as { set?: QuestionSetSummary })?.set;
  const socket = useSocket();

  const [code, setCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  useEffect(() => {
    if (!set || !set.questions?.length) {
      navigate("/host/dashboard", { replace: true });
      return;
    }

    if (!socket) return;

    const handleConnect = () => {
      socket.emit("create-game", {
        title: set.title ?? "Untitled",
        ownerId: set.ownerId ?? auth.currentUser?.uid ?? "",
        questions: set.questions,
      });
    };

    const handleGameCreated = ({ code: roomCode }: { code: string }) => {
      setCode(roomCode);
      sessionStorage.setItem("hostRoomCode", roomCode);
    };

    const handleRoomState = (state: RoomState) => {
      setPhase(state.phase);
      setPlayers(state.players);
    };

    const handleConnectError = (err: Error) => {
      setError(err.message || "Failed to connect to server.");
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("game-created", handleGameCreated);
    socket.on("room-state", handleRoomState);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("game-created", handleGameCreated);
      socket.off("room-state", handleRoomState);
      socket.off("connect_error", handleConnectError);
    };
  }, [set, navigate, socket]);

  useEffect(() => {
    if (!code) return;
    if (phase === "multiple_choice") {
      navigate(`/question/${code}`, { replace: true });
      return;
    }
    if (phase === "typing") {
      navigate(`/typing/${code}`, { replace: true });
      return;
    }
    if (phase === "completed") {
      navigate(`/results/${code}`, { replace: true });
    }
  }, [phase, code, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-purple-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/host/dashboard")}
            className="mt-4 rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    } finally {
      setTimeout(() => setCopyStatus("idle"), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-purple-100 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <section className="rounded-3xl bg-white px-5 py-8 shadow-sm md:px-10 md:py-12">
          {code ? (
            <div className="flex flex-col items-center">
              <p className="text-xl text-gray-500 md:text-4xl">
                Join at type-learner
              </p>
              <div className="mt-4 rounded-3xl bg-purple-50 px-8 py-4 md:mt-6 md:px-14 md:py-6">
                <span className="text-5xl font-bold tracking-[0.2em] text-purple-700 md:text-8xl">
                  {code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-lg font-semibold text-gray-700 transition hover:bg-gray-100 md:mt-6 md:px-6 md:py-3 md:text-2xl"
              >
                {copyStatus === "copied" ? "Copied!" : "Copy Code"}
              </button>
              {copyStatus === "failed" && (
                <p className="mt-2 text-xs text-red-600 md:text-base">
                  Could not copy code. Please copy it manually.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 md:text-xl">
              Creating room...
            </p>
          )}
        </section>

        <section className="mt-7 rounded-3xl bg-white px-5 py-6 shadow-sm md:mt-8 md:px-8 md:py-8">
          <div className="mb-5 flex items-center gap-3 md:mb-6">
            <h2 className="text-3xl font-bold text-gray-800 md:text-5xl">
              Participants
            </h2>
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-purple-600 px-2 text-sm font-semibold text-white md:h-10 md:min-w-10 md:text-lg">
              {players.length}
            </span>
          </div>

          {players.length === 0 ? (
            <p className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-gray-500 md:px-6 md:py-4 md:text-xl">
              No participants yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {players.map((player) => (
                <li
                  key={player.socketId}
                  className="flex items-center justify-center rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 md:px-4 md:py-3"
                >
                  <span className="truncate text-center text-2xl font-medium text-gray-800 md:text-4xl">
                    {player.nickname}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <button
            type="button"
            disabled={players.length < 1}
            onClick={() => {
              if (socket && code) {
                socket.emit("start-game", { code });
              }
            }}
            className="rounded-lg bg-purple-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:py-4 md:text-2xl"
          >
            Start Game
          </button>

          <button
            type="button"
            onClick={() => {
              if (code && sessionStorage.getItem("hostRoomCode") === code) {
                sessionStorage.removeItem("hostRoomCode");
              }
              navigate("/host/dashboard");
            }}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-semibold text-gray-700 transition hover:bg-gray-100 md:py-4 md:text-2xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
