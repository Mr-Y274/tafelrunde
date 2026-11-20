"use client";

import { RISKO_BOARD, RISKO_LANDS, RISKO_REALMS, RISKO_SEA, RISKO_SYMBOLS, riskoCenter, riskoConnected, riskoLand, riskoNeighbors, riskoPath } from "@/lib/games/risko-map";
import type { RiskoView } from "@/lib/games/types";
import { useState } from "react";
import { Note } from "../Note";

const STEPS = [4, 6, 8, 10, 12, 15];

function Die({ value, tone }: { value: number; tone: "attack" | "defend" }) {
  const pips = [
    [],
    [[1, 1]],
    [[0, 0], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 0], [0, 2], [2, 0], [2, 2]],
    [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  ][value] ?? [];
  return (
    <span
      className="grid h-11 w-11 grid-cols-3 grid-rows-3 rounded-lg p-1.5 shadow-sm"
      style={{ background: tone === "attack" ? "#d6453d" : "#f4f7fb", color: tone === "attack" ? "#fff8f2" : "#16343f" }}
      aria-label={`${tone === "attack" ? "Angriff" : "Verteidigung"} ${value}`}
    >
      {Array.from({ length: 9 }, (_, index) => {
        const x = index % 3;
        const y = Math.floor(index / 3);
        const on = pips.some(([px, py]) => px === x && py === y);
        return <span key={index} className={`m-auto h-1.5 w-1.5 rounded-full ${on ? "bg-current" : "bg-transparent"}`} />;
      })}
    </span>
  );
}

function Mark({ symbol }: { symbol: "inf" | "kav" | "art" | "joker" }) {
  if (symbol === "joker") return <span className="text-lg">★</span>;
  if (symbol === "inf") return <span className="text-lg">♟</span>;
  if (symbol === "kav") return <span className="text-lg">♞</span>;
  return <span className="text-lg">♜</span>;
}

