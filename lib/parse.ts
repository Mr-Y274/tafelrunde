import { PublicError } from "./errors";
import { PEN_SIZES, PENCILS } from "./games/sketch";
import type { LoveAnimal } from "./games/love";
import type { Action, ShipId, Suit, TravelTicket, UnoColor } from "./games/types";

const SHIPS: ShipId[] = ["schlacht", "kreuzer", "zerstorer", "uboot", "boot"];
const SUITS: Suit[] = ["rot", "gelb", "gruen", "blau"];
const TICKETS: TravelTicket[] = ["taxi", "bus", "ug", "black"];
const RIDES = [...TICKETS, "heli"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOVE: LoveAnimal[] = ["hase", "baer", "fuchs", "eule"];

export type Command =
  | { type: "ready"; ready: boolean }
  | { type: "start" }
  | { type: "leave" }
  | { type: "options"; tempo?: "kurz" | "voll"; city?: "london" | "paris" | "barcelona" }
  | { type: "invite"; username: string }
  | { type: "kick"; userId: string }
  | Action;

function record(input: unknown) {
  if (!input || typeof input !== "object") throw new PublicError("Unlesbare Aktion.");
  return input as Record<string, unknown>;
}

function cardId(value: unknown) {
  if (typeof value !== "string" || value.length < 1 || value.length > 40) throw new PublicError("Die Karte fehlt.");
  return value;
}

function int(value: unknown, min: number, max: number, message: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw new PublicError(message);
  return value;
}

export function parseCommand(input: unknown): { version: number; command: Command } {
  const body = record(input);
  const version = int(body.version, 0, 1_000_000, "Der Tischstand fehlt.");
  const type = body.type;
  if (type === "ready") return { version, command: { type, ready: body.ready === true } };
  if (
    type === "start" ||
    type === "leave" ||
    type === "undo" ||
    type === "clear" ||
    type === "skip" ||
    type === "uno-draw" ||
    type === "uno-pass" ||
    type === "uno-catch" ||
    type === "memo-hide" ||
    type === "mau-draw" ||
    type === "mau-keep"
  ) {
    return { version, command: { type } };
  }
  if (type === "options") {
    const tempo = body.tempo === "kurz" || body.tempo === "voll" ? body.tempo : undefined;
    const city = body.city === "london" || body.city === "paris" || body.city === "barcelona" ? body.city : undefined;
    if (!tempo && !city) throw new PublicError("Die Einstellung stimmt nicht.");
    return { version, command: { type, tempo, city } };
  }
  if (type === "invite") {
    if (typeof body.username !== "string") throw new PublicError("Der Benutzername fehlt.");
    return { version, command: { type, username: body.username.trim() } };
  }
  if (type === "kick") {
    if (typeof body.userId !== "string" || !UUID.test(body.userId)) throw new PublicError("Diese Person sitzt hier nicht.");
    return { version, command: { type, userId: body.userId } };
  }
  if (type === "bid") return { version, command: { type, n: int(body.n, 0, 20, "Die Ansage stimmt nicht.") } };
  if (type === "trump" || type === "uno-color") {
    if (!SUITS.includes(body.suit as Suit) && !SUITS.includes(body.color as Suit)) throw new PublicError("Diese Farbe gibt es nicht.");
    if (type === "trump") return { version, command: { type, suit: body.suit as Suit } };
    return { version, command: { type, color: body.color as UnoColor } };
  }
  if (type === "card" || type === "uno-play") {
    if (typeof body.id !== "string" || body.id.length < 1 || body.id.length > 80) throw new PublicError("Die Karte fehlt.");
    if (type === "card") return { version, command: { type, id: body.id } };
    const color = body.color == null ? undefined : (body.color as UnoColor);
    if (color && !SUITS.includes(color)) throw new PublicError("Diese Farbe gibt es nicht.");
    return { version, command: { type, id: body.id, color, uno: body.uno === true } };
  }
  if (type === "uno-challenge") return { version, command: { type, challenge: body.challenge === true } };
  if (type === "shoot") {
    return {
      version,
      command: { type, x: int(body.x, 0, 9, "Das Feld liegt außerhalb."), y: int(body.y, 0, 9, "Das Feld liegt außerhalb.") },
    };
  }
  if (type === "place") {
    if (!Array.isArray(body.ships) || body.ships.length !== 5) throw new PublicError("Es müssen alle fünf Schiffe sein.");
    const ships = body.ships.map((ship) => {
      const item = record(ship);
      if (!SHIPS.includes(item.id as ShipId)) throw new PublicError("Unbekanntes Schiff.");
      if (item.dir !== "h" && item.dir !== "v") throw new PublicError("Die Richtung stimmt nicht.");
      const dir: "h" | "v" = item.dir === "v" ? "v" : "h";
      return {
        id: item.id as ShipId,
        x: int(item.x, 0, 9, "Ein Schiff liegt außerhalb."),
        y: int(item.y, 0, 9, "Ein Schiff liegt außerhalb."),
        dir,
      };
    });
    return { version, command: { type, ships } };
  }
  if (type === "sy-start") return { version, command: { type, station: int(body.station, 1, 199, "Diese Station gibt es nicht.") } };
  if (type === "sy-probe") {
    if (body.kind !== "analyse" && body.kind !== "ortung" && body.kind !== "abtasten" && body.kind !== "befragung") {
      throw new PublicError("Diese Ermittlung gibt es nicht.");
    }
    return { version, command: { type, kind: body.kind } };
  }
  if (type === "sy-move") {
    if (!RIDES.includes(body.ticket as (typeof RIDES)[number])) throw new PublicError("Dieses Ticket gibt es nicht.");
    const doubleTo = body.doubleTo == null ? undefined : int(body.doubleTo, 1, 199, "Diese Station gibt es nicht.");
    const doubleTicket = body.doubleTicket == null ? undefined : (body.doubleTicket as TravelTicket);
    if (doubleTicket && !TICKETS.includes(doubleTicket)) throw new PublicError("Dieses Ticket gibt es nicht.");
    if ((doubleTo == null) !== (doubleTicket == null)) throw new PublicError("Der Doppelzug ist unvollständig.");
    return {
      version,
      command: {
        type,
        to: int(body.to, 1, 199, "Diese Station gibt es nicht."),
        ticket: body.ticket as (typeof RIDES)[number],
        doubleTo,
        doubleTicket,
      },
    };
  }
  if (type === "zehn-draw") {
    if (body.from !== "deck" && body.from !== "ablage") throw new PublicError("Dort kann man nicht ziehen.");
    return { version, command: { type, from: body.from } };
  }
  if (type === "zehn-lay") {
    if (!Array.isArray(body.groups) || body.groups.length < 1 || body.groups.length > 3) throw new PublicError("Die Gruppen fehlen.");
    const groups = body.groups.map((group) => {
      if (!Array.isArray(group) || group.length < 2 || group.length > 12) throw new PublicError("Eine Gruppe hat die falsche Größe.");
      return group.map((id) => cardId(id));
    });
    return { version, command: { type, groups } };
  }
  if (type === "zehn-hit") {
    const edge = body.edge == null ? undefined : body.edge === "low" || body.edge === "high" ? body.edge : null;
    if (edge === null) throw new PublicError("Das Ende der Reihe stimmt nicht.");
    return { version, command: { type, group: int(body.group, 0, 40, "Die Gruppe gibt es nicht."), id: cardId(body.id), edge } };
  }
  if (type === "zehn-discard") return { version, command: { type, id: cardId(body.id) } };
  if (type === "stapel-play") {
    if (body.from !== "hand" && body.from !== "stock" && body.from !== "ablage") throw new PublicError("Dort liegt die Karte nicht.");
    const id = body.id == null ? undefined : cardId(body.id);
    const slot = body.slot == null ? undefined : int(body.slot, 0, 3, "Die Ablage gibt es nicht.");
    return { version, command: { type, from: body.from, id, pile: int(body.pile, 0, 3, "Den Baustapel gibt es nicht."), slot } };
  }
  if (type === "stapel-end") {
    const id = body.id == null ? undefined : cardId(body.id);
    return { version, command: { type, id, slot: int(body.slot, 0, 3, "Die Ablage gibt es nicht.") } };
  }
  if (type === "memo-flip") return { version, command: { type, index: int(body.index, 0, 40, "Die Karte liegt nicht da.") } };
  if (type === "vier-drop") return { version, command: { type, col: int(body.col, 0, 6, "Die Spalte gibt es nicht.") } };
  if (type === "mau-play") {
    const animal = body.animal == null ? undefined : (body.animal as LoveAnimal);
    if (animal && !LOVE.includes(animal)) throw new PublicError("Dieses Tier gibt es nicht.");
    return { version, command: { type, id: cardId(body.id), animal } };
  }
  if (type === "guess") {
    if (typeof body.text !== "string") throw new PublicError("Der Tipp fehlt.");
    return { version, command: { type, text: body.text } };
  }
  if (type === "stroke") {
    if (typeof body.color !== "string" || !PENCILS.includes(body.color as (typeof PENCILS)[number])) {
      throw new PublicError("Diese Farbe gibt es nicht.");
    }
    if (!PEN_SIZES.includes(body.size as (typeof PEN_SIZES)[number])) throw new PublicError("Diese Strichstärke gibt es nicht.");
    if (!Array.isArray(body.points) || body.points.length < 1 || body.points.length > 200) throw new PublicError("Der Strich ist ungültig.");
    const points = body.points.map((point) => {
      if (!Array.isArray(point) || point.length < 2) throw new PublicError("Der Strich ist ungültig.");
      const x = Number(point[0]);
      const y = Number(point[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new PublicError("Der Strich ist ungültig.");
      return [x, y] as [number, number];
    });
    return { version, command: { type, color: body.color, size: body.size as number, points } };
  }
  throw new PublicError("Unbekannte Aktion.");
}
