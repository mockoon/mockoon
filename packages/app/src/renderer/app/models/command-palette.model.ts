import { Observable } from 'rxjs';

export type ScoreAndPositions = [number, number[]] | number;

export type Command = {
  id: string;
  label: string;
  shortcut$?: Observable<string>;
  labelDelimited?: string;
  action: () => void;
  score: number;
  enabled: boolean;
};

export type Commands = Command[];
