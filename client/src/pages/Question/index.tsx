import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import Timer from "@/pages/Game/components/Timer";

type RoomPlayer = {
  socketId: string;
  nickname: string;
  score: number;
  hasSubmitted?: boolean;
};

type RoomQuestion = {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
};

type RoomState = {
  code: string;
  phase: "lobby" | "multiple_choice" | "typing" | "completed" | string;
  currentQuestionIndex: number;
  question: RoomQuestion | null;
  players: RoomPlayer[];
  timerStartedAt?: number | null;
  phaseDurationMs?: number;
};

export default function Question() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const socket = useSocket();

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !code) return;

    const handleConnect = () => {
      setStatus("connected");
      setError(null);
      socket.emit("request-room-state", { code });
    };

    const handleRoomState = (state: RoomState) => {
      setRoomState(state);
    };

    const handleError = (err: { message?: string }) => {
      setStatus("error");
      setError(err?.message || "Unknown error");
      setIsSubmitting(false);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("room-state", handleRoomState);
    socket.on("connect_error", handleError);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("room-state", handleRoomState);
      socket.off("connect_error", handleError);
      socket.off("error", handleError);
    };
  }, [socket, code]);

  useEffect(() => {
    if (!roomState || !code) return;
    if (roomState.phase === "typing") {
      navigate(`/typing/${code}`, { replace: true });
      return;
    }
    if (roomState.phase === "completed") {
      navigate(`/results/${code}`, { replace: true });
      return;
    }
    if (roomState.phase === "lobby") {
      navigate(`/lobby/${code}`, { replace: true });
    }
  }, [roomState, code, navigate]);

  useEffect(() => {
    setIsSubmitting(false);
    setSelectedIndex(null);
  }, [roomState?.currentQuestionIndex]);

  if (!code) return <p>Missing room code.</p>;

  const isHost = sessionStorage.getItem("hostRoomCode") === code;
  const currentPlayer = roomState?.players.find((player) => player.socketId === socket?.id);
  const hasSubmitted = Boolean(currentPlayer?.hasSubmitted);
  const question = roomState?.question;
  const phaseDurationSeconds = Math.max(
    1,
    Math.ceil((roomState?.phaseDurationMs ?? 15_000) / 1000)
  );
  const phaseEndsAt =
    roomState?.timerStartedAt && roomState?.phaseDurationMs
      ? roomState.timerStartedAt + roomState.phaseDurationMs
      : undefined;
  const canSubmit =
    roomState?.phase === "multiple_choice" &&
    question &&
    !isHost &&
    !hasSubmitted &&
    !isSubmitting;

  const handleSubmit = (answerIndex: number) => {
    if (!canSubmit || !socket || !code) return;
    setSelectedIndex(answerIndex);
    setIsSubmitting(true);
    socket.emit("submit-mc", { code, answerIndex });
  };

  return (
    <div className="min-h-screen bg-[#f4eefc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-purple-100 px-8 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-800">Multiple Choice</h1>
            <div className="text-right space-y-1">
              <p className="text-sm text-slate-600">
                Status: {status === "connected" ? "Connected" : status}
              </p>
              <Timer
                duration={phaseDurationSeconds}
                endsAtMs={phaseEndsAt}
                onTimeUp={() => {}}
                isRunning={Boolean(question) && roomState?.phase === "multiple_choice"}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {!question ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-slate-600">
              Waiting for question...
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-lg font-medium text-slate-800">{question.prompt}</p>
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => handleSubmit(index)}
                    disabled={!canSubmit}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                      selectedIndex === index
                        ? "border-purple-500 bg-purple-50 text-purple-800"
                        : "border-slate-200 bg-white text-slate-800"
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {isHost && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Host view is read-only for answers.
                </div>
              )}
              {(hasSubmitted || isSubmitting) && (
                <p className="text-sm text-slate-600">
                  Answer submitted. Waiting for next phase...
                </p>
              )}
              {isHost && (
                <button
                  type="button"
                  onClick={() => socket?.emit("advance-phase", { code })}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Advance Phase
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
