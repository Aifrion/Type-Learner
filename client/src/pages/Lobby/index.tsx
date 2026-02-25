import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const socket = useSocket();

  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !joined) return;

    const handlePlayerList = ({ players: list }: { players: string[] }) => {
      setPlayers(list);
    };

    const handlePlayerJoined = ({ nickname: name }: { nickname: string }) => {
      setPlayers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    };

    const handlePlayerLeft = ({ nickname: name }: { nickname: string }) => {
      setPlayers((prev) => prev.filter((n) => n !== name));
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    socket.on("player-list", handlePlayerList);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-left", handlePlayerLeft);
    socket.on("error", handleError);

    return () => {
      socket.off("player-list", handlePlayerList);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-left", handlePlayerLeft);
      socket.off("error", handleError);
    };
  }, [socket, joined]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed || !socket || !code) return;

    socket.emit("join-game", { code, nickname: trimmed });
    setJoined(true);
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-purple-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/join")}
            className="mt-4 rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-purple-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-sm">
          <h1 className="text-center text-2xl font-bold text-gray-800">
            Enter Your Nickname
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Room code: <span className="font-semibold tracking-widest text-purple-700">{code}</span>
          </p>

          <form onSubmit={handleJoin} className="mt-6 space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              maxLength={20}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              autoFocus
            />
            <button
              type="submit"
              disabled={!nickname.trim() || !socket}
              className="w-full rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join Game
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/join")}
            className="mt-3 w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Back
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
        <p className="mt-2 text-center text-sm text-gray-500">
          Room code: <span className="font-semibold tracking-widest text-purple-700">{code}</span>
        </p>

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
              {players.map((name) => (
                <li
                  key={name}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Waiting for the host to start the game...
        </p>
      </div>
    </div>
  );
}
