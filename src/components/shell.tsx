import type { ReactNode } from "react";
import { Dumbbell, Flame, Gem, Heart, Route, UserRound, Zap } from "lucide-react";
import { Mark } from "@/components/mark";
import { Companion } from "@/components/companion";
import { dayOfYear, displayName, formatClock } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/use-t";
import { effectiveStreak, msUntilHeart, useProgress } from "@/lib/progress";

const TIPS = [
  "Fluency is cheap. Ask what would prove the answer wrong.",
  "A prompt is a spec: task, material, format, and a check.",
  "Temperature does not add knowledge. A source does.",
  "If a metric is the reward, the system will chase the metric.",
  "A demo is one sample. An evaluation is a set you trust.",
  "Put real power in tools and permissions, not in a polite sentence.",
];

export type TabId = "path" | "practice" | "you";

const TABS: { id: TabId; label: "learn" | "drill" | "you"; icon: typeof Route }[] = [
  { id: "path", label: "learn", icon: Route },
  { id: "practice", label: "drill", icon: Dumbbell },
  { id: "you", label: "you", icon: UserRound },
];

export function Shell({
  tab,
  onTab,
  children,
}: {
  tab: TabId;
  onTab: (tab: TabId) => void;
  children: ReactNode;
}) {
  const xp = useProgress((state) => state.xp);
  const todayXp = useProgress((state) => state.todayXp);
  const goal = useProgress((state) => state.dailyGoal);
  const hearts = useProgress((state) => state.hearts);
  const heartUpdatedAt = useProgress((state) => state.heartUpdatedAt);
  const streak = useProgress((state) =>
    effectiveStreak(state.streak, state.lastPracticeDate, state.shields),
  );
  const shields = useProgress((state) => state.shields);
  const gems = useProgress((state) => state.gems);
  const level = useProgress((state) => state.level);
  const mistakes = useProgress((state) => state.mistakes.length);
  const name = useProgress((state) => displayName(state.name));
  const ratio = Math.max(0, Math.min(1, todayXp / goal));
  const tip = TIPS[dayOfYear() % TIPS.length] ?? TIPS[0];
  const nextHeart = msUntilHeart(hearts, heartUpdatedAt);
  const t = useT();

  return (
    <div className="mx-auto flex h-dvh w-full max-w-5xl justify-center lg:gap-8 lg:px-6">
      <div className="phone-screen flex h-dvh w-full max-w-lg min-w-0 flex-col">
        <header className="shrink-0 px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mark />
              <span className="font-serif text-xl leading-none">Axiom</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span className="flex items-center gap-1 px-1.5 tabular-nums">
                <Flame
                  className={cn("size-4", streak > 0 ? "fill-copper text-copper" : "text-muted")}
                  aria-hidden
                />
                <span className="sr-only">Streak</span>
                {streak}
              </span>
              <span className="flex items-center gap-1 px-1.5 tabular-nums">
                <Heart
                  className={cn(
                    "size-4",
                    hearts > 0 ? "fill-copper text-copper" : "text-muted",
                  )}
                  aria-hidden
                />
                <span className="sr-only">Hearts</span>
                {hearts}
              </span>
              <span className="flex items-center gap-1 px-1.5 text-pine tabular-nums">
                <Zap className="size-4 fill-pine" aria-hidden />
                <span className="sr-only">XP</span>
                {xp}
              </span>
              <span className="hidden items-center gap-1 px-1.5 text-copper tabular-nums sm:flex">
                <Gem className="size-4" aria-hidden />
                <span className="sr-only">Gems</span>
                {gems}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-xs text-muted">
              <span>{ratio >= 1 ? t("goalMet") : t("today")}</span>
              <span className="tabular-nums">
                {todayXp}/{goal} XP
              </span>
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-deep"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={Math.min(goal, todayXp)}
              aria-label="Daily goal"
            >
              <div className="h-full bg-pine" style={{ width: `${ratio * 100}%` }} />
            </div>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
        <nav className="pad-safe shrink-0 border-t border-line bg-surface" aria-label="Primary">
          <div className="flex">
            {TABS.map((item) => {
              const active = tab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTab(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
                    active ? "font-semibold text-pine" : "text-muted",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {t(item.label)}
                  {item.id === "practice" && mistakes > 0 ? (
                    <span className="absolute top-2 right-7 size-2 rounded-full bg-copper" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
      <aside className="hidden h-dvh w-72 shrink-0 overflow-y-auto py-8 lg:block">
        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-end gap-3">
            <Companion mood={streak > 0 ? "cheer" : "idle"} className="h-20 shrink-0" />
            <p className="pb-1 text-xs font-semibold tracking-widest text-muted uppercase">
              {level ? `${level} · ${name}` : name}
            </p>
          </div>
          <p className="mt-3 font-serif text-4xl tabular-nums">
            {todayXp}
            <span className="text-xl text-muted">/{goal}</span>
          </p>
          <p className="text-sm text-muted">XP toward today’s goal</p>
          <p className="mt-4 text-sm">
            {streak > 0 ? `${streak}-day streak` : "Finish a lesson or a drill to start a streak."}
            {shields > 0 ? ` · ${shields} shield${shields === 1 ? "" : "s"}` : ""}
          </p>
          {hearts < 5 ? (
            <p className="mt-2 text-sm text-muted tabular-nums">
              Next heart in {formatClock(nextHeart)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Hearts are full.</p>
          )}
        </div>
        <p className="mt-4 px-1 text-sm text-pretty text-muted">{tip}</p>
      </aside>
    </div>
  );
}
