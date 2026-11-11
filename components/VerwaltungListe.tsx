"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Account = {
  id: string;
  username: string;
  email: string;
  admin: boolean;
  verifiedAt: string | null;
  createdAt: string;
};

export function VerwaltungListe({ selfId, accounts }: { selfId: string; accounts: Account[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "loeschen" | "bestaetigen") {
    if (action === "loeschen" && !window.confirm("Diesen Account und seine Tische wirklich löschen?")) return;
    setBusy(id);
    setError(null);
    const res = await fetch("/api/verwaltung", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) setError(json.error ?? "Das hat nicht geklappt.");
    else router.refresh();
  }

  return (
    <div className="panel overflow-hidden">
      <ul className="divide-y divide-ink/10">
        {accounts.map((account) => (
          <li key={account.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-display text-2xl">
                {account.username}
                {account.admin ? <span className="ml-2 text-sm text-cinnabar">Admin</span> : null}
              </p>
              <p className="text-sm opacity-70">
                {account.email}
                {" · "}
                {account.verifiedAt ? "Mail bestätigt" : "wartet auf die Mail"}
                {" · "}
                {new Date(account.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
            {account.id === selfId ? (
              <span className="text-sm opacity-60">Das bist du</span>
            ) : (
              <span className="flex gap-2">
                {account.verifiedAt ? null : (
                  <button className="btn btn-line" disabled={busy === account.id} onClick={() => act(account.id, "bestaetigen")}>
                    Mail bestätigen
                  </button>
                )}
                {account.admin ? null : (
                  <button className="btn btn-solid" disabled={busy === account.id} onClick={() => act(account.id, "loeschen")}>
                    Löschen
                  </button>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="px-5 pb-4 text-cinnabar">
          {error}
        </p>
      ) : null}
    </div>
  );
}
