import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Question, TypingStats } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import TypingPhase from "./components/TypingPhase";

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
  totalQuestions?: number;
  question: RoomQuestion | null;
  players: RoomPlayer[];
  timerStartedAt?: number | null;
  phaseDurationMs?: number;
};

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const socket = useSocket();

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (roomState.phase === "multiple_choice") {
      navigate(`/question/${code}`, { replace: true });
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
  }, [roomState?.currentQuestionIndex]);

  if (!code) return <p>Missing room code.</p>;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <p className="text-red-600">Socket error: {error}</p>
      </div>
    );
  }

  if (!roomState || !roomState.question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <p className="text-gray-600">
          {status === "connected" ? "Waiting for typing phase..." : "Connecting..."}
        </p>
      </div>
    );
  }

  if (roomState.phase !== "typing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <p className="text-gray-600">Waiting for typing phase...</p>
      </div>
    );
  }

  const isHost = sessionStorage.getItem("hostRoomCode") === code;
  const answerIndex = roomState.question.correctOptionIndex;
  const answerText =
    roomState.question.options[answerIndex] ?? roomState.question.options[0] ?? "";
  const phaseDurationSeconds = Math.max(
    1,
    Math.ceil((roomState.phaseDurationMs ?? 30_000) / 1000)
  );
  const phaseEndsAt =
    roomState.timerStartedAt && roomState.phaseDurationMs
      ? roomState.timerStartedAt + roomState.phaseDurationMs
      : undefined;

  const typingQuestion: Question = {
    id: `${roomState.code}-${roomState.currentQuestionIndex}`,
    text: roomState.question.prompt,
    answer: answerText,
    timeLimit: phaseDurationSeconds,
  };

  const totalQuestions =
    roomState.totalQuestions ??
    (roomState.currentQuestionIndex + 1 > 0 ? roomState.currentQuestionIndex + 1 : 1);
  const currentPlayer = roomState.players.find((player) => player.socketId === socket?.id);
  const hasSubmitted = Boolean(currentPlayer?.hasSubmitted);
  const totalPlayers = roomState.players?.length ?? 0;
  const submittedCount =
    roomState.players?.filter((player) => player.hasSubmitted)?.length ?? 0;
  const submissionPct = totalPlayers > 0 ? (submittedCount / totalPlayers) * 100 : 0;
  const allSubmitted = totalPlayers > 0 && submittedCount === totalPlayers;

  const handlePhaseComplete = (stats: TypingStats) => {
    if (isHost || hasSubmitted || isSubmitting || !socket || !code) return;
    setIsSubmitting(true);
    socket.emit("submit-typing", {
      code,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
    });
  };

  return (
    <div>
      <TypingPhase
        question={typingQuestion}
        currentQuestionNumber={roomState.currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        onPhaseComplete={handlePhaseComplete}
        readOnly={isHost}
        phaseEndsAt={phaseEndsAt}
      />
      {isHost && (
        <>
          <div className="fixed top-6 right-6 w-64 rounded-2xl border border-purple-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-sm font-semibold text-purple-800">
              <span>Finished typing</span>
              <span>
                {submittedCount}/{totalPlayers || "–"}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-purple-100">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${submissionPct}%` }}
                aria-label={`Finished ${submittedCount} of ${totalPlayers}`}
              />
            </div>
            <p className="mt-1 text-xs text-purple-700">
              {allSubmitted
                ? "Everyone's done. Auto-advancing shortly."
                : "Live as players submit."}
            </p>
          </div>

          <div className="fixed bottom-6 right-6">
            <button
              type="button"
              onClick={() => socket?.emit("advance-phase", { code })}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700"
            >
              Advance Phase
            </button>
          </div>
        </>
      )}
    </div>
  );
}
