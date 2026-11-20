"use client";

import { cityLinks, cityMap, citySegments, cityStation, type CityId } from "@/lib/games/city-maps";
import type { CityEdge, CityStation } from "@/lib/games/city-data";
import type { Ride, ScotlandMove, ScotlandView } from "@/lib/games/types";
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

const INK = "#241c14";
const TAXI = "#e2a000";
const BUS = "#1f8a4c";
const UG = "#d0121c";

function lineColor(mode: string) {
  if (mode === "ug") return UG;
  if (mode === "bus") return BUS;
  if (mode === "water") return INK;
  return TAXI;
}

function shift(pts: number[], dist: number) {
  const count = pts.length / 2;
  const moved: number[] = [];
  for (let i = 0; i < count; i++) {
    const prev = Math.max(0, i - 1);
    const next = Math.min(count - 1, i + 1);
    const dx = (pts[next * 2] ?? 0) - (pts[prev * 2] ?? 0);
    const dy = (pts[next * 2 + 1] ?? 0) - (pts[prev * 2 + 1] ?? 0);
    const len = Math.hypot(dx, dy) || 1;
    moved.push((pts[i * 2] ?? 0) + (-dy / len) * dist, (pts[i * 2 + 1] ?? 0) + (dx / len) * dist);
  }
  return moved;
}

function track(city: CityId, segment: CityEdge) {
  const from = cityStation(city, segment.a);
  const to = cityStation(city, segment.b);
  if (!from || !to) return null;
  const pts = [from.x, from.y];
  const via = segment.via ?? [];
  for (let i = 0; i < via.length; i += 2) pts.push(via[i] ?? from.x, via[i + 1] ?? from.y);
  pts.push(to.x, to.y);
  return pts;
}

function fareWord(city: CityId, to: number, ticket: Ride, from: number | null | undefined) {
  if (ticket === "black" && from != null && cityLinks(city, from, "water").includes(to)) return "Fähre";
  return ticketWord(ticket);
}

function StationMark({ x, y, id, modes }: { x: number; y: number; id: number; modes: CityStation["modes"] }) {
  const radius = 12;
  const bus = modes.includes("bus");
  const ug = modes.includes("ug");
  return (
    <g>
      <circle cx={x} cy={y} r={radius + 1.2} fill={INK} />
      <circle cx={x} cy={y} r={radius} fill={TAXI} />
      {bus ? <path d={`M ${x} ${y - radius} A ${radius} ${radius} 0 0 0 ${x} ${y + radius} Z`} fill={BUS} /> : null}
      {ug ? <rect x={x - 7} y={y - 6} width={14} height={12} rx={1.5} fill={UG} /> : null}
      <circle cx={x} cy={y} r={radius} fill="none" stroke={INK} strokeWidth={1.4} />
      <text x={x} y={y + 3} textAnchor="middle" fontSize={id > 99 ? 8 : 10} fontWeight={700} fill={ug ? "#fffaf3" : INK} fontFamily="var(--font-outfit), sans-serif">
        {id}
      </text>
    </g>
  );
}

