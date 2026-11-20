import { EingangForm } from "@/components/EingangForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eintreten · Tafelrunde",
};

export default function EingangPage() {
  return (
    <main className="wrap py-8 sm:py-16">
      <p className="kicker text-gold">Privat</p>
      <h1 className="title mt-3">Der Kreis bleibt unter sich.</h1>
      <p className="copy mt-4 text-paper/80">
        Tafelrunde ist ein privates Spiel. Den vierstelligen Code bekommst du von der Person, die dich eingeladen hat.
      </p>
      <EingangForm />
    </main>
  );
}
