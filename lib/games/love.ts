export const ANIMALS = [
  { id: "hase", name: "Hase", mark: "🐰", ink: "#8d314c", paper: "#f6c2d2" },
  { id: "baer", name: "Bär", mark: "🐻", ink: "#6a3d1c", paper: "#f0d0a4" },
  { id: "fuchs", name: "Fuchs", mark: "🦊", ink: "#8a3b12", paper: "#f6c7a2" },
  { id: "eule", name: "Eule", mark: "🦉", ink: "#3c346e", paper: "#d8d0f4" },
] as const;

export type LoveAnimal = (typeof ANIMALS)[number]["id"];

export function animalOf(id: LoveAnimal) {
  return ANIMALS.find((animal) => animal.id === id) ?? ANIMALS[0];
}

export const MEMO_FRIENDS = [
  ["Hase", "🐰"],
  ["Bär", "🐻"],
  ["Fuchs", "🦊"],
  ["Eule", "🦉"],
  ["Ente", "🦆"],
  ["Otter", "🦦"],
  ["Panda", "🐼"],
  ["Kätzchen", "🐱"],
  ["Reh", "🦌"],
  ["Pinguin", "🐧"],
  ["Schwan", "🦢"],
  ["Maus", "🐭"],
  ["Igel", "🦔"],
  ["Koala", "🐨"],
  ["Küken", "🐥"],
] as const;
