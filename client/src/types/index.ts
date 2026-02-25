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

// Typing phase types
export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
}

// Typing session (stored in sessionStorage)
export interface TypingSession {
  code: string;
  question: Question;
  gameState: {
    currentQuestion: number;
    totalQuestions: number;
  };
  startedAt: number;
}

// WebSocket event types
export interface WSMessage {
  type: string;
  payload: unknown;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  id?: string;
  title: string;
  ownerId?: string;
  questions: QuizQuestion[];
  createdAt?: any;
  updatedAt?: any;
}

export interface QuestionSetSummary {
  id: string;
  title?: string;
  ownerId?: string;
  questions?: QuizQuestion[];
  questionCount?: number;
  isExample?: boolean;
}