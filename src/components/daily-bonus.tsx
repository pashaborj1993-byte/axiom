import { useState } from "react";
import { Companion } from "@/components/companion";
import { characterName } from "@/data/characters";
import { useT } from "@/i18n/use-t";
import { localDateKey } from "@/lib/format";
import { useProgress } from "@/lib/progress";

export function DailyBonus() {
  const bonusDate = useProgress((state) => state.bonusDate);
  const character = useProgress((state) => state.character);
  const claim = useProgress((state) => state.claimBonus);
  const [got, setGot] = useState<{ xp: number; gems: number; heart: boolean } | null>(null);
  const t = useT();
  const open = bonusDate !== localDateKey();
  if (!open && !got) return null;

  return (
    <section className="rise surface-card mb-5 flex items-center gap-3 rounded-2xl px-4 py-3">
      <Companion mood={got ? "cheer" : "greet"} className="h-16 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{got ? t("bonusGot") : `${characterName(character)} ${t("bonusLeft")}`}</p>
        <p className="text-sm text-pretty text-muted">
          {got
            ? `${got.xp} XP · ${got.gems}`
            : t("bonusBody")}
        </p>
        {!got ? (
          <button
            type="button"
            className="press mt-2 h-10 rounded-xl bg-pine px-4 text-sm font-semibold text-paper"
            onClick={() => setGot(claim())}
          >
            {t("bonusOpen")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
