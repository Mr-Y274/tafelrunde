export type RiskoSymbol = "inf" | "kav" | "art" | "joker";

export type RiskoPoint = [number, number];

export type RiskoLand = {
  id: string;
  name: string;
  realm: string;
  symbol: RiskoSymbol;
  points: RiskoPoint[];
};

export type RiskoRealm = { id: string; name: string; color: string; bonus: number };

export const RISKO_REALMS: RiskoRealm[] = [
  { id: "nordamerika", name: "Nordamerika", color: "#d4a24a", bonus: 5 },
  { id: "suedamerika", name: "Südamerika", color: "#c46a4a", bonus: 2 },
  { id: "europa", name: "Europa", color: "#6f8fbf", bonus: 5 },
  { id: "afrika", name: "Afrika", color: "#c9843a", bonus: 3 },
  { id: "asien", name: "Asien", color: "#6e9a62", bonus: 7 },
  { id: "australien", name: "Australien", color: "#8d6baf", bonus: 2 },
];

const symbolAt = (index: number): RiskoSymbol => (["inf", "kav", "art"] as const)[index % 3]!;

function land(index: number, id: string, name: string, realm: string, points: RiskoPoint[]): RiskoLand {
  return { id, name, realm, symbol: symbolAt(index), points };
}

export const RISKO_BOARD = { width: 1280, height: 680 };

