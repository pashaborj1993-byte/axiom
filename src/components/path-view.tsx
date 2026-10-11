import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Gift, Lock, Sparkles, Swords, Trophy } from "lucide-react";
import {
  campaignAvailability,
  campaignKey,
  campaignLockReason,
  campaigns,
  exercisesForCampaign,
  type CampaignDef,
  type CampaignPlay,
} from "@/data/campaigns";
import {
  currentLessonId,
  isUnlocked,
  lessons,
  tally,
  units,
  type Credit,
} from "@/data/curriculum";
import type { Lesson } from "@/data/types";
import { trackCopy, type Track } from "@/data/placement";
import { Companion } from "@/components/companion";
import { unitCopy } from "@/i18n/plain";
import { useLocale, useT } from "@/i18n/use-t";
import { DailyBonus } from "@/components/daily-bonus";
import { FieldNotes } from "@/components/field-notes";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MAX_HEARTS, msUntilHeart, outOfLives, useProgress } from "@/lib/progress";

const WORDS: Record<string, { term: string; plain: string }[]> = {
  foundations: [
    { term: "Model", plain: "A program that learned patterns from examples." },
    { term: "Narrow", plain: "Built for one family of jobs, not every job." },
    { term: "Dataset", plain: "The pile of examples. Holes in the pile become holes in the skill." },
  ],
  learning: [
    { term: "Label", plain: "The answer attached to an example, like spam or not." },
    { term: "Test set", plain: "A sealed pile. The honest grade uses cases the model did not train on." },
    { term: "Loss", plain: "The number training tries to push down. Not the same as a happy user." },
  ],
  networks: [
    { term: "Weight", plain: "A number inside the model that training changes." },
    { term: "Embedding", plain: "A list of numbers standing in for a word or a picture." },
    { term: "Transformer", plain: "The structure most chat models use. Not a claim of understanding." },
  ],
  language: [
    { term: "Token", plain: "A chunk of text the model actually reads, not always a whole word." },
    { term: "Window", plain: "How much text fits in one call. Outside it, this call cannot see." },
    { term: "System prompt", plain: "The product’s instructions. Still just text, not a law." },
  ],
  craft: [
    { term: "Spec", plain: "A prompt you can grade: the job, the material, the shape, the empty case." },
    { term: "Latency", plain: "How long someone waits. A late right answer can still fail." },
    { term: "Tool", plain: "Something the model can do in the world, beyond writing a reply." },
  ],
  judgment: [
    { term: "Evaluation", plain: "A set of checks you trust, not a single impressive demo." },
    { term: "Log", plain: "A copy of what you pasted. The chat screen is not the only one." },
    { term: "License", plain: "Whether you are allowed to use the work. Fluency is not one." },
  ],
  workshop: [
    { term: "Eval", plain: "The same cases, scored the same way, every time you change something." },
    { term: "Guardrail", plain: "A check around the model. It limits damage. It does not add wisdom." },
    { term: "Drift", plain: "The world moved after you measured. Yesterday’s score expired." },
  ],
  frontier: [
    { term: "Scaling", plain: "More data and more compute. A spend, not a personality." },
    { term: "Adapter", plain: "A small set of extra weights for a narrower job." },
    { term: "Open weights", plain: "You can download the model. The license is a separate question." },
  ],
};

const LANES = [0, 1, 2, 1, 0, -1, -2, -1] as const;
const ROW = 156;
const PAD = 88;
const WIDTH = 320;

function lessonLane(index: number) {
  return LANES[index % LANES.length] ?? 0;
}

function xOf(lane: number) {
  return WIDTH / 2 + lane * 52;
}

type MapNode =
  | { kind: "lesson"; lesson: Lesson; lessonIndex: number }
  | { kind: "campaign"; def: CampaignDef; lessonLane: number };

