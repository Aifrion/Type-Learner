import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type RoomState = {
  code: string;
  phase: string;
  currentQuestionIndex: number;
  question: { text: string; options?: string[] } | null;
  players: Array<{ socketId: string; nickname: string; score: number; hasSubmitted: boolean }>;
};

export default function DebugRoom() {
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("Player");
  const [logs, setLogs] = useState<string[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  useEffect(() => {
    const s = io(serverUrl, { autoConnect: false });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [serverUrl]);

  useEffect(() => {
    if (!socket) return;
    socket.connect();
    socket.on("game-created", ({ code }) => {
      setRoomCode(code);
      pushLog(`game-created ${code}`);
    });
    socket.on("joined-room", ({ code, phase }) => pushLog(`joined ${code}, phase ${phase}`));
    socket.on("room-state", (state) => {
      setRoomState(state);
      pushLog(`room-state phase=${state.phase} q=${state.currentQuestionIndex}`);
    });
    socket.on("game-ended", (data) => pushLog(`game-ended ${JSON.stringify(data)}`));
    socket.on("error", (err) => pushLog(`error: ${JSON.stringify(err)}`));
    return () => {
      socket.off("game-created");
      socket.off("joined-room");
      socket.off("room-state");
      socket.off("game-ended");
      socket.off("error");
    };
  }, [socket]);

  const pushLog = (line: string) => {
    setLogs((prev) => [line, ...prev].slice(0, 20));
  };

  const disableActions = !socket;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Debug Room</h1>

      <div className="flex gap-2 items-center">
        <label className="text-sm">Server URL</label>
        <input
          className="border px-2 py-1 rounded"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          disabled={disableActions}
          className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
          onClick={() => socket?.emit("create-game", { questions: SAMPLE_QUESTIONS })}
        >
          Create Game
        </button>

        <input
          className="border px-2 py-1 rounded"
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <input
          className="border px-2 py-1 rounded"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button
          disabled={disableActions}
          className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50"
          onClick={() => socket?.emit("join-game", { code: roomCode, nickname })}
        >
          Join Game
        </button>
        <button
          disabled={disableActions}
          className="bg-purple-600 text-white px-3 py-2 rounded disabled:opacity-50"
          onClick={() => socket?.emit("start-game", { code: roomCode })}
        >
          Start Game
        </button>
        <button
          disabled={disableActions}
          className="bg-orange-600 text-white px-3 py-2 rounded disabled:opacity-50"
          onClick={() => socket?.emit("submit-mc", { code: roomCode, answerIndex: 0 })}
        >
          Submit MC (0)
        </button>
        <button
          disabled={disableActions}
          className="bg-teal-600 text-white px-3 py-2 rounded disabled:opacity-50"
          onClick={() => socket?.emit("submit-typing", { code: roomCode, wpm: 50, accuracy: 95 })}
        >
          Submit Typing
        </button>
        <button
          disabled={disableActions}
          className="bg-gray-700 text-white px-3 py-2 rounded disabled:opacity-50"
          onClick={() => socket?.emit("advance-phase", { code: roomCode })}
        >
          Advance Phase
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Room State</h2>
          <pre className="text-xs whitespace-pre-wrap">
{JSON.stringify(roomState, null, 2)}
          </pre>
        </div>
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Logs</h2>
          <ul className="text-xs space-y-1">
            {logs.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_QUESTIONS = [
  {
    text: "What is 2+2?",
    options: ["3", "4", "5", "6"],
    correctAnswerIndex: 1,
    correctAnswerText: "4",
  },
  {
    text: "What is the capital of France?",
    options: ["Paris", "London", "Rome", "Berlin"],
    correctAnswerIndex: 0,
    correctAnswerText: "Paris",
  },
];
