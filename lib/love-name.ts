export const LOVE_NAMES = [
  "amberrose",
  "blueberry",
  "cuddlebug",
  "darlingdove",
  "figblossom",
  "goldfinch",
  "honeylark",
  "ivorymoon",
  "juniper",
  "kisscomet",
  "loveteddi",
  "marzipan",
  "nightdove",
  "opalpetal",
  "peachmuffin",
  "quiltstar",
  "rosycheek",
  "sugarcookie",
  "tulipbean",
  "velvetmoon",
  "warmlantern",
  "zinnia",
  "buttonbear",
  "cherryplum",
  "dewdrop",
  "foxglove",
  "gingerlily",
  "hazelnut",
  "lemonkiss",
  "nutmeg",
  "pistachio",
  "saffron",
  "truffle",
] as const;

const POOL = new Set<string>(LOVE_NAMES);

export function isLoveName(value: string) {
  return POOL.has(value);
}
