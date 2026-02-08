// Game types
export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  timeLimit: number;
}

export interface GameState {
  code: string;
  players: Player[];
  currentQuestion: number;
  status: 'waiting' | 'playing' | 'finished';
}

// WebSocket event types
export interface WSMessage {
  type: string;
  payload: unknown;
}
