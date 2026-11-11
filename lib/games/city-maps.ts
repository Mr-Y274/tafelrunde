import { CITY_MAPS, type CityEdge, type CityId, type CityMap, type Transit } from "./city-data";

const MAPS = new Map(CITY_MAPS.map((city) => [city.id, city]));

type Index = Record<Transit, Map<number, number[]>>;

const INDEX = new Map<CityId, Index>();

function indexOf(id: CityId): Index {
  const cached = INDEX.get(id);
  if (cached) return cached;
  const city = cityMap(id);
  const index: Index = { taxi: new Map(), bus: new Map(), ug: new Map(), water: new Map() };
  for (const spot of city.stations) {
    index.taxi.set(spot.id, []);
    index.bus.set(spot.id, []);
    index.ug.set(spot.id, []);
    index.water.set(spot.id, []);
  }
  for (const edge of city.edges) {
    index[edge.mode].get(edge.a)?.push(edge.b);
    index[edge.mode].get(edge.b)?.push(edge.a);
  }
  INDEX.set(id, index);
  return index;
}

export function cityMap(id: CityId | undefined): CityMap {
  return MAPS.get(id ?? "london") ?? CITY_MAPS[0]!;
}

export function cityLinks(id: CityId | undefined, station: number, mode: Transit) {
  return indexOf(id ?? "london")[mode].get(station) ?? [];
}

export function cityStation(id: CityId | undefined, station: number) {
  return cityMap(id).stations.find((spot) => spot.id === station);
}

export function citySegments(id: CityId | undefined): CityEdge[] {
  return cityMap(id).edges;
}

export function cityConnected(id: CityId | undefined) {
  const city = cityMap(id);
  const seen = new Set<number>([city.stations[0]?.id ?? 0]);
  const queue = [...seen];
  while (queue.length) {
    const current = queue.pop()!;
    for (const mode of ["taxi", "bus", "ug", "water"] as const) {
      for (const next of cityLinks(id, current, mode)) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === city.stations.length;
}

export type { CityId };
