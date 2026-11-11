import { animalOf, type LoveAnimal } from "@/lib/games/love";
import type { HerzCard, MauCard, MauRank, StapelCard } from "@/lib/games/types";

const RANK: Record<MauRank, string> = { "7": "7", "8": "8", "9": "9", "10": "10", B: "Bube", D: "Dame", K: "König", A: "Ass" };

function Shell({
  mark,
  title,
  ink,
  paper,
  on,
  disabled,
  onClick,
}: {
  mark: string;
  title: string;
  ink: string;
  paper: string;
  on?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const className = `card-face ${on ? "ring-4 ring-cinnabar" : ""}`;
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

export function HerzFace({ card, on, disabled, onClick }: { card: HerzCard; on?: boolean; disabled?: boolean; onClick?: () => void }) {
  const animal = card.animal ? animalOf(card.animal) : null;
  const mark = card.kind === "kuss" ? "💋" : card.kind === "schlaf" ? "💤" : `${animal?.mark ?? "💗"}${card.n ?? ""}`;
  const title = card.kind === "kuss" ? `Kuss${card.n ? ` ${card.n}` : ""}` : card.kind === "schlaf" ? "Schlaf" : (animal?.name ?? "");
  return <Shell mark={mark} title={title} ink={animal?.ink ?? "#6a3d1c"} paper={animal?.paper ?? "#f7e7c6"} on={on} disabled={disabled} onClick={onClick} />;
}

export function StapelFace({ card, on, disabled, onClick }: { card: StapelCard; on?: boolean; disabled?: boolean; onClick?: () => void }) {
  const mark = card.n == null ? "💋" : card.wild ? `💋${card.n}` : String(card.n);
  const title = card.n == null ? "Kuss" : card.wild ? "Kuss" : "Herz";
  return <Shell mark={mark} title={title} ink="#8d314c" paper={card.wild || card.n == null ? "#f7e7c6" : "#f6c2d2"} on={on} disabled={disabled} onClick={onClick} />;
}

export function MauFace({ card, on, disabled, onClick }: { card: MauCard; on?: boolean; disabled?: boolean; onClick?: () => void }) {
  const animal = animalOf(card.animal);
  return <Shell mark={`${animal.mark}${card.rank}`} title={`${animal.name} ${RANK[card.rank]}`} ink={animal.ink} paper={animal.paper} on={on} disabled={disabled} onClick={onClick} />;
}

export function animalName(id: LoveAnimal) {
  return animalOf(id).name;
}
