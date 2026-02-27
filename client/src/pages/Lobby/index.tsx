import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { getOrCreateNickname } from "@/utils/nicknameGenerator";

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

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const socket = useSocket();

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nickname = useMemo(() => {
    return getOrCreateNickname();
  }, []);

  const serverNickname = roomState?.players.find(
    (player) => player.socketId === socket?.id,
  )?.nickname;
  const displayNickname = serverNickname ?? nickname;

  useEffect(() => {
    if (!socket || !code) return;

    const handleConnect = () => {
      socket.emit("join-game", { code, nickname });
    };

    const handleRoomState = (state: RoomState) => {
      setRoomState(state);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("room-state", handleRoomState);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("room-state", handleRoomState);
      socket.off("error", handleError);
    };
  }, [socket, code, nickname]);

  useEffect(() => {
    if (!roomState || !code) return;

    if (roomState.phase === "multiple_choice") {
      navigate(`/question/${code}`, { replace: true });
      return;
    }
    if (roomState.phase === "typing") {
      navigate(`/typing/${code}`, { replace: true });
      return;
    }
    if (roomState.phase === "completed") {
      navigate(`/results/${code}`, { replace: true });
    }
  }, [roomState, code, navigate]);

  useEffect(() => {
    if (!serverNickname || serverNickname === nickname) return;
    sessionStorage.setItem("nickname", serverNickname);
  }, [serverNickname, nickname]);

  if (!code) return <p>Missing room code.</p>;

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-purple-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Lobby
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Room code: <span className="font-semibold tracking-widest text-purple-700">{code}</span>
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Your nickname: <span className="font-semibold text-purple-700">{displayNickname}</span>
        </p>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-600">
            Players ({roomState?.players?.length ?? 0})
          </h2>
          {!roomState?.players?.length ? (
            <p className="mt-2 text-sm text-gray-400">
              Waiting for players to join...
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {roomState.players.map((player) => (
                <li
                  key={player.socketId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  <span>{player.nickname}</span>
                  <span className="text-xs text-gray-400">Score: {player.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Waiting for the host to start the game...
        </p>

        <button
          type="button"
          onClick={() => navigate("/join")}
          className="mt-3 w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Leave Lobby
        </button>
      </div>
    </div>
  );
}
