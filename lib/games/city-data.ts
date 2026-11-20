import { BARCELONA } from "./maps/barcelona";
import { LONDON } from "./maps/london";
import { PARIS } from "./maps/paris";

export type CityId = "london" | "paris" | "barcelona";
export type Transit = "taxi" | "bus" | "ug" | "water";
export type CityStation = { id: number; x: number; y: number; modes: Exclude<Transit, "water">[] };
export type CityEdge = { a: number; b: number; mode: Transit; via?: number[] };
export type CityMark = { name: string; x: number; y: number };
export type CityMap = {
  id: CityId;
  name: string;
  image: string;
  width: number;
  height: number;
  stations: CityStation[];
  edges: CityEdge[];
  starts: number[];
  sights: { id: number; name: string }[];
  masts: { id: number; name: string }[];
  radios: CityMark[];
  parks: { name: string; x: number; y: number; rx: number; ry: number }[];
  labels: CityMark[];
  river: { x: number; y: number }[];
  opening: { kurz: number[]; voll: number[] };
  meetPool: number[];
};

export const CITY_MAPS: CityMap[] = [LONDON, PARIS, BARCELONA];
