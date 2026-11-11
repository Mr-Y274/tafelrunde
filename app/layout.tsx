import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Tafelrunde",
  description: "Wizard, Schiffe versenken, Scotland Yard, Uno, Pictionary, Phase 10, Stapeln, Memo, Vier gewinnt und MAU MAU. Der Tischcode reicht.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <footer className="wrap flex gap-4 py-8 text-sm text-paper/50">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/nutzung">Nutzung</Link>
        </footer>
      </body>
    </html>
  );
}
