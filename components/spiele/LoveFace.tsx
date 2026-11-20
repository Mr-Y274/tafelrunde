import type { HerzCard, PhaseColor, StapelCard } from "@/lib/games/types";

function Shell({
  mark,
  title,
  ink,
  paper,
  on,
  disabled,
  onClick,
  arrive,
}: {
  mark: string;
  title: string;
  ink: string;
  paper: string;
  on?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  arrive?: boolean;
}) {
  const className = `card-face ${on ? "ring-4 ring-cinnabar" : ""} ${arrive ? "rise" : ""}`;
  const style = { background: paper, color: ink };
  if (!onClick) {
    return (
      <span className={className} style={style}>
        <b className="text-2xl leading-none">{mark}</b>
        <small>{title}</small>
      </span>
    );
  }
  return (
    <button className={className} style={style} disabled={disabled} onClick={onClick} type="button">
      <b className="text-2xl leading-none">{mark}</b>
      <small>{title}</small>
    </button>
  );
}

const PHASE: Record<PhaseColor, { name: string; ink: string; paper: string }> = {
  rot: { name: "Rot", ink: "#fff7f4", paper: "#d6453d" },
  gelb: { name: "Gelb", ink: "#3a2a08", paper: "#f2c14e" },
  gruen: { name: "Grün", ink: "#f4fff8", paper: "#2c6b4a" },
  blau: { name: "Blau", ink: "#f4f8ff", paper: "#2d62c0" },
};

export function HerzFace({ card, on, disabled, onClick, arrive }: { card: HerzCard; on?: boolean; disabled?: boolean; onClick?: () => void; arrive?: boolean }) {
  if (card.kind === "wild") return <Shell mark={card.n ? String(card.n) : "W"} title="Wild" ink="#f7e7c6" paper="#1c2430" on={on} disabled={disabled} onClick={onClick} arrive={arrive} />;
  if (card.kind === "skip") return <Shell mark="S" title="Skip" ink="#f7e7c6" paper="#1c2430" on={on} disabled={disabled} onClick={onClick} arrive={arrive} />;
  const color = PHASE[card.color ?? "rot"];
  return <Shell mark={String(card.n ?? "")} title={color.name} ink={color.ink} paper={color.paper} on={on} disabled={disabled} onClick={onClick} arrive={arrive} />;
}

export function StapelFace({ card, on, disabled, onClick, arrive }: { card: StapelCard; on?: boolean; disabled?: boolean; onClick?: () => void; arrive?: boolean }) {
  const skip = card.n == null || card.wild;
  const mark = card.n == null ? "SB" : String(card.n);
  const title = skip ? "Skip-Bo" : "Zahl";
  return <Shell mark={mark} title={title} ink={skip ? "#14365c" : "#1c2430"} paper={skip ? "#8ec4ef" : "#f4f7fb"} on={on} disabled={disabled} onClick={onClick} arrive={arrive} />;
}
