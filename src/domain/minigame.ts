import type { ISODate, MiniGameId, UserId } from "./common";

export interface MiniGame {
  id: MiniGameId;
  /** e.g. "/minigames/hacking" */
  route: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface ScoreEntry {
  miniGameId: MiniGameId;
  userId?: UserId;
  score: number;
  achievedAt: ISODate;
}
