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
  status: "waiting" | "playing" | "finished";
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

// Room sync and leaderboard types
export type RoomPhase =
  | "lobby"
  | "multiple_choice"
  | "typing"
  | "scoreboard"
  | "completed";

export interface RoomPlayer {
  socketId: string;
  nickname: string;
  score: number;
  hasSubmitted: boolean;
}

export interface RoomState {
  code: string;
  phase: RoomPhase;
  currentQuestionIndex: number;
  players: RoomPlayer[];
}

export interface LeaderboardEntry {
  socketId: string;
  nickname: string;
  score: number;
  rank: number;
}

export interface LeaderboardUpdate {
  code: string;
  phase: RoomPhase;
  leaderboard: LeaderboardEntry[];
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
// Game types
// export interface Player {
//   id: string;
//   name: string;
//   score: number;
// }

// export interface Question {
//   id: string;
//   text: string;
//   answer: string;
//   timeLimit: number;
// }

// export interface GameState {
//   code: string;
//   players: Player[];
//   currentQuestion: number;
//   status: 'waiting' | 'playing' | 'finished';
// }

// // Typing phase types
// export interface TypingStats {
//   wpm: number;
//   accuracy: number;
//   correctChars: number;
//   totalChars: number;
// }

// // Typing session (stored in sessionStorage)
// export interface TypingSession {
//   code: string;
//   question: Question;
//   gameState: {
//     currentQuestion: number;
//     totalQuestions: number;
//   };
//   startedAt: number;
// }

// export interface LeaderboardEntry {
//   socketId: string;
//   nickname: string;
//   score: number;
//   rank: number;
// }

// export interface LeaderboardUpdate {
//   code: string;
//   phase: RoomPhase;
//   leaderboard: LeaderboardEntry[];
// }

// // WebSocket event types
// export interface WSMessage {
//   type: string;
//   payload: unknown;
// }

// export interface QuizQuestion {
//   prompt: string;
//   options: string[];
//   correctOptionIndex: number;
// }

// export interface Quiz {
//   id?: string;
//   title: string;
//   ownerId?: string;
//   questions: QuizQuestion[];
//   createdAt?: any;
//   updatedAt?: any;
// }

// export interface QuestionSetSummary {
//   id: string;
//   title?: string;
//   ownerId?: string;
//   questions?: QuizQuestion[];
//   questionCount?: number;
//   isExample?: boolean;
// }
