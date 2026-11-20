import type { CityId } from "./games/city-maps";
import type { Blatt, GameId, GameView, Tempo } from "./games/types";

export type SeatInfo = { id: string; name: string; seat: number; ready: boolean };

export type TischData = {
  tables: { id: string; code: string; type: GameId; status: string; seats: number }[];
};

export type TablePayload = {
  id: string;
  code: string;
  type: GameId;
  status: "lobby" | "playing" | "finished";
  hostId: string;
  version: number;
  tempo: Tempo;
  city: CityId;
  memo: 6 | 10 | 15;
  vier: "klein" | "mittel" | "gross";
  blatt: "farbe" | "skat";
  vorrat: 10 | 20 | 30;
  players: SeatInfo[];
  you: string;
  access: "player";
  view: GameView | null;
  yourTurn: boolean;
};
