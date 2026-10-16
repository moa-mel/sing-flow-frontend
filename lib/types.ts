export interface Song {
  id: number;
  title: string;
  lines: string[];
}

export interface SessionStatePayload {
  songId: number | null;
  lineIndex: number;
  song: Song | null;
}

export interface Transcript {
  text: string;
  isFinal: boolean;
}

export interface SearchHit {
  songId: number;
  title: string;
  lineIndex: number;
  score: number;
  remaining: number;
}

export type Role = 'operator' | 'display';
