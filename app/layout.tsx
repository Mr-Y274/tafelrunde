import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#231c16",
};

export const metadata: Metadata = {
  title: "Tafelrunde",
  description: "Wizard, Schiffe versenken, Scotland Yard, Uno, Pictionary, Phase 10, Skip-Bo, Memo und Vier gewinnt. Der Tischcode reicht.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <footer className="wrap flex flex-wrap gap-x-4 gap-y-2 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-paper/50">
          <Link className="py-2" href="/impressum">Impressum</Link>
          <Link className="py-2" href="/datenschutz">Datenschutz</Link>
          <Link className="py-2" href="/nutzung">Nutzung</Link>
        </footer>
      </body>
    </html>
  );
}
