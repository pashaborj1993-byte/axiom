import { useEffect, useState } from "react";
import type { HouseAd } from "@/lib/bank-types";
import { useProgress } from "@/lib/progress";

export function SponsorCard({ placement }: { placement: "hearts" | "lesson_end" }) {
  const [ad, setAd] = useState<HouseAd | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const { loadAds } = await import("@/lib/bank.functions");
        const rows = await loadAds({ data: placement });
        if (!cancel) setAd(rows[0] ?? null);
      } catch {
        if (!cancel) setAd(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [placement]);

  if (!ad || done) return null;

  async function collect() {
    if (!ad) return;
    setPending(true);
    setMessage("");
    try {
      const { collectAd } = await import("@/lib/bank.functions");
      const reward = await collectAd({ data: ad.id });
      useProgress.setState({
        hearts: reward.hearts,
        gems: reward.gems,
        xp: reward.xp,
        todayXp: reward.todayXp,
        todayDate: reward.todayDate,
      });
      const parts = [
        reward.gainedHearts ? `${reward.gainedHearts} heart` : "",
        reward.gainedGems ? `${reward.gainedGems} gems` : "",
        reward.gainedXp ? `${reward.gainedXp} XP` : "",
      ].filter(Boolean);
      setMessage(parts.length ? `Collected ${parts.join(", ")}.` : "Collected.");
      setDone(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not collect that.");
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="rise surface-card mt-4 w-full max-w-sm rounded-2xl px-4 py-3 text-left">
      <p className="text-xs font-semibold tracking-widest text-copper uppercase">Sponsored</p>
      <p className="mt-1 font-semibold">{ad.title}</p>
      <p className="mt-1 text-sm text-pretty text-muted">{ad.body}</p>
      <button
        type="button"
        onClick={() => void collect()}
        disabled={pending}
        className="press mt-3 h-11 w-full rounded-xl bg-ink text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Collecting…" : "Collect today’s bonus"}
      </button>
      {message ? <p className="mt-2 text-sm">{message}</p> : null}
    </aside>
  );
}