export const RISKO_LANDS: RiskoLand[] = [
  land(0, "alaska", "Alaska", "nordamerika", [[24, 70], [78, 38], [130, 42], [154, 118], [86, 146], [24, 124]]),
  land(1, "nordwest", "Nordwest-Territorium", "nordamerika", [[130, 42], [210, 24], [250, 30], [268, 112], [176, 128], [154, 118]]),
  land(2, "groenland", "Grönland", "nordamerika", [[268, 24], [340, 12], [400, 16], [412, 120], [300, 136], [268, 112]]),
  land(3, "alberta", "Alberta", "nordamerika", [[24, 124], [86, 146], [154, 118], [176, 128], [164, 204], [30, 190]]),
  land(4, "ontario", "Ontario", "nordamerika", [[176, 128], [268, 112], [300, 136], [286, 210], [164, 204]]),
  land(5, "quebec", "Québec", "nordamerika", [[300, 136], [412, 120], [430, 168], [396, 214], [286, 210]]),
  land(6, "weststaaten", "Weststaaten", "nordamerika", [[30, 190], [164, 204], [176, 276], [48, 268], [40, 262]]),
  land(7, "oststaaten", "Oststaaten", "nordamerika", [[164, 204], [286, 210], [396, 214], [360, 270], [298, 286], [176, 276]]),
  land(8, "mittelamerika", "Mittelamerika", "nordamerika", [[40, 262], [176, 276], [298, 286], [196, 352], [112, 378], [32, 318]]),
  land(9, "venezuela", "Venezuela", "suedamerika", [[196, 352], [268, 328], [310, 334], [296, 408], [184, 400]]),
  land(10, "peru", "Peru", "suedamerika", [[184, 400], [296, 408], [264, 502], [190, 490], [166, 478]]),
  land(11, "brasilien", "Brasilien", "suedamerika", [[296, 408], [360, 376], [420, 382], [430, 450], [404, 516], [264, 502]]),
  land(12, "argentinien", "Argentinien", "suedamerika", [[166, 478], [264, 502], [404, 516], [360, 590], [318, 640], [210, 628], [188, 604]]),
  land(13, "island", "Island", "europa", [[430, 56], [470, 36], [508, 42], [522, 108], [438, 116]]),
  land(14, "grossbritannien", "Großbritannien", "europa", [[424, 128], [480, 112], [522, 118], [534, 198], [428, 206]]),
  land(15, "skandinavien", "Skandinavien", "europa", [[522, 42], [590, 22], [650, 28], [668, 136], [534, 130]]),
  land(16, "mitteleuropa", "Mitteleuropa", "europa", [[534, 130], [668, 136], [656, 210], [520, 202]]),
  land(17, "westeuropa", "Westeuropa", "europa", [[428, 206], [520, 202], [508, 272], [450, 280], [416, 258]]),
  land(18, "suedeuropa", "Südeuropa", "europa", [[508, 272], [656, 210], [678, 286], [560, 312], [520, 304]]),
  land(19, "ukraine", "Ukraine", "europa", [[656, 210], [740, 176], [800, 164], [812, 292], [678, 286]]),
  land(20, "nordafrika", "Nordafrika", "afrika", [[416, 330], [500, 300], [580, 308], [592, 408], [428, 430]]),
  land(21, "aegypten", "Ägypten", "afrika", [[580, 308], [650, 286], [708, 292], [716, 388], [592, 408]]),
  land(22, "ostafrika", "Ostafrika", "afrika", [[592, 408], [716, 388], [748, 514], [548, 536], [516, 452]]),
  land(23, "kongo", "Kongo", "afrika", [[428, 430], [592, 408], [516, 452], [548, 536], [436, 522]]),
  land(24, "suedafrika", "Südafrika", "afrika", [[436, 522], [548, 536], [748, 514], [720, 600], [708, 640], [452, 626]]),
  land(25, "madagaskar", "Madagaskar", "afrika", [[768, 520], [820, 500], [838, 508], [828, 620], [760, 610]]),
  land(26, "ural", "Ural", "asien", [[800, 164], [880, 70], [920, 48], [968, 168], [824, 206], [812, 292]]),
  land(27, "sibirien", "Sibirien", "asien", [[920, 48], [1000, 26], [1060, 32], [1088, 140], [968, 168]]),
  land(28, "jakutien", "Jakutien", "asien", [[1060, 32], [1140, 18], [1188, 26], [1210, 132], [1088, 140]]),
  land(29, "kamtschatka", "Kamtschatka", "asien", [[1188, 26], [1240, 28], [1264, 44], [1256, 156], [1210, 132]]),
  land(30, "irkutsk", "Irkutsk", "asien", [[1088, 140], [1210, 132], [1188, 206], [1076, 198]]),
  land(31, "mongolei", "Mongolei", "asien", [[968, 168], [1076, 198], [1188, 206], [1128, 268], [980, 252]]),
  land(32, "japan", "Japan", "asien", [[1224, 176], [1260, 158], [1268, 164], [1272, 248], [1228, 236]]),
  land(33, "afghanistan", "Afghanistan", "asien", [[812, 292], [980, 252], [964, 340], [804, 332]]),
  land(34, "china", "China", "asien", [[980, 252], [1128, 268], [1096, 352], [964, 340]]),
  land(35, "mittlererosten", "Mittlerer Osten", "asien", [[708, 292], [812, 292], [804, 332], [964, 340], [936, 412], [716, 388]]),
  land(36, "indien", "Indien", "asien", [[964, 340], [1096, 352], [1064, 424], [936, 412]]),
  land(37, "siam", "Siam", "asien", [[1064, 424], [1096, 352], [1148, 392], [1112, 456]]),
  land(38, "indonesien", "Indonesien", "australien", [[1048, 470], [1112, 456], [1140, 454], [1156, 512], [1056, 526]]),
  land(39, "neuguinea", "Neuguinea", "australien", [[1140, 454], [1210, 432], [1252, 440], [1260, 508], [1156, 512]]),
  land(40, "westaustralien", "Westaustralien", "australien", [[1056, 526], [1156, 512], [1140, 620], [1060, 640], [1036, 608]]),
  land(41, "ostaustralien", "Ostaustralien", "australien", [[1156, 512], [1260, 508], [1252, 600], [1244, 624], [1140, 620]]),
];

