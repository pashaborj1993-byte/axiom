import { getUnitOf, lessons, units } from "./curriculum";
import type { Exercise } from "./types";
import { isoWeekKey, isWeekend } from "@/lib/format";
import { pickN } from "@/lib/seed";
import type { Track } from "./placement";

export type CampaignKind = "chest" | "sprint" | "legendary";

export type CampaignDef = {
  id: string;
  title: string;
  blurb: string;
  kind: CampaignKind;
  afterLessonId: string;
  rewardGems: number;
  rewardXp: number;
  passAt: number;
  grantsShield?: boolean;
  beginnerOnly?: boolean;
  weekend?: boolean;
  requiresLesson?: string;
  minCrowns?: number;
  count: number;
  unitId?: string;
};

export type CampaignPlay = {
  kind: "campaign";
  campaignId: string;
  title: string;
  kicker: string;
  idea: string;
  exercises: Exercise[];
  rewardGems: number;
  rewardXp: number;
  passAt: number;
  grantsShield: boolean;
};

export const campaigns: CampaignDef[] = [
  {
    id: "camp-words",
    title: "Word camp",
    blurb: "Four plain checks from the first lesson. No hearts. A soft start.",
    kind: "chest",
    afterLessonId: "foundations-meaning",
    rewardGems: 15,
    rewardXp: 20,
    passAt: 50,
    beginnerOnly: true,
    count: 4,
    unitId: "foundations",
  },
  {
    id: "camp-spot",
    title: "Spot the model",
    blurb: "A short dare: which of these learned, and which is only a rule?",
    kind: "chest",
    afterLessonId: "foundations-around",
    rewardGems: 20,
    rewardXp: 25,
    passAt: 60,
    requiresLesson: "foundations-around",
    minCrowns: 1,
    count: 4,
    unitId: "foundations",
  },
  {
    id: "camp-holdout",
    title: "Holdout dare",
    blurb: "Bonus questions on piles, scores, and leans. The test set stays sealed.",
    kind: "chest",
    afterLessonId: "learning-bias",
    rewardGems: 30,
    rewardXp: 30,
    passAt: 75,
    requiresLesson: "learning-bias",
    minCrowns: 1,
    count: 4,
    unitId: "learning",
  },
  {
    id: "camp-weekend",
    title: "Weekend lab",
    blurb: "Opens Saturday and Sunday. A fresh mix, and gems if you clear it.",
    kind: "sprint",
    afterLessonId: "learning-generalize",
    rewardGems: 40,
    rewardXp: 40,
    passAt: 60,
    weekend: true,
    requiresLesson: "learning-supervised",
    minCrowns: 1,
    count: 5,
  },
  {
    id: "camp-signal",
    title: "Signal chest",
    blurb: "Bonus questions after the network checkpoint.",
    kind: "chest",
    afterLessonId: "networks-attention",
    rewardGems: 30,
    rewardXp: 35,
    passAt: 75,
    requiresLesson: "networks-attention",
    minCrowns: 1,
    count: 4,
    unitId: "networks",
  },
  {
    id: "camp-shield",
    title: "Streak shield",
    blurb: "Clear this once and bank a shield. It saves a single missed day.",
    kind: "chest",
    afterLessonId: "language-limits",
    rewardGems: 10,
    rewardXp: 25,
    passAt: 75,
    grantsShield: true,
    requiresLesson: "language-tokens",
    minCrowns: 1,
    count: 4,
    unitId: "language",
  },
  {
    id: "camp-bench",
    title: "Bench day",
    blurb: "A pro round from the workshop. Clear it and the gem purse is heavy.",
    kind: "chest",
    afterLessonId: "workshop-ship",
    rewardGems: 50,
    rewardXp: 45,
    passAt: 75,
    requiresLesson: "workshop-ship",
    minCrowns: 1,
    count: 4,
    unitId: "workshop",
  },
  {
    id: "camp-legendary",
    title: "Legendary call",
    blurb: "The last dare. It asks for two crowns on the final checkpoint.",
    kind: "legendary",
    afterLessonId: "frontier-call",
    rewardGems: 80,
    rewardXp: 60,
    passAt: 80,
    requiresLesson: "frontier-call",
    minCrowns: 2,
    count: 5,
    unitId: "frontier",
  },
];

export type CampaignRecord = { accuracy: number; at: string };

export function campaignKey(def: CampaignDef, now = new Date()) {
  return def.weekend ? `${def.id}:${isoWeekKey(now)}` : def.id;
}

export function campaignAllowed(id: string) {
  if (campaigns.some((item) => item.id === id)) return true;
  const [base, week] = id.split(":");
  return Boolean(base && week && /^\d{4}-W\d{2}$/.test(week) && campaigns.some((item) => item.weekend && item.id === base));
}

type ProgressSlice = {
  level: Track | "";
  crowns: Record<string, number>;
  placed: Record<string, boolean>;
  campaigns: Record<string, CampaignRecord>;
};

export type CampaignAvailability = "hidden" | "locked" | "open" | "done";

export function campaignAvailability(def: CampaignDef, state: ProgressSlice, now = new Date()): CampaignAvailability {
  if (def.beginnerOnly && state.level !== "beginner") return "hidden";
  const key = campaignKey(def, now);
  if (state.campaigns[key]) return "done";
  if (def.weekend && !isWeekend(now)) return "locked";
  if (def.requiresLesson) {
    const crowns = state.crowns[def.requiresLesson] ?? 0;
    const placed = Boolean(state.placed[def.requiresLesson]);
    const need = def.minCrowns ?? 1;
    if (crowns < need && !(placed && need <= 1)) return "locked";
  }
  return "open";
}

export function campaignLockReason(def: CampaignDef, state: ProgressSlice, now = new Date()) {
  if (def.weekend && !isWeekend(now)) return "Opens Saturday";
  if (def.requiresLesson) {
    const need = def.minCrowns ?? 1;
    const lesson = lessons.find((item) => item.id === def.requiresLesson);
    if (need >= 2) return `Needs ${need} crowns on ${lesson?.title ?? "the checkpoint"}`;
    return `Finish ${lesson?.title ?? "the lesson"} first`;
  }
  return "Locked";
}

export function exercisesForCampaign(def: CampaignDef, seed: string): Exercise[] {
  if (def.unitId) {
    const unit = units.find((item) => item.id === def.unitId);
    const pool = unit?.lessons.flatMap((lesson) => lesson.exercises) ?? [];
    return pickN(pool, def.count, seed);
  }
  const anchor = lessons.find((lesson) => lesson.id === def.afterLessonId);
  const unit = anchor ? getUnitOf(anchor.id) : undefined;
  const pool = (unit ?? units[0])!.lessons.flatMap((lesson) => lesson.exercises);
  return pickN(pool, def.count, seed);
}