export function ScotlandBoard({ view, busy, onAction }: { view: ScotlandView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [startAt, setStartAt] = useState<number | null>(null);
  const [near, setNear] = useState(true);
  const [legend, setLegend] = useState(true);
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
    <section className="max-w-full min-w-0 rounded-[1.4rem] bg-[#141a22] p-3 text-paper sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="kicker">
          Runde {view.round} / {view.maxRounds}
          {view.youAreMrX ? " · Du bist Mr. X" : " · Du bist Detektiv"}
        </p>
        <p className="text-sm">
          Taxi {view.tickets.taxi} · Bus {view.tickets.bus} · U-Bahn {view.tickets.ug}
          {view.youAreMrX ? ` · Schwarz ${view.tickets.black} · Doppelt ${view.tickets.double}` : ""}
        </p>
      </div>
      <p className="mt-2 text-sm">
        {view.youAreMrX
          ? "Die Detektive sehen nur dein Ticket, außer in den Runden 3, 8, 13, 18 und 24."
          : `Mr. X hat noch Schwarz ${view.specials.black} und Doppelt ${view.specials.double}. Zuletzt gesehen: ${view.lastSeen ? `Runde ${view.lastSeen.round}, Station ${view.lastSeen.station}` : "noch nicht"}.`}
      </p>
      <div className="mt-3">
        <Note banner={view.banner} log={view.log} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs text-paper/60">
          {view.youAreUp && view.turnId ? `${view.positions.find((player) => player.id === view.turnId)?.name ?? "Du"} ist dran. ` : ""}
          {view.home != null ? `Die Figur steht auf ${view.home}. ` : ""}
          Gelb ist Taxi, Türkis der Bus, Rot die U-Bahn, Schwarz die Fähre. {near ? "Die Karte lässt sich schieben." : "Näher holt dein Feld groß."}
        </p>
        <div className="flex shrink-0 gap-2">
          <button className="btn btn-line" onClick={() => setLegend((value) => !value)} type="button">
            {legend ? "Legende zu" : "Legende"}
          </button>
          <button className="btn btn-line" onClick={() => setNear((value) => !value)} type="button">
            {near ? "Ganze Karte" : "Näher"}
          </button>
        </div>
      </div>
      <div className="mt-2 max-w-full min-w-0 rounded-2xl bg-[#8d6940] p-1.5 sm:p-2">
      <div ref={frame} className={`max-w-full min-w-0 overscroll-contain bg-[#f4e8d0] ${near ? "max-h-[62dvh] touch-pan-x touch-pan-y overflow-auto sm:max-h-[72vh]" : "overflow-x-auto"}`}>
      <svg viewBox={`0 0 ${map.width} ${map.height}`} className={near ? "h-auto w-[1560px] max-w-none sm:w-[2000px]" : "h-auto w-full"} role="img" aria-label={`${map.name}, das Spielbrett`}>
        <rect width={map.width} height={map.height} fill="#e4d3ae" />
        {map.parks.map((park) => (
          <ellipse key={park.name} cx={park.x} cy={park.y} rx={park.rx} ry={park.ry} fill="#b7d39a" opacity="0.85" />
        ))}
        {map.river.length > 1 ? (
          <polyline points={map.river.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#8ec4e6" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {map.labels.map((label) => (
          <text key={label.name} x={label.x} y={label.y} fill="#6d5a40" fontSize="28" fontFamily="var(--font-fraunces), Georgia, serif">
            {label.name}
          </text>
        ))}
        {map.image ? <image href={map.image} x="0" y="0" width={map.width} height={map.height} opacity="0.28" /> : null}
        {citySegments(view.city)
          .slice()
          .sort((a, b) => (a.mode === "water" || a.mode === "ug" ? 1 : 0) - (b.mode === "water" || b.mode === "ug" ? 1 : 0))
          .map((segment) => {
          const pts = track(view.city, segment);
          if (!pts) return null;
          const drawn = segment.mode === "bus" ? shift(pts, 6) : pts;
          const width = segment.mode === "ug" || segment.mode === "water" ? 6 : 5;
          const dash = segment.mode === "ug" || segment.mode === "water" ? "16 11" : undefined;
          const points = drawn.join(" ");
          return (
            <g key={`${segment.mode}-${segment.a}-${segment.b}`}>
              <polyline points={points} fill="none" stroke={INK} strokeWidth={width + 2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
              <polyline points={points} fill="none" stroke={lineColor(segment.mode)} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
            </g>
          );
        })}
        {map.radios.map((radio) => (
          <g key={radio.name} pointerEvents="none">
            <rect x={radio.x - 78} y={radio.y - 16} width="156" height="32" rx="8" fill="#f6edd8" stroke={INK} strokeWidth="1.4" />
            <text x={radio.x} y={radio.y + 5} textAnchor="middle" fontSize="14" fill={INK} fontFamily="var(--font-outfit), sans-serif">
              Radio {radio.name}
            </text>
          </g>
        ))}
        {view.lastSeen && mr?.station == null && cityStation(view.city, view.lastSeen.station) ? (
          <circle cx={cityStation(view.city, view.lastSeen.station)?.x} cy={cityStation(view.city, view.lastSeen.station)?.y} r="22" fill="none" stroke={INK} strokeDasharray="2 3" />
        ) : null}
        {map.stations.map((spot) => {
          const open = hot.has(spot.id);
          return (
            <g key={spot.id} onClick={() => clickStation(spot.id)} className={open || view.choices ? "cursor-pointer" : undefined} opacity={!view.choices || open ? 1 : 0.45}>
              <circle cx={spot.x} cy={spot.y} r="18" fill="transparent" />
              {open ? <circle cx={spot.x} cy={spot.y} r="16" fill="none" stroke="#fffaf3" strokeWidth="3" /> : null}
              {open ? <circle cx={spot.x} cy={spot.y} r="16" fill="none" stroke={INK} strokeWidth="1.2" /> : null}
              <StationMark x={spot.x} y={spot.y} id={spot.id} modes={spot.modes} />
              <title>{`Station ${spot.id}`}</title>
            </g>
          );
        })}
        {detectives.map((player, index) => {
          const spot = player.station ? cityStation(view.city, player.station) : null;
          if (!spot) return null;
          const angle = -0.9 + index * 0.7;
          return (
            <g key={player.id} className="glide" style={{ transform: `translate(${spot.x + Math.cos(angle) * 14}px, ${spot.y + Math.sin(angle) * 14}px)` }}>
              <circle r="7" fill={COLORS[index % COLORS.length]} stroke={player.id === view.turnId ? "#fffaf3" : INK} strokeWidth={player.id === view.turnId ? 3 : 1.4} pointerEvents="none" />
            </g>
          );
        })}
        {mr?.station && cityStation(view.city, mr.station) ? (
          <g className="glide" style={{ transform: `translate(${cityStation(view.city, mr.station)?.x ?? 0}px, ${(cityStation(view.city, mr.station)?.y ?? 0) + 20}px)` }}>
            <circle r="7" fill={INK} stroke="#f6edd8" strokeWidth="2" pointerEvents="none" />
          </g>
        ) : null}
      </svg>
      </div>
      </div>
      {legend ? <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: TAXI }} /> Taxi</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: BUS }} /> Bus</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: UG }} /> U-Bahn</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-5 rounded-sm bg-[#1a120c] ring-1 ring-paper/40" /> Fähre</span>
        <span>Gelber Kreis Taxi, türkiser Halbkreis Bus, rotes Feld U-Bahn</span>
        <span>Dick umrandet kannst du hin</span>
        <span>Gestrichelter Kreis ist die letzte sichtbare Station</span>
        {detectives.map((player, index) => (
          <span key={player.id} style={{ color: COLORS[index % COLORS.length] }}>
            {player.name}
            {player.station ? ` ${player.station}` : ""}
          </span>
        ))}
        <span>Mr. X {view.positions.find((player) => player.id === view.mrXId)?.name}</span>
      </div> : null}
      <div className="mt-3">
        <p className="text-sm">Fahrtenbuch</p>
      <div className="mt-2 flex max-w-full gap-2 overflow-x-auto text-sm">
        {view.travel.map((move, index) => (
          <span key={`${move.round}-${index}`} className="rounded-full bg-white/10 px-2 py-1 whitespace-nowrap">
            {move.round} {ticketWord(move.ticket)}
            {move.station ? ` · ${move.station}` : ""}
          </span>
        ))}
      </div>
      </div>
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
              {fareWord(view.city, double && first ? (move.doubleTo ?? move.to) : move.to, double && first ? (move.doubleTicket ?? move.ticket) : move.ticket, double && first ? first.to : view.home)}
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
