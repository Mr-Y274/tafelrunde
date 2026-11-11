import nodemailer from "nodemailer";
import { PublicError } from "./errors";

export type SentMail = { devLink?: string; messageId?: string };

function transport() {
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const port = Number(process.env.EMAIL_SERVER_PORT || "587");
  if (!host || !user || !pass || !Number.isFinite(port)) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });
}

function fromAddress() {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER;
  if (!from) return null;
  return from.includes("<") ? from : `Tafelrunde <${from}>`;
}

function letter(title: string, copy: string, link: string, label: string) {
  return `<div style="font-family:Georgia,serif;background:#231c16;color:#f3eadc;padding:32px">
    <p style="letter-spacing:.14em;text-transform:uppercase;font-size:12px">Tafelrunde</p>
    <h1 style="font-weight:500">${title}</h1>
    <p>${copy}</p>
    <p><a href="${link}" style="display:inline-block;background:#d4532b;color:#fff8f2;text-decoration:none;padding:12px 18px;border-radius:999px">${label}</a></p>
  </div>`;
}

async function deliver(to: string, subject: string, text: string, html: string, devLink?: string): Promise<SentMail> {
  const tx = transport();
  const from = fromAddress();
  if (!tx || !from) {
    if (process.env.NODE_ENV === "production") throw new PublicError("Die Mail kann gerade nicht verschickt werden.");
    console.info(`${subject} für ${to}: ${devLink ?? ""}`);
    return { devLink };
  }
  try {
    const info = await tx.sendMail({ from, to, subject, text, html });
    if (info.rejected.length > 0) throw new Error("rejected");
    return { messageId: info.messageId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "send failed";
    console.error(`smtp: ${detail}`);
    throw new PublicError("Die Mail konnte nicht verschickt werden.");
  }
}

export async function sendVerification(email: string, link: string) {
  return deliver(
    email,
    "Bestätige deine Tafelrunde",
    `Öffne den Link und bestätige, dass die Adresse dir gehört:\n\n${link}\n\nEr gilt 24 Stunden. Wenn du keinen Account angelegt hast, kannst du die Mail ignorieren.`,
    letter("Bestätige deine Mail", "Dann kannst du dich anmelden und Leute über ihren Benutzernamen an den Tisch holen. Der Link gilt 24 Stunden.", link, "Adresse bestätigen"),
    link,
  );
}

export async function sendPasswordReset(email: string, link: string) {
  return deliver(
    email,
    "Neues Passwort für Tafelrunde",
    `Über den Link setzt du ein neues Passwort:\n\n${link}\n\nEr gilt eine Stunde. Wenn du das nicht warst, kannst du die Mail ignorieren.`,
    letter("Neues Passwort", "Der Link gilt eine Stunde. Danach bleibt dein bisheriges Passwort gültig.", link, "Passwort neu setzen"),
    link,
  );
}
