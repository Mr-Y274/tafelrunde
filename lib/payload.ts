import type { CityId } from "./games/city-maps";
import type { GameId, GameView, Tempo } from "./games/types";

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
  players: SeatInfo[];
  you: string;
  access: "player";
  view: GameView | null;
  yourTurn: boolean;
};
