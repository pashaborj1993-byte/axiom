import type { ReactNode } from "react";
import { ArrowRight, Heart, ListChecks, Shuffle } from "lucide-react";
import { Quill } from "@/components/quill";
import { completedPool, exercisesByIds, practicePool } from "@/data/curriculum";
import type { Exercise } from "@/data/types";
import { pickN } from "@/lib/seed";
import { MAX_HEARTS, useProgress } from "@/lib/progress";

export type DrillKind = "repair" | "review" | "quick";

export type DrillSession = {
  kind: DrillKind;
  title: string;
  kicker: string;
  idea?: string;
  exercises: Exercise[];
};

export function makeDrill(kind: DrillKind): DrillSession | null {
  const state = useProgress.getState();
  const credit = { crowns: state.crowns, placed: state.placed };
  if (kind === "repair") {
    const pool = practicePool(credit);
    const exercises = pickN(pool, 3, `repair-${Date.now()}`);
    if (exercises.length === 0) return null;
    return {
      kind,
      title: "Heart drill",
      kicker: "No hearts at stake",
      idea: "Answer at least two of three to earn a heart. A miss here does not cost one.",
      exercises,
    };
  }
  if (kind === "review") {
    const exercises = exercisesByIds(state.mistakes).slice(0, 5);
    if (exercises.length === 0) return null;
    return {
      kind,
      title: "Clean up misses",
      kicker: "From lessons you stumbled on",
      idea: "These are questions you missed. Get them right and they leave the pile.",
      exercises,
    };
  }
  const pool = completedPool(credit);
  const exercises = pickN(pool, 5, `quick-${Date.now()}`);
  if (exercises.length === 0) return null;
  return {
    kind,
    title: "Mixed drill",
    kicker: "From lessons you have cleared",
    idea: "Five questions from the path behind you. No hearts at stake.",
    exercises,
  };
}

export function PracticeView({ onStart }: { onStart: (session: DrillSession) => void }) {
  const hearts = useProgress((state) => state.hearts);
  const mistakes = useProgress((state) => state.mistakes.length);
  const crowns = useProgress((state) => state.crowns);
  const placed = useProgress((state) => state.placed);
  const cleared =
    Object.values(crowns).some((crown) => crown > 0) || Object.values(placed).some(Boolean);

  return (
    <div className="grid gap-3 px-4 pt-6 pb-8">
      <div className="flex items-end gap-3">
        <Quill mood="idle" className="h-24 shrink-0" label="Quill" />
        <div className="min-w-0 pb-1">
          <h1 className="font-serif text-3xl">Drill</h1>
          <p className="mt-1 text-sm text-pretty text-muted">
            Short rounds that repair hearts, clear misses, and count toward your streak.
          </p>
        </div>
      </div>
      <DrillCard
        icon={<Heart className="size-5" aria-hidden />}
        title="Earn a heart"
        detail={
          hearts >= MAX_HEARTS
            ? "Hearts are full."
            : "Three questions. Two right puts a heart back."
        }
        disabled={hearts >= MAX_HEARTS}
        onClick={() => {
          const session = makeDrill("repair");
          if (session) onStart(session);
        }}
      />
      <DrillCard
        icon={<ListChecks className="size-5" aria-hidden />}
        title="Review misses"
        detail={
          mistakes > 0
            ? `${mistakes} waiting. Up to five at a time.`
            : "Nothing waiting. Misses from lessons land here."
        }
        disabled={mistakes === 0}
        onClick={() => {
          const session = makeDrill("review");
          if (session) onStart(session);
        }}
      />
      <DrillCard
        icon={<Shuffle className="size-5" aria-hidden />}
        title="Mixed five"
        detail={
          cleared
            ? "Five questions from lessons you have finished."
            : "Finish a lesson to unlock a mixed drill."
        }
        disabled={!cleared}
        onClick={() => {
          const session = makeDrill("quick");
          if (session) onStart(session);
        }}
      />
    </div>
  );
}

function DrillCard({
  icon,
  title,
  detail,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="surface-card press flex w-full items-center gap-3 rounded-2xl p-4 text-left disabled:opacity-50"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine-soft text-pine">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-pretty text-muted">{detail}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
    </button>
  );
}