const LAND_EDGES: [string, string][] = [
  ["alaska", "nordwest"], ["alaska", "alberta"],
  ["nordwest", "alberta"], ["nordwest", "ontario"], ["nordwest", "groenland"],
  ["groenland", "ontario"], ["groenland", "quebec"],
  ["alberta", "ontario"], ["alberta", "weststaaten"],
  ["ontario", "weststaaten"], ["ontario", "oststaaten"], ["ontario", "quebec"],
  ["weststaaten", "oststaaten"], ["weststaaten", "mittelamerika"],
  ["oststaaten", "quebec"], ["oststaaten", "mittelamerika"],
  ["mittelamerika", "venezuela"],
  ["venezuela", "peru"], ["venezuela", "brasilien"],
  ["peru", "brasilien"], ["peru", "argentinien"],
  ["brasilien", "argentinien"],
  ["island", "grossbritannien"], ["island", "skandinavien"],
  ["grossbritannien", "skandinavien"], ["grossbritannien", "westeuropa"], ["grossbritannien", "mitteleuropa"],
  ["skandinavien", "mitteleuropa"], ["skandinavien", "ukraine"],
  ["westeuropa", "mitteleuropa"], ["westeuropa", "suedeuropa"],
  ["mitteleuropa", "suedeuropa"], ["mitteleuropa", "ukraine"],
  ["suedeuropa", "ukraine"],
  ["ukraine", "ural"], ["ukraine", "afghanistan"], ["ukraine", "mittlererosten"],
  ["nordafrika", "aegypten"], ["nordafrika", "ostafrika"], ["nordafrika", "kongo"],
  ["aegypten", "ostafrika"], ["aegypten", "mittlererosten"],
  ["kongo", "ostafrika"], ["kongo", "suedafrika"],
  ["ostafrika", "suedafrika"], ["ostafrika", "madagaskar"],
  ["suedafrika", "madagaskar"],
  ["ural", "sibirien"], ["ural", "china"], ["ural", "afghanistan"],
  ["sibirien", "jakutien"], ["sibirien", "irkutsk"], ["sibirien", "mongolei"], ["sibirien", "china"],
  ["jakutien", "kamtschatka"], ["jakutien", "irkutsk"],
  ["kamtschatka", "irkutsk"], ["kamtschatka", "mongolei"], ["kamtschatka", "japan"],
  ["irkutsk", "mongolei"],
  ["mongolei", "japan"], ["mongolei", "china"],
  ["afghanistan", "china"], ["afghanistan", "indien"], ["afghanistan", "mittlererosten"],
  ["china", "indien"], ["china", "siam"],
  ["indien", "mittlererosten"], ["indien", "siam"],
  ["indonesien", "neuguinea"], ["indonesien", "westaustralien"],
  ["neuguinea", "westaustralien"], ["neuguinea", "ostaustralien"],
  ["westaustralien", "ostaustralien"],
];

export const RISKO_SEA: { a: string; b: string; via?: RiskoPoint[] }[] = [
  { a: "alaska", b: "kamtschatka", via: [[90, 14], [1230, 14]] },
  { a: "groenland", b: "island" },
  { a: "brasilien", b: "nordafrika", via: [[440, 390]] },
  { a: "westeuropa", b: "nordafrika", via: [[460, 300]] },
  { a: "suedeuropa", b: "nordafrika", via: [[540, 330]] },
  { a: "suedeuropa", b: "aegypten", via: [[620, 330]] },
  { a: "suedeuropa", b: "mittlererosten", via: [[720, 330]] },
  { a: "ostafrika", b: "mittlererosten", via: [[800, 470]] },
  { a: "siam", b: "indonesien" },
];

const graph = new Map<string, string[]>();
for (const [a, b] of [...LAND_EDGES, ...RISKO_SEA.map((route) => [route.a, route.b] as [string, string])]) {
  graph.set(a, [...(graph.get(a) ?? []), b]);
  graph.set(b, [...(graph.get(b) ?? []), a]);
}

export function riskoLand(token: string) {
  const clean = token.toLowerCase().replace(/[^a-z]/g, "");
  return RISKO_LANDS.find((item) => item.id === clean || item.name.toLowerCase().replace(/[^a-z]/g, "").startsWith(clean));
}

export function riskoNeighbors(id: string) {
  return graph.get(id) ?? [];
}

export function riskoConnected(owners: Record<string, number>, from: string, to: string) {
  if (owners[from] !== owners[to]) return false;
  const seen = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (current === to) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of riskoNeighbors(current)) {
      if (owners[next] === owners[from]) queue.push(next);
    }
  }
  return false;
}

export function riskoPath(points: RiskoPoint[]) {
  return `${points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ")} Z`;
}

export function riskoCenter(points: RiskoPoint[]) {
  const x = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const y = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return { x, y };
}

export const RISKO_SYMBOLS: Record<RiskoSymbol, string> = {
  inf: "Infanterie",
  kav: "Kavallerie",
  art: "Artillerie",
  joker: "Joker",
};

export function tradeValue(trades: number) {
  return [4, 6, 8, 10, 12, 15][trades] ?? 15 + (trades - 5) * 5;
}
