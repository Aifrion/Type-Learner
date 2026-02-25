// Type to represent the current state/phase of the game
export type Phase =
  | "lobby"
  | "multiple_choice"
  | "typing"
  | "scoreboard"
  | "completed";

export interface Question {
  prompt: string;

  options: string[];

  correctOptionIndex: number;
}

export interface Player {
  socketId: string; // needed for player specific events

  nickname: string; // Randomly generated nickname

  score: number;

  hasSubmitted: boolean; // has player submitted an answer for the multiple choice
}

export interface AnswerRecord {
  answerIndex: number;
  submittedAt: number;
}

export interface TypingRecord {
  wpm: number;
  accuracy: number;
  submittedAt: number;
}

export class GameRoom {
  code: string;
  hostSocketId: string;
  title: string;
  ownerId: string;
  questions: Question[];
  players: Map<string, Player>;
  phase: Phase;
  currentQuestionIndex: number;
  timerStartedAt: number | null;
  activeTimer: ReturnType<typeof setTimeout> | null;
  mcSubmissions: Map<number, Map<string, AnswerRecord>>;
  typingSubmissions: Map<number, Map<string, TypingRecord>>;
  phaseDurationMs: number;

  constructor(code: string, hostSocketId: string, title: string, ownerId: string, questions: Question[]) {
    this.code = code;
    this.hostSocketId = hostSocketId;
    this.title = title;
    this.ownerId = ownerId;
    this.questions = questions;
    this.players = new Map();
    this.phase = "lobby";
    this.currentQuestionIndex = 0;
    this.timerStartedAt = null;
    this.activeTimer = null;
    this.mcSubmissions = new Map();
    this.typingSubmissions = new Map();
    this.phaseDurationMs = 0;
  }

  addPlayer(player: Player): void {
    this.players.set(player.socketId, player);
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId);
  }

  clearTimer(): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
    }
    this.activeTimer = null;
    this.timerStartedAt = null;
  }
}