export function RiskoBoard({ view, busy, onAction }: { view: RiskoView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [aim, setAim] = useState<string | null>(null);
  const [cards, setCards] = useState<string[]>([]);
  const [onto, setOnto] = useState<string | null>(null);
  const [showMission, setShowMission] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const owners = Object.fromEntries(view.lands.map((land) => [land.id, land.owner]));
  const armies = Object.fromEntries(view.lands.map((land) => [land.id, land.armies]));
  const colorOf = (owner: number) => view.rows[owner]?.color ?? "#f3eadc";
  const canAct = view.youAreUp && !busy;
  const yours = selected != null && owners[selected] === view.you;
  const attackDice = selected ? Math.min(3, Math.max(0, (armies[selected] ?? 0) - 1)) : 0;
  const occupyN = view.occupy ? view.occupy.min : 1;
  const [move, setMove] = useState(1);
  const fortifyMax = selected ? Math.max(1, (armies[selected] ?? 1) - 1) : 1;
  const step = Math.min(view.trades, STEPS.length);

  function click(id: string) {
    const land = view.lands.find((item) => item.id === id);
    if (!land) return;
    if (!canAct) {
      setSelected(id);
      return;
    }
    if (view.phase === "draft" || view.phase === "place") {
      if (land.owner !== view.you || view.mustTrade) return;
      setSelected(id);
      void onAction({ type: "risko-place", id });
      return;
    }
    if (view.phase === "trade") {
      if (land.owner === view.you) setOnto(id);
      setSelected(id);
      return;
    }
    if (view.phase === "attack") {
      if (land.owner === view.you && land.armies > 1) {
        setSelected(id);
        setAim(null);
        return;
      }
      if (selected && yours && land.owner !== view.you && riskoNeighbors(selected).includes(id)) setAim(id);
      return;
    }
    if (view.phase === "fortify") {
      if (!selected || id === selected) {
        if (land.owner === view.you && land.armies > 1) {
          setSelected(id);
          setAim(null);
          setMove(land.armies - 1);
        }
        return;
      }
      if (land.owner === view.you && riskoConnected(owners, selected, id)) {
        setAim(id);
        setMove((armies[selected] ?? 1) - 1);
      }
    }
  }

  const attackable = new Set(
    view.phase === "attack" && selected && yours ? riskoNeighbors(selected).filter((id) => owners[id] !== view.you) : [],
  );
  const reachable = new Set(
    view.phase === "fortify" && selected && yours
      ? view.lands.filter((land) => land.owner === view.you && land.id !== selected && riskoConnected(owners, selected, land.id)).map((land) => land.id)
      : [],
  );
  const picked = view.hand.filter((card) => cards.includes(card.id));
  const bonusLands = picked.map((card) => card.land).filter((id): id is string => id != null && owners[id] === view.you);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-2xl border border-[#8a5a32] bg-[#1a3f57] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
        <div className="flex flex-wrap items-center gap-2 bg-[#3b2416] px-3 py-2">
          {view.rows.map((row) => (
            <span key={row.id} className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm ${row.id === view.turnId ? "bg-[#f3eadc] text-[#16130f]" : "text-[#f3eadc]"} ${row.out ? "opacity-40" : ""}`}>
              <span className="h-3 w-3 rounded-full" style={{ background: row.color }} />
              {row.name} · {row.lands}
            </span>
          ))}
        </div>
        <div className="px-3 pt-3">
          <Note banner={view.banner} />
        </div>
        <svg viewBox={`0 0 ${RISKO_BOARD.width} ${RISKO_BOARD.height}`} className="h-auto w-full" role="img" aria-label="Weltkarte mit 42 Gebieten">
          <rect width={RISKO_BOARD.width} height={RISKO_BOARD.height} fill="#1a4d68" />
          {Array.from({ length: 16 }, (_, index) => (
            <line key={`v${index}`} x1={index * 80} y1={0} x2={index * 80} y2={RISKO_BOARD.height} stroke="#f6e7c1" strokeOpacity={index % 3 === 0 ? 0.2 : 0.08} />
          ))}
          {Array.from({ length: 9 }, (_, index) => (
            <line key={`h${index}`} x1={0} y1={index * 80} x2={RISKO_BOARD.width} y2={index * 80} stroke="#f6e7c1" strokeOpacity={index === 4 ? 0.28 : 0.08} />
          ))}
          {RISKO_SEA.map((route) => {
            const from = riskoCenter(riskoLand(route.a)!.points);
            const to = riskoCenter(riskoLand(route.b)!.points);
            const bends = (route.via ?? []).map(([x, y]) => ({ x, y }));
            const d = [from, ...bends, to].map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
            return (
              <g key={`${route.a}-${route.b}`}>
                <path d={d} fill="none" stroke="#1a1208" strokeWidth="5" strokeDasharray="10 8" />
                <path d={d} fill="none" stroke="#f6e7c1" strokeWidth="2.5" strokeDasharray="10 8" />
              </g>
            );
          })}
          {RISKO_LANDS.map((land) => {
            const owner = owners[land.id] ?? 0;
            const realm = RISKO_REALMS.find((item) => item.id === land.realm);
            const hot = hover === land.id || selected === land.id || aim === land.id || attackable.has(land.id) || reachable.has(land.id);
            return (
              <path
                key={land.id}
                d={riskoPath(land.points)}
                fill={colorOf(owner)}
                fillOpacity={owner === view.you ? 0.95 : 0.82}
                stroke={hot ? "#f6e7c1" : realm?.color ?? "#16130f"}
                strokeWidth={hot ? 5 : 2.5}
                className={canAct ? "cursor-pointer" : undefined}
                onMouseEnter={() => setHover(land.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => click(land.id)}
              >
                <title>{`${land.name}: ${armies[land.id] ?? 0} Armeen`}</title>
              </path>
            );
          })}
          {RISKO_LANDS.map((land) => {
            const center = riskoCenter(land.points);
            const owner = owners[land.id] ?? 0;
            return (
              <g key={`${land.id}-badge`} pointerEvents="none">
                <circle cx={center.x} cy={center.y} r="15" fill="#16130f" stroke="#f3eadc" strokeWidth="2" />
                <text x={center.x} y={center.y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff8f2">
                  {armies[land.id] ?? 0}
                </text>
              </g>
            );
          })}
        </svg>
      </section>
      <aside className="space-y-3">
        <section className="rounded-2xl bg-[#f3eadc] p-3 text-[#16130f]">
          <h3 className="font-display text-lg">Kontinente</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {RISKO_REALMS.map((realm) => {
              const held = RISKO_LANDS.filter((land) => land.realm === realm.id).every((land) => owners[land.id] === view.you);
              return (
                <li key={realm.id} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ background: realm.color }} />
                    {realm.name}
                  </span>
                  <span className={held ? "font-bold" : ""}>+{realm.bonus}</span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="rounded-2xl bg-[#f3eadc] p-3 text-[#16130f]">
          <h3 className="font-display text-lg">Kartentausch</h3>
          <p className="mt-1 text-sm">Nächster Satz: {view.tradeValue} Armeen. {view.deck} Karten im Stapel.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {STEPS.map((value, index) => (
              <span key={value} className={`rounded-full px-2 py-1 text-sm ${index === step ? "bg-[#d4532b] text-[#fff8f2]" : "bg-[#e7dccb]"}`}>
                {value}
              </span>
            ))}
            <span className={`rounded-full px-2 py-1 text-sm ${step >= STEPS.length ? "bg-[#d4532b] text-[#fff8f2]" : "bg-[#e7dccb]"}`}>+5</span>
          </div>
        </section>
        <section className="rounded-2xl bg-[#f3eadc] p-3 text-[#16130f]">
          <h3 className="font-display text-lg">Würfel</h3>
          {view.last ? (
            <div key={`${view.last.attack.join()}-${view.last.defend.join()}`} className="dice-pop mt-2">
              <div className="flex flex-wrap items-center gap-2">
                {view.last.attack.map((value, index) => (
                  <Die key={`a${index}`} value={value} tone="attack" />
                ))}
                <span className="text-sm">gegen</span>
                {view.last.defend.map((value, index) => (
                  <Die key={`d${index}`} value={value} tone="defend" />
                ))}
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {view.last.attack.slice(0, view.last.defend.length).map((value, index) => (
                  <li key={index}>
                    {value} gegen {view.last!.defend[index]}: {value > view.last!.defend[index]! ? "Angriff" : "Verteidigung"}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-1 text-sm">Noch kein Wurf. Rot greift an, weiß hält.</p>
          )}
        </section>
        {view.mission ? (
          <section className="rounded-2xl bg-[#f3eadc] p-3 text-[#16130f]">
            <button className="btn btn-line w-full" type="button" onClick={() => setShowMission((open) => !open)}>
              {showMission ? "Auftrag verbergen" : "Auftrag zeigen"}
            </button>
            {showMission ? <p className="mt-2 text-sm">{view.mission}</p> : <p className="mt-2 text-sm">Nur für dich.</p>}
          </section>
        ) : (
          <section className="rounded-2xl bg-[#f3eadc] p-3 text-[#16130f]">
            <h3 className="font-display text-lg">Welteroberung</h3>
            <p className="mt-1 text-sm">Alle 42 Gebiete.</p>
          </section>
        )}
        <section className="rounded-2xl bg-[#f3eadc] p-3 text-[#16130f]">
          <h3 className="font-display text-lg">Deine Karten</h3>
          {view.hand.length === 0 ? <p className="mt-1 text-sm">Noch keine Gebietskarte.</p> : null}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {view.hand.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`rounded-xl border px-1 py-2 text-center text-xs ${cards.includes(card.id) ? "border-[#d4532b] bg-[#fff8f2]" : "border-[#cbbba6] bg-white"}`}
                onClick={() => setCards((current) => (current.includes(card.id) ? current.filter((id) => id !== card.id) : current.length >= 3 ? current : [...current, card.id]))}
              >
                <Mark symbol={card.symbol} />
                <span className="mt-1 block">{card.name}</span>
                <span className="block opacity-60">{RISKO_SYMBOLS[card.symbol]}</span>
              </button>
            ))}
          </div>
          {bonusLands.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {bonusLands.map((id) => (
                <button key={id} className={`btn ${onto === id ? "btn-solid" : "btn-line"}`} type="button" onClick={() => setOnto(id)}>
                  +2 {riskoLand(id)?.name}
                </button>
              ))}
            </div>
          ) : null}
          <button
            className="btn btn-solid mt-2 w-full"
            disabled={!canAct || cards.length !== 3 || (view.phase !== "place" && view.phase !== "trade") || (bonusLands.length > 1 && !onto)}
            type="button"
            onClick={() => {
              void onAction({ type: "risko-trade", ids: cards, onto: onto ?? bonusLands[0] });
              setCards([]);
              setOnto(null);
            }}
          >
            Drei Karten eintauschen
          </button>
        </section>
        <section className="rounded-2xl bg-[#f3eadc] p-3 text-[#16130f]">
          <p className="text-sm">
            {selected ? `${riskoLand(selected)?.name ?? "Gebiet"} · ${armies[selected] ?? 0} Armeen` : "Wähle ein Gebiet."}
            {view.turnPool > 0 ? ` · ${view.turnPool} zum Setzen` : ""}
          </p>
          {view.phase === "draft" || view.phase === "place" ? (
            <button className="btn btn-solid mt-2 w-full" disabled={!canAct || !yours || view.turnPool < 1 || view.mustTrade} type="button" onClick={() => selected && onAction({ type: "risko-dump", id: selected })}>
              Alle hier setzen
            </button>
          ) : null}
          {view.phase === "attack" && aim ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3].map((dice) => (
                <button
                  key={dice}
                  className="btn btn-solid"
                  disabled={!canAct || dice > attackDice}
                  type="button"
                  onClick={() => {
                    void onAction({ type: "risko-attack", from: selected, to: aim, dice });
                    setAim(null);
                  }}
                >
                  {dice} Würfel
                </button>
              ))}
            </div>
          ) : null}
          {view.phase === "occupy" && view.occupy ? (
            <div className="mt-2">
              <label className="text-sm" htmlFor="occupy">
                {view.occupy.min} bis {view.occupy.max} nach {riskoLand(view.occupy.to)?.name}
              </label>
              <input
                id="occupy"
                className="mt-2 w-full"
                type="range"
                min={view.occupy.min}
                max={view.occupy.max}
                value={Math.min(view.occupy.max, Math.max(view.occupy.min, move || occupyN))}
                onChange={(event) => setMove(Number(event.target.value))}
              />
              <button
                className="btn btn-solid mt-2 w-full"
                disabled={!canAct}
                type="button"
                onClick={() => onAction({ type: "risko-occupy", n: Math.min(view.occupy!.max, Math.max(view.occupy!.min, move || occupyN)) })}
              >
                {Math.min(view.occupy.max, Math.max(view.occupy.min, move || occupyN))} Armeen nachziehen
              </button>
            </div>
          ) : null}
          {view.phase === "attack" ? (
            <button className="btn btn-line mt-2 w-full" disabled={!canAct} type="button" onClick={() => onAction({ type: "risko-halt" })}>
              Angriff beenden
            </button>
          ) : null}
          {view.phase === "fortify" && aim ? (
            <div className="mt-2">
              <input className="w-full" type="range" min={1} max={fortifyMax} value={Math.min(fortifyMax, Math.max(1, move))} onChange={(event) => setMove(Number(event.target.value))} />
              <button className="btn btn-solid mt-2 w-full" disabled={!canAct} type="button" onClick={() => onAction({ type: "risko-fortify", from: selected, to: aim, n: Math.min(fortifyMax, Math.max(1, move)) })}>
                {Math.min(fortifyMax, Math.max(1, move))} nach {riskoLand(aim)?.name} schieben
              </button>
            </div>
          ) : null}
          {view.phase === "fortify" ? (
            <button className="btn btn-line mt-2 w-full" disabled={!canAct} type="button" onClick={() => onAction({ type: "risko-end" })}>
              Nicht verschieben
            </button>
          ) : null}
        </section>
      </aside>
    </div>
  );
}
