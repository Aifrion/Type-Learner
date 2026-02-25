import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { useSocket } from "@/hooks/useSocket";
import type { QuestionSetSummary } from "@/types";

export default function TeacherWaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const set = (location.state as { set?: QuestionSetSummary })?.set;
  const socket = useSocket();

  const [code, setCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    };

    const handlePlayerJoined = ({ nickname }: { nickname: string }) => {
      setPlayers((prev) => [...prev, nickname]);
    };

    const handlePlayerLeft = ({ nickname }: { nickname: string }) => {
      setPlayers((prev) => prev.filter((n) => n !== nickname));
    };

    const handleConnectError = (err: Error) => {
      setError(err.message || "Failed to connect to server.");
    };

    // If already connected, emit immediately; otherwise wait for connect
    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("game-created", handleGameCreated);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("game-created", handleGameCreated);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-left", handlePlayerLeft);
      socket.off("connect_error", handleConnectError);
    };
  }, [set, navigate, socket]);

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-purple-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Waiting Room
        </h1>

        {code ? (
          <>
            <p className="mt-2 text-center text-sm text-gray-500">
              Share this code with your students
            </p>
            <div className="mt-4 rounded-xl bg-purple-50 py-4 text-center">
              <span className="text-4xl font-bold tracking-widest text-purple-700">
                {code}
              </span>
            </div>
          </>
        ) : (
          <p className="mt-4 text-center text-sm text-gray-500">
            Creating room...
          </p>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-600">
            Players ({players.length})
          </h2>
          {players.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">
              Waiting for players to join...
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {players.map((nickname) => (
                <li
                  key={nickname}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  {nickname}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          disabled={players.length < 1}
          className="mt-6 w-full rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Game
        </button>

        <button
          type="button"
          onClick={() => navigate("/host/dashboard")}
          className="mt-3 w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
