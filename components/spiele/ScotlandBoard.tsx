"use client";

import { cityMap, citySegments, cityStation, type CityId } from "@/lib/games/city-maps";
import type { CityStation } from "@/lib/games/city-data";
import type { Ride, ScotlandMove, ScotlandProbe, ScotlandView } from "@/lib/games/types";
import { useEffect, useRef, useState } from "react";
import { Note } from "../Note";

const COLORS = ["#d4532b", "#e2b43a", "#8eb6ff", "#8fd0a8"];

function ticketWord(ticket: Ride) {
  if (ticket === "taxi") return "Taxi";
  if (ticket === "bus") return "Bus";
  if (ticket === "ug") return "U-Bahn";
  if (ticket === "heli") return "Hubschrauber";
  return "Schwarz";
}

function bandColor(band: "nah" | "mittel" | "fern" | undefined) {
  if (band === "nah") return "#3cbfa8";
  if (band === "mittel") return "#e2b43a";
  return "#d4532b";
}

function probeText(probe: ScotlandProbe) {
  if (probe.kind === "analyse") return `${probe.stations.length} mögliche Stationen. Sie sind auf der Karte hell umrandet.`;
  if (probe.kind === "ortung") return probe.masts.map((mast) => `${mast.name} ${mast.band}`).join(" · ");
  if (probe.kind === "abtasten") return `Ein Funkmast ist ${probe.steps} Taxischritte entfernt. Welcher, bleibt offen.`;
  return probe.witnesses.map((witness) => `${witness.name}: ${witness.saw === "still" ? "nichts gesehen" : witness.saw === "hier" ? "er ist hier" : "vor kurzem da"}`).join(" · ");
}

function lineColor(mode: string) {
  if (mode === "ug") return "#d4532b";
  if (mode === "bus") return "#3cbfa8";
  if (mode === "water") return "#8ecae6";
  return "rgba(226,180,58,.8)";
}

function stationStroke(modes: CityStation["modes"]) {
  if (modes.includes("ug")) return "#d4532b";
  if (modes.includes("bus")) return "#3cbfa8";
  return "#e2b43a";
}

function shift(city: CityId, a: number, b: number, mode: string) {
  const from = cityStation(city, a);
  const to = cityStation(city, b);
  if (!from || !to) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const amount = mode === "bus" ? 3 : mode === "ug" ? -3 : mode === "water" ? 6 : 0;
  const ox = (-dy / len) * amount;
  const oy = (dx / len) * amount;
  return { x1: from.x + ox, y1: from.y + oy, x2: to.x + ox, y2: to.y + oy };
}