export function PathView({
  focus,
  onPlay,
}: {
  focus?: string;
  onPlay: (session: CampaignPlay) => void;
}) {
  const navigate = useNavigate();
  const crowns = useProgress((state) => state.crowns);
  const placed = useProgress((state) => state.placed);
  const hearts = useProgress((state) => state.hearts);
  const grace = useProgress((state) => state.grace);
  const level = useProgress((state) => state.level);
  const heartUpdatedAt = useProgress((state) => state.heartUpdatedAt);
  const campaignsDone = useProgress((state) => state.campaigns);
  const credit: Credit = { crowns, placed };
  const current = currentLessonId(credit);
  const progress = tally(credit);
  const [pending, setPending] = useState<string | null>(null);
  const [picked, setPicked] = useState<CampaignDef | null>(null);
  const slice = { level, crowns, placed, campaigns: campaignsDone };
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    const id = focus || current;
    if (!id) return;
    document.getElementById(`node-${id}`)?.scrollIntoView({ block: "center" });
  }, [focus, current]);

  function open(id: string) {
    if (!isUnlocked(id, credit)) return;
    if (outOfLives({ hearts, level, grace })) {
      setPending(id);
      return;
    }
    void navigate({ to: "/lesson/$lessonId", params: { lessonId: id } });
  }

  const track = level ? trackCopy(level as Track) : null;

  return (
    <div className="px-4 pt-5 pb-8">
      {track ? (
        <section className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-pine uppercase">
            {level === "beginner" ? t("beginnerTitle") : level === "intermediate" ? t("intermediateTitle") : t("advancedTitle")}
          </p>
          <p className="mt-1 text-sm text-pretty text-muted">
            {level === "beginner" ? t("beginnerLede") : level === "intermediate" ? t("intermediateLede") : t("advancedLede")}
          </p>
          <p className="mt-2 text-sm tabular-nums text-muted">
            {progress.cleared}/{progress.total} lessons
            {progress.placed > 0 ? ` · ${progress.placed} placed out` : ""}
          </p>
        </section>
      ) : null}
      <DailyBonus />
      <FieldNotes />
      {progress.cleared === progress.total ? (
        <section className="surface-card mb-6 rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-widest text-pine uppercase">Path complete</p>
          <h2 className="mt-1 font-serif text-2xl">{t("pathComplete")}</h2>
          <p className="mt-2 text-sm text-pretty text-muted">{t("replay")}</p>
        </section>
      ) : null}
      {units.map((unit, unitIndex) => {
        const nodes: MapNode[] = [];
        unit.lessons.forEach((lesson, lessonIndex) => {
          nodes.push({ kind: "lesson", lesson, lessonIndex });
          for (const def of campaigns) {
            if (def.afterLessonId !== lesson.id) continue;
            if (campaignAvailability(def, slice) === "hidden") continue;
            nodes.push({ kind: "campaign", def, lessonLane: lessonLane(lessonIndex) });
          }
        });
        const done = unit.lessons.filter(
          (lesson) => (crowns[lesson.id] ?? 0) > 0 || placed[lesson.id],
        ).length;
        const lessonPoints = nodes.flatMap((node, index) =>
          node.kind === "lesson"
            ? [{ x: xOf(lessonLane(node.lessonIndex)), y: index * ROW + PAD + 32, id: node.lesson.id }]
            : [],
        );
        const height = nodes.length * ROW + PAD + 36;
        const words = level === "beginner" ? WORDS[unit.id] : undefined;
        const spoken = unitCopy(unit.id, locale);
        return (
          <section key={unit.id} className="mb-8">
            <div
              className={cn(
                "relative z-10 rounded-2xl px-5 py-4",
                unitIndex % 2 === 0 ? "bg-ink text-paper" : "bg-pine text-paper",
              )}
            >
              <p
                className={cn(
                  "text-xs font-semibold tracking-widest uppercase",
                  unitIndex % 2 === 0 ? "text-copper" : "text-paper/80",
                )}
              >
                {t("unit")} {unitIndex + 1}
              </p>
              <h2 className="mt-1 font-serif text-3xl leading-tight">{spoken?.title ?? unit.title}</h2>
              <p className="mt-1 text-sm text-paper/80">{spoken?.blurb ?? unit.blurb}</p>
              <p className="mt-3 text-sm tabular-nums text-paper/70">
                {done}/{unit.lessons.length} lessons
              </p>
              <details className="mt-3">
                <summary className={cn("text-sm font-semibold", unitIndex % 2 === 0 ? "text-copper" : "text-paper")}>
                  {level === "beginner" ? "Guidebook and words" : "Guidebook"}
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-paper/90">
                  {unit.guide.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {words ? (
                  <dl className="mt-3 space-y-2">
                    {words.map((item) => (
                      <div key={item.term}>
                        <dt className="text-sm font-semibold">{item.term}</dt>
                        <dd className="text-sm text-paper/80">{item.plain}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </details>
            </div>
            <div className="map-ground relative mx-auto mt-6 w-80" style={{ height }}>
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${WIDTH} ${height}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                {lessonPoints.slice(0, -1).map((point, index) => {
                  const next = lessonPoints[index + 1]!;
                  const doneSeg = (crowns[point.id] ?? 0) > 0 || placed[point.id];
                  const mid = (point.y + next.y) / 2;
                  return (
                    <path
                      key={`${point.id}-${next.id}`}
                      d={`M ${point.x} ${point.y} C ${point.x} ${mid}, ${next.x} ${mid}, ${next.x} ${next.y}`}
                      pathLength={100}
                      className={cn("path-draw", doneSeg ? "stroke-pine" : "stroke-line")}
                      strokeWidth={14}
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}
                {nodes.map((node, index) => {
                  if (node.kind !== "campaign") return null;
                  const y = index * ROW + PAD + 32;
                  const x = xOf(node.lessonLane >= 0 ? -2 : 2);
                  const from = lessonPoints.find((point) => point.id === node.def.afterLessonId);
                  if (!from) return null;
                  return (
                    <path
                      key={node.def.id}
                      d={`M ${from.x} ${from.y} L ${x} ${y}`}
                      className="stroke-copper"
                      strokeWidth={3}
                      strokeDasharray="6 6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              {nodes.map((node, index) => {
                const top = index * ROW + PAD;
                if (node.kind === "campaign") {
                  const lane = node.lessonLane >= 0 ? -2 : 2;
                  const availability = campaignAvailability(node.def, slice);
                  const open = availability === "open" || availability === "done";
                  return (
                    <div
                      key={node.def.id}
                      className="node-pop absolute"
                      style={{ left: xOf(lane), top, animationDelay: `${Math.min(index, 8) * 40}ms` }}
                    >
                      <button
                        type="button"
                        disabled={!open}
                        onClick={() => setPicked(node.def)}
                        aria-label={
                          open
                            ? `${node.def.title}, bonus campaign`
                            : `${node.def.title}, ${campaignLockReason(node.def, slice)}`
                        }
                        className={cn(
                          "press relative flex size-14 -translate-x-1/2 items-center justify-center rounded-2xl",
                          availability === "done" && "bg-pine text-paper",
                          availability === "open" && "surface-card text-copper",
                          availability === "locked" && "bg-paper-deep text-muted",
                        )}
                      >
                        <span className={cn("inline-flex", availability === "open" && "wiggle")}>
                          {availability === "locked" ? (
                            <Lock className="size-5" aria-hidden />
                          ) : node.def.kind === "legendary" ? (
                            <Swords className="size-6" aria-hidden />
                          ) : node.def.kind === "sprint" ? (
                            <Sparkles className="size-6" aria-hidden />
                          ) : (
                            <Gift className="size-6" aria-hidden />
                          )}
                        </span>
                      </button>
                      <p className="mt-1 w-24 -translate-x-1/2 text-center text-xs font-medium text-balance">
                        {node.def.title}
                      </p>
                    </div>
                  );
                }
                const lesson = node.lesson;
                const crown = crowns[lesson.id] ?? 0;
                const wasPlaced = Boolean(placed[lesson.id]) && crown === 0;
                const unlocked = isUnlocked(lesson.id, credit);
                const active = lesson.id === current;
                const lane = lessonLane(node.lessonIndex);
                return (
                  <div
                    key={lesson.id}
                    id={`node-${lesson.id}`}
                    className="node-pop absolute scroll-mt-28"
                    style={{ left: xOf(lane), top, animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    {active ? (
                      <div className="absolute bottom-full left-0 mb-2 -translate-x-1/2">
                        <div className="bob flex flex-col items-center">
                          <Companion mood="idle" className="h-14" />
                          <span className="mt-1 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">
                            Start
                          </span>
                        </div>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => open(lesson.id)}
                      aria-label={
                        !unlocked
                          ? `${lesson.title}, locked`
                          : wasPlaced
                            ? `${lesson.title}, placed out`
                            : `${lesson.title}, crown ${crown} of 3`
                      }
                      className={cn(
                        "press relative flex size-16 -translate-x-1/2 items-center justify-center rounded-full",
                        !unlocked && "bg-paper-deep text-muted",
                        unlocked && crown > 0 && "bg-pine text-paper",
                        unlocked && crown === 0 && !wasPlaced && "surface-card text-pine",
                        wasPlaced && "bg-pine-soft text-pine-deep",
                        active && "ring-pulse",
                      )}
                    >
                      {!unlocked ? (
                        <Lock className="size-5" aria-hidden />
                      ) : wasPlaced ? (
                        <Check className="size-6" aria-hidden />
                      ) : lesson.checkpoint ? (
                        <Trophy className="size-6" aria-hidden />
                      ) : crown > 0 ? (
                        <Check className="size-6" aria-hidden />
                      ) : (
                        <span className="font-serif text-xl tabular-nums">
                          {lessons.findIndex((item) => item.id === lesson.id) + 1}
                        </span>
                      )}
                    </button>
                    <p className="mt-2 w-28 -translate-x-1/2 text-center text-xs font-medium text-balance">
                      {lesson.title}
                    </p>
                    {wasPlaced ? (
                      <p className="w-28 -translate-x-1/2 text-center text-xs text-pine">Placed</p>
                    ) : unlocked ? (
                      <div className="mt-1 flex w-16 -translate-x-1/2 justify-center gap-1" aria-hidden>
                        {[1, 2, 3].map((pip) => (
                          <span
                            key={pip}
                            className={cn("size-1.5 rounded-full", pip <= crown ? "bg-copper" : "bg-line")}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {current ? (
        <div className="sticky bottom-3 z-20 flex justify-center">
          <button
            type="button"
            className="press flex h-14 max-w-full items-center gap-2 rounded-full bg-pine pr-5 pl-2 font-semibold text-paper"
            onClick={() => {
              document.getElementById(`node-${current}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              open(current);
            }}
          >
            <Companion mood="greet" className="h-12" />
            <span className="truncate">Start · {lessons.find((lesson) => lesson.id === current)?.title}</span>
          </button>
        </div>
      ) : null}
      {pending ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 px-4 pb-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hearts-title"
        >
          <div className="surface-card w-full max-w-lg rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Companion
                mood={outOfLives({ hearts, level, grace }) ? "wilt" : "cheer"}
                className="h-20 shrink-0"
              />
              <div className="min-w-0">
                <h2 id="hearts-title" className="font-serif text-2xl">
                  {outOfLives({ hearts, level, grace }) ? "Out of hearts" : "A heart is back"}
                </h2>
                <p className="mt-2 text-sm text-pretty text-muted">
                  {outOfLives({ hearts, level, grace })
                    ? `Hearts refill one every 20 minutes, up to ${MAX_HEARTS}. A short drill can earn one now, and it will not cost hearts.`
                    : "You can start the lesson."}
                </p>
              </div>
            </div>
            {hearts <= 0 ? (
              <p className="mt-3 text-sm font-semibold tabular-nums">
                Next heart in {formatClock(msUntilHeart(hearts, heartUpdatedAt))}
              </p>
            ) : null}
            <div className="mt-5 grid gap-2">
              {!outOfLives({ hearts, level, grace }) ? (
                <button
                  type="button"
                  className="press h-12 rounded-xl bg-pine font-semibold text-paper"
                  onClick={() => {
                    const id = pending;
                    setPending(null);
                    void navigate({ to: "/lesson/$lessonId", params: { lessonId: id } });
                  }}
                >
                  Start lesson
                </button>
              ) : (
                <button
                  type="button"
                  className="press h-12 rounded-xl bg-pine font-semibold text-paper"
                  onClick={() => {
                    setPending(null);
                    void navigate({ to: "/", search: { tab: "practice", drill: "repair" } });
                  }}
                >
                  Earn a heart
                </button>
              )}
              <button type="button" className="press h-12 rounded-xl font-semibold text-ink" onClick={() => setPending(null)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {picked ? (
        <CampaignSheet
          def={picked}
          availability={campaignAvailability(picked, slice)}
          reason={campaignLockReason(picked, slice)}
          onClose={() => setPicked(null)}
          onStart={() => {
            const def = picked;
            setPicked(null);
            const exercises = exercisesForCampaign(def, `${campaignKey(def)}-${Date.now()}`);
            if (exercises.length === 0) return;
            onPlay({
              kind: "campaign",
              campaignId: campaignKey(def),
              title: def.title,
              kicker: def.kind === "legendary" ? "Legendary" : def.kind === "sprint" ? "Bonus campaign" : "Bonus chest",
              idea: `${def.blurb} Clear ${def.passAt}% for the full reward. Hearts are not at stake.`,
              exercises,
              rewardGems: def.rewardGems,
              rewardXp: def.rewardXp,
              passAt: def.passAt,
              grantsShield: Boolean(def.grantsShield),
            });
          }}
        />
      ) : null}
    </div>
  );
}

function CampaignSheet({
  def,
  availability,
  reason,
  onClose,
  onStart,
}: {
  def: CampaignDef;
  availability: ReturnType<typeof campaignAvailability>;
  reason: string;
  onClose: () => void;
  onStart: () => void;
}) {
  const open = availability === "open" || availability === "done";
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 px-4 pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-title"
    >
      <div className="surface-card w-full max-w-lg rounded-2xl p-5">
        <p className="text-xs font-semibold tracking-widest text-copper uppercase">
          {def.kind === "legendary" ? "Legendary" : def.kind === "sprint" ? "Campaign" : "Chest"}
        </p>
        <h2 id="campaign-title" className="mt-1 font-serif text-2xl">
          {def.title}
        </h2>
        <p className="mt-2 text-sm text-pretty text-muted">{def.blurb}</p>
        <p className="mt-3 text-sm font-semibold">
          {def.rewardGems} gems · {def.rewardXp} XP
          {def.grantsShield ? " · a streak shield" : ""}
        </p>
        {availability === "locked" ? <p className="mt-2 text-sm text-muted">{reason}</p> : null}
        {availability === "done" ? (
          <p className="mt-2 text-sm text-muted">Cleared. A replay keeps the streak honest, without the gem prize.</p>
        ) : null}
        <div className="mt-5 grid gap-2">
          {open ? (
            <button type="button" className="press h-12 rounded-xl bg-pine font-semibold text-paper" onClick={onStart}>
              {availability === "done" ? "Replay" : "Start bonus"}
            </button>
          ) : null}
          <button type="button" className="press h-12 rounded-xl font-semibold" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
