export const GATE_COOKIE = "tr_eingang";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30;

const PAYLOAD = "tafelrunde-eingang";

function same(a: string, b: string) {
  if (a.length === 0 || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export function codeMatches(code: string) {
  return same(code, process.env.GATE_CODE ?? "");
}

async function mac() {
  const secret = process.env.GATE_SECRET ?? "";
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const raw = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(PAYLOAD));
  return [...new Uint8Array(raw)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sealGate() {
  const token = await mac();
  if (!token) throw new Error("gate");
  return token;
}

export async function validGate(value: string | undefined) {
  const token = await mac();
  if (!value || !token) return false;
  return same(value, token);
}