export function ScotlandBoard({ view, busy, onAction }: { view: ScotlandView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [startAt, setStartAt] = useState<number | null>(null);
  const [near, setNear] = useState(true);
  const [double, setDouble] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const [first, setFirst] = useState<{ to: number; ticket: Ride } | null>(null);
  const [choice, setChoice] = useState<ScotlandMove[]>([]);

  useEffect(() => {
    setStartAt(null);
    setFirst(null);
    setChoice([]);
    setDouble(false);
  }, [view.turnId, view.round, view.phase]);

  const map = cityMap(view.city);
  const starts = new Set(map.starts);

  useEffect(() => {
    if (!near || view.home == null) return;
    const spot = cityStation(view.city, view.home);
    const box = frame.current;
    if (!spot || !box) return;
    const scale = box.scrollWidth / map.width;
    box.scrollLeft = Math.max(0, spot.x * scale - box.clientWidth / 2);
    box.scrollTop = Math.max(0, spot.y * scale - box.clientHeight / 2);
  }, [near, view.home, view.city, map.width]);
  const detectives = view.positions.filter((player) => player.role === "det");
  const mr = view.positions.find((player) => player.role === "mrx");
  const canDouble = view.moves.some((move) => move.doubleTo != null);

  function singlesTo(id: number) {
    return view.moves.filter((move) => move.to === id && move.doubleTo == null);
  }

  function clickStation(id: number) {
    if (view.choices) {
      if (view.choices.includes(id)) setStartAt(id);
      return;
    }
    if (!view.youAreUp || busy) return;
    if (!double) {
      const options = singlesTo(id);
      const tickets = [...new Set(options.map((move) => move.ticket))];
      if (tickets.length === 1 && options[0]) {
        void onAction({ type: "sy-move", to: options[0].to, ticket: options[0].ticket });
      } else if (options.length > 1) setChoice(options);
      return;
    }
    if (!first) {
      const options = view.moves.filter((move) => move.doubleTo != null && move.to === id);
      const unique = new Map<string, ScotlandMove>();
      for (const move of options) unique.set(move.ticket, move);
      const list = [...unique.values()];
      if (list.length === 1 && list[0]) setFirst({ to: list[0].to, ticket: list[0].ticket });
      else if (list.length > 1) setChoice(list);
      return;
    }
    const options = view.moves.filter((move) => move.to === first.to && move.ticket === first.ticket && move.doubleTo === id);
    if (options.length === 1 && options[0]) {
      void onAction({ type: "sy-move", to: options[0].to, ticket: options[0].ticket, doubleTo: options[0].doubleTo, doubleTicket: options[0].doubleTicket });
    } else if (options.length > 1) setChoice(options);
  }

  const hot = new Set<number>();
  if (view.choices) for (const id of view.choices) hot.add(id);
  else if (double && first) {
    for (const move of view.moves) if (move.to === first.to && move.ticket === first.ticket && move.doubleTo) hot.add(move.doubleTo);
  } else if (double) {
    for (const move of view.moves) if (move.doubleTo != null) hot.add(move.to);
  } else {
    for (const move of view.moves) if (move.doubleTo == null) hot.add(move.to);
  }

  return (
    <section className="rounded-[1.4rem] bg-[#141a22] p-4 text-paper md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="kicker">
          Runde {view.round} / {view.maxRounds}
          {view.youAreMrX ? " · Du bist Mr. X" : " · Du bist Detektiv"}
        </p>
        <p className="text-sm">
          Taxi {view.tickets.taxi} · Bus {view.tickets.bus} · U-Bahn {view.tickets.ug}
          {view.youAreMrX ? ` · Schwarz ${view.tickets.black} · Doppelt ${view.tickets.double} · Hubschrauber ${view.tickets.heli}` : ""}
        </p>
      </div>
      <p className="mt-2 text-sm">
        {view.youAreMrX
          ? `Treffpunkte: ${view.meetings?.map((meet) => `${meet.station}${meet.hit ? " geschafft" : ""}`).join(", ") || "noch keine"}`
          : `Mr. X hat noch Schwarz ${view.specials.black}, Doppelt ${view.specials.double}, Hubschrauber ${view.specials.heli}. Treffpunkte ${view.meetHits}.`}
      </p>
      <div className="mt-3">
        <Note banner={view.banner} log={view.log} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-paper/60">
          {view.home != null ? `Du stehst auf ${view.home}. ` : ""}
          {map.name} liegt als Bild hinter dem Netz. {near ? "Die Karte lässt sich schieben." : "Näher holt dein Feld groß."}
        </p>
        <button className="btn btn-line" onClick={() => setNear((value) => !value)}>
          {near ? "Ganze Karte" : "Näher"}
        </button>
      </div>
      <div ref={frame} className={`mt-2 rounded-2xl bg-[#0c1418] ${near ? "max-h-[72vh] overflow-auto" : "overflow-x-auto"}`}>
      <svg viewBox={`0 0 ${map.width} ${map.height}`} className={near ? "h-auto w-[2000px] max-w-none" : "h-auto min-w-[920px] w-full"} role="img" aria-label={`${map.name}, das Bild hinter dem Netz`}>
        <image href={map.image} x="0" y="0" width={map.width} height={map.height} />
        {citySegments(view.city).map((segment) => {
          const line = shift(view.city, segment.a, segment.b, segment.mode);
          if (!line) return null;
          const width = segment.mode === "ug" ? 5 : segment.mode === "water" ? 6 : segment.mode === "bus" ? 3.4 : 2.4;
          const key = `${segment.mode}-${segment.a}-${segment.b}`;
          return (
            <g key={key}>
              <line {...line} stroke="#0c1418" strokeWidth={width + 4} strokeLinecap="round" />
              <line {...line} stroke={lineColor(segment.mode)} strokeWidth={width} strokeLinecap="round" />
            </g>
          );
        })}
        {view.masts.map((mast) => {
          const spot = cityStation(view.city, mast.id);
          if (!spot) return null;
          const found = view.probe?.kind === "ortung" ? view.probe.masts.find((item) => item.id === mast.id) : undefined;
          return <circle key={`mast-${mast.name}`} cx={spot.x} cy={spot.y} r="24" fill="none" stroke={found ? bandColor(found.band) : "#e2b43a"} strokeDasharray="4 3" strokeWidth="2" pointerEvents="none" />;
        })}
        {view.probe?.kind === "analyse"
          ? view.probe.stations.map((id) => {
              const spot = cityStation(view.city, id);
              if (!spot) return null;
              return <circle key={`maybe-${id}`} cx={spot.x} cy={spot.y} r="20" fill="none" stroke="#f3eadc" strokeWidth="1.4" pointerEvents="none" />;
            })
          : null}
        {view.meetings?.map((meet) => {
          const spot = cityStation(view.city, meet.station);
          if (!spot) return null;
          return <circle key={`meet-${meet.station}`} cx={spot.x} cy={spot.y} r="20" fill="none" stroke={meet.hit ? "#3cbfa8" : "#e2b43a"} strokeWidth="2.4" pointerEvents="none" />;
        })}
        {view.lastSeen && mr?.station == null && cityStation(view.city, view.lastSeen.station) ? (
          <circle cx={cityStation(view.city, view.lastSeen.station)?.x} cy={cityStation(view.city, view.lastSeen.station)?.y} r="18" fill="none" stroke="#f3eadc" strokeDasharray="3 3" />
        ) : null}
        {map.stations.map((spot) => {
          const open = hot.has(spot.id);
          return (
            <g key={spot.id} onClick={() => clickStation(spot.id)} className={open || view.choices ? "cursor-pointer" : undefined} opacity={!view.choices || open ? 1 : 0.45}>
              <circle cx={spot.x} cy={spot.y} r="40" fill="transparent" />
              {starts.has(spot.id) ? <circle cx={spot.x} cy={spot.y} r="22" fill="none" stroke="#f3eadc" strokeWidth="2" /> : null}
              <circle cx={spot.x} cy={spot.y} r="15" fill={open ? "#f3eadc" : "#141a22"} stroke={stationStroke(spot.modes)} strokeWidth="3" />
              <text x={spot.x} y={spot.y + 4} textAnchor="middle" fontSize="12" fill={open ? "#16130f" : "#f3eadc"} stroke={open ? "#f3eadc" : "#141a22"} strokeWidth="3" paintOrder="stroke">
                {spot.id}
              </text>
              <title>{`Station ${spot.id}`}</title>
            </g>
          );
        })}
        {detectives.map((player, index) => {
          const spot = player.station ? cityStation(view.city, player.station) : null;
          if (!spot) return null;
          return <circle key={player.id} cx={spot.x + 11} cy={spot.y - 11} r="5" fill={COLORS[index % COLORS.length]} pointerEvents="none" />;
        })}
        {view.sights.map((sight) => {
          const spot = cityStation(view.city, sight.id);
          if (!spot) return null;
          const width = Math.max(64, sight.name.length * 6.6 + 16);
          const above = spot.y > 56;
          const top = above ? spot.y - 48 : spot.y + 24;
          return (
            <g key={`sight-${sight.id}`} pointerEvents="none">
              <rect x={spot.x - width / 2} y={top} width={width} height={18} rx="6" fill="#141a22" opacity="0.9" />
              <text x={spot.x} y={top + 13} textAnchor="middle" fontSize="11" fill="#f3eadc">
                {sight.name}
              </text>
            </g>
          );
        })}
        {mr?.station && cityStation(view.city, mr.station) ? (
          <circle cx={cityStation(view.city, mr.station)?.x} cy={(cityStation(view.city, mr.station)?.y ?? 0) + 18} r="6" fill="#16130f" stroke="#f3eadc" strokeWidth="2" pointerEvents="none" />
        ) : null}
      </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="text-gold">Taxi</span>
        <span className="text-[#3cbfa8]">Bus</span>
        <span className="text-cinnabar">U-Bahn</span>
        <span className="text-[#8ecae6]">Fähre</span>
        <span>Startfeld umrandet</span>
        <span className="text-gold">Funkmast gestrichelt</span>
        <span>Sehenswürdigkeit beschriftet</span>
        {detectives.map((player, index) => (
          <span key={player.id} style={{ color: COLORS[index % COLORS.length] }}>
            {player.name}
            {player.station ? ` ${player.station}` : ""}
          </span>
        ))}
        <span>Mr. X {view.positions.find((player) => player.id === view.mrXId)?.name}</span>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto text-sm">
        {view.travel.map((move, index) => (
          <span key={`${move.round}-${index}`} className="rounded-full bg-white/10 px-2 py-1 whitespace-nowrap">
            {move.round} {ticketWord(move.ticket)}
            {move.station ? ` · ${move.station}` : ""}
          </span>
        ))}
      </div>
      {view.probeReady ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["analyse", "Analyse"],
              ["ortung", "Ortung"],
              ["abtasten", "Abtasten"],
              ["befragung", "Befragung"],
            ] as const
          ).map(([kind, label]) => (
            <button key={kind} className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "sy-probe", kind })}>
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {view.probe ? <p className="mt-2 text-sm">{probeText(view.probe)}</p> : null}
      {view.youAreUp && canDouble ? (
        <button className={`btn mt-3 ${double ? "btn-solid" : "btn-line"}`} onClick={() => { setDouble((value) => !value); setFirst(null); }}>
          Doppelzug
        </button>
      ) : null}
      {first ? <p className="mt-2 text-sm">Erste Station {first.to}, {ticketWord(first.ticket)}. Wähl die zweite.</p> : null}
      {choice.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {choice.map((move) => (
            <button
              key={`${move.to}-${move.ticket}-${move.doubleTo ?? ""}-${move.doubleTicket ?? ""}`}
              className="btn btn-solid"
              disabled={busy}
              onClick={() => {
                if (double && !first && move.doubleTo != null) {
                  setFirst({ to: move.to, ticket: move.ticket });
                  setChoice([]);
                  return;
                }
                void onAction({ type: "sy-move", to: move.to, ticket: move.ticket, doubleTo: move.doubleTo, doubleTicket: move.doubleTicket });
                setChoice([]);
              }}
            >
              {ticketWord(double && !first ? move.ticket : (move.doubleTicket ?? move.ticket))}
            </button>
          ))}
        </div>
      ) : null}
      {view.choices && view.youAreUp ? (
        <button className="btn btn-solid mt-3" disabled={busy || startAt == null} onClick={() => startAt != null && onAction({ type: "sy-start", station: startAt })}>
          {startAt ? `Bei ${startAt} starten` : "Station wählen"}
        </button>
      ) : null}
    </section>
  );
}
