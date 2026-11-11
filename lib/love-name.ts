const FIRST = ["love", "honey", "sweet", "rosy", "cuddle", "kiss", "dear", "sugar", "heart", "peach", "cherry", "velvet", "darling", "bunny", "teddy", "bloom", "cozy", "snug", "soft", "warm"];
const SECOND = ["teddy", "teddi", "heart", "peach", "rose", "bunny", "dove", "muffin", "cookie", "blossom", "kiss", "honey", "petal", "moon", "star", "pie", "cup", "bug", "bean", "bloom"];

export function rollLoveName(rng: () => number = Math.random) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const first = FIRST[Math.floor(rng() * FIRST.length)]!;
    const second = SECOND[Math.floor(rng() * SECOND.length)]!;
    if (first === second) continue;
    return `${first}${second}`;
  }
  return `loveteddi${Math.floor(rng() * 90 + 10)}`;
}
