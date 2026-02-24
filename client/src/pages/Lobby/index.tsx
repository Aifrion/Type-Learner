import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);

  const nickname = useMemo(() => {
    const stored = sessionStorage.getItem('nickname');
    if (stored) return stored;
    const generated = `Player-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    sessionStorage.setItem('nickname', generated);
    return generated;
  }, []);

  const wsBase = useMemo(() => {
    return (import.meta.env.VITE_WS_URL as string | undefined) || 'http://localhost:8080';
  }, []);

  // Establish socket connection and join the room
  useEffect(() => {
    if (!code) return;

    const s = wsBase ? io(wsBase) : io();
    setSocket(s);

    s.on('connect', () => {
      setStatus('connected');
      setError(null);
      s.emit('join-game', { code, nickname });
    });

    s.on('room-state', (state: RoomState) => {
      setRoomState(state);
    });

    s.on('connect_error', (err: { message?: string }) => {
      setStatus('error');
      setError(err?.message || 'Connection failed');
    });

    s.on('error', (err: { message?: string }) => {
      setStatus('error');
      setError(err?.message || 'Unknown error');
    });

    s.io.on('reconnect_failed', () => {
      setStatus('error');
      setError('Could not reconnect');
    });

    return () => {
      s.disconnect();
    };
  }, [code, nickname, wsBase]);

  // If server says room is gone, send user back to join page
  useEffect(() => {
    if (!roomState) return;
    if (roomState.code !== code) return;
    // when server evicts, it will stop sending state; we keep last.
  }, [roomState, code]);

  if (!code) return <p>Missing room code.</p>;

  return (
    <div className="min-h-screen bg-[#f4eefc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-purple-100 px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Lobby</p>
              <h1 className="text-3xl font-semibold text-slate-800">{code}</h1>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>Status: {status === 'connected' ? 'Connected' : status}</p>
              <p>Nickname: {nickname}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Players</h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              {roomState?.players?.length ? (
                <ul className="space-y-2">
                  {roomState.players.map((player) => (
                    <li
                      key={player.socketId}
                      className="flex items-center justify-between text-slate-800"
                    >
                      <span>{player.nickname}</span>
                      <span className="text-sm text-slate-600">Score: {player.score}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Waiting for players…</p>
              )}
            </div>
          </div>

          <div>
            <button
              className="mt-6 flex items-center justify-between text-purple-700 font-semibold hover:text-purple-800"
              onClick={() => navigate('/join')}
            >
              Leave lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
