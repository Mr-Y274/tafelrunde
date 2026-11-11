import type { ShipId } from "./types";

export const FLEET: { id: ShipId; name: string; len: number }[] = [
  { id: "schlacht", name: "Schlachtschiff", len: 5 },
  { id: "kreuzer", name: "Kreuzer", len: 4 },
  { id: "zerstorer", name: "Zerstörer", len: 3 },
  { id: "uboot", name: "U-Boot", len: 3 },
  { id: "boot", name: "Boot", len: 2 },
];

export function fleetMeta(id: ShipId) {
  return FLEET.find((ship) => ship.id === id)!;
}
