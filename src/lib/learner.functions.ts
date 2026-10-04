import { createServerFn } from "@tanstack/react-start";
import { campaignAllowed } from "@/data/campaigns";
import { getExercise, lessons } from "@/data/curriculum";
import {
  gradePlacement,
  placedLessonIds,
  placementQuestions,
  trackFor,
  type Track,
} from "@/data/placement";
import { authMiddleware } from "@/lib/auth/middleware";
import type { LearnerSnapshot, PlacementInput } from "@/lib/learner-types";

const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const goals = new Set([50, 100, 150]);

type Raw = Record<string, unknown>;

function asInt(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function asBool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "t" || value === 1) return true;
  if (value === "false" || value === "f" || value === 0) return false;
  return fallback;
}

function readJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return value ?? null;
}

function asRecord(value: unknown) {
  const parsed = readJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as Record<string, unknown>;
}

function asStringList(value: unknown) {
  const parsed = readJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string");
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function dateOrEmpty(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function dateOrNull(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function asTrack(value: unknown): Track {
  if (value === "intermediate" || value === "advanced" || value === "beginner") return value;
  return "beginner";
}

function crownsFrom(value: unknown) {
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (!lessonIds.has(key)) continue;
    out[key] = clamp(asInt(raw), 0, 3);
  }
  return out;
}

function placedFrom(value: unknown) {
  const out: Record<string, boolean> = {};
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (lessonIds.has(key) && raw === true) out[key] = true;
  }
  return out;
}

function campaignsFrom(value: unknown) {
  const out: LearnerSnapshot["campaigns"] = {};
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (!campaignAllowed(key) || !raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const at = typeof record.at === "string" ? record.at.slice(0, 40) : "";
    out[key] = { accuracy: clamp(asInt(record.accuracy), 0, 100), at };
  }
  return out;
}

function mistakesFrom(value: unknown) {
  const ids: string[] = [];
  for (const id of asStringList(value)) {
    if (!getExercise(id) || ids.includes(id)) continue;
    ids.push(id);
    if (ids.length >= 40) break;
  }
  return ids;
}

function toSnapshot(row: Raw): LearnerSnapshot {
  const goal = asInt(row.daily_goal, 50);
  return {
    displayName: typeof row.display_name === "string" ? row.display_name.slice(0, 24) : "",
    level: asTrack(row.level),
    placementScore: clamp(asInt(row.placement_score), 0, 50),
    placementTotal: clamp(asInt(row.placement_total, 8), 1, 50),
    dailyGoal: goals.has(goal) ? (goal as 50 | 100 | 150) : 50,
    sound: asBool(row.sound, true),
    xp: clamp(asInt(row.xp), 0, 2_000_000),
    todayXp: clamp(asInt(row.today_xp), 0, 5_000),
    todayDate: dateOrEmpty(row.today_date),
    streak: clamp(asInt(row.streak), 0, 10_000),
    longestStreak: clamp(asInt(row.longest_streak), 0, 10_000),
    lastPracticeDate: dateOrNull(row.last_practice_date),
    hearts: clamp(asInt(row.hearts, 5), 0, 5),
    heartUpdatedAt: clamp(asInt(row.heart_updated_at), 0, 9_999_999_999_999),
    gems: clamp(asInt(row.gems), 0, 100_000),
    shields: clamp(asInt(row.shields), 0, 20),
    grace: clamp(asInt(row.grace), 0, 20),
    correctCount: clamp(asInt(row.correct_count), 0, 1_000_000),
    attemptCount: clamp(asInt(row.attempt_count), 0, 1_000_000),
    perfectLessons: clamp(asInt(row.perfect_lessons), 0, 100_000),
    crowns: crownsFrom(row.crowns),
    mistakes: mistakesFrom(row.mistakes),
    placed: placedFrom(row.placed),
    campaigns: campaignsFrom(row.campaigns),
  };
}

function parseProgress(input: unknown): LearnerSnapshot {
  if (!input || typeof input !== "object") throw new Error("Invalid progress");
  const raw = input as Record<string, unknown>;
  const goal = asInt(raw.dailyGoal, 50);
  return {
    displayName: typeof raw.displayName === "string" ? raw.displayName.trim().slice(0, 24) : "",
    level: "beginner",
    placementScore: 0,
    placementTotal: placementQuestions.length,
    dailyGoal: goals.has(goal) ? (goal as 50 | 100 | 150) : 50,
    sound: raw.sound !== false,
    xp: clamp(asInt(raw.xp), 0, 2_000_000),
    todayXp: clamp(asInt(raw.todayXp), 0, 5_000),
    todayDate: dateOrEmpty(raw.todayDate),
    streak: clamp(asInt(raw.streak), 0, 10_000),
    longestStreak: clamp(asInt(raw.longestStreak), 0, 10_000),
    lastPracticeDate: dateOrNull(raw.lastPracticeDate),
    hearts: clamp(asInt(raw.hearts, 5), 0, 5),
    heartUpdatedAt: clamp(asInt(raw.heartUpdatedAt), 0, 9_999_999_999_999),
    gems: clamp(asInt(raw.gems), 0, 100_000),
    shields: clamp(asInt(raw.shields), 0, 20),
    grace: clamp(asInt(raw.grace), 0, 20),
    correctCount: clamp(asInt(raw.correctCount), 0, 1_000_000),
    attemptCount: clamp(asInt(raw.attemptCount), 0, 1_000_000),
    perfectLessons: clamp(asInt(raw.perfectLessons), 0, 100_000),
    crowns: crownsFrom(raw.crowns),
    mistakes: mistakesFrom(raw.mistakes),
    placed: {},
    campaigns: campaignsFrom(raw.campaigns),
  };
}

function parsePlacement(input: unknown): PlacementInput {
  if (!input || typeof input !== "object") throw new Error("Invalid placement");
  const raw = input as Record<string, unknown>;
  const goal = asInt(raw.goal, 50);
  const answersRaw = Array.isArray(raw.answers) ? raw.answers : [];
  const answers = placementQuestions.map((question) => {
    const found = answersRaw.find(
      (item) => item && typeof item === "object" && (item as { id?: unknown }).id === question.id,
    ) as { choice?: unknown } | undefined;
    const choice = typeof found?.choice === "string" ? found.choice : "";
    if (!question.options.includes(choice)) throw new Error("Answer every question");
    return { id: question.id, choice };
  });
  return {
    name: typeof raw.name === "string" ? raw.name.trim().slice(0, 24) : "",
    goal: goals.has(goal) ? (goal as 50 | 100 | 150) : 50,
    replace: raw.replace === true,
    answers,
  };
}

async function readProfile(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<Raw>`select * from learner_profiles where user_id = ${userId} limit 1`;
  return rows[0] ? toSnapshot(rows[0]) : null;
}

export const loadLearner = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LearnerSnapshot | null> => {
    return readProfile(context.userId);
  });

export const saveLearner = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseProgress(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const existing = await sql<{ user_id: string }>`
      select user_id from learner_profiles where user_id = ${context.userId} limit 1
    `;
    if (existing.length === 0) return { ok: false as const };
    await sql`
      update learner_profiles set
        display_name = ${data.displayName},
        daily_goal = ${data.dailyGoal},
        sound = ${data.sound},
        xp = ${data.xp},
        today_xp = ${data.todayXp},
        today_date = ${data.todayDate},
        streak = ${data.streak},
        longest_streak = ${data.longestStreak},
        last_practice_date = ${data.lastPracticeDate},
        hearts = ${data.hearts},
        heart_updated_at = ${data.heartUpdatedAt},
        gems = ${data.gems},
        shields = ${data.shields},
        grace = ${data.grace},
        correct_count = ${data.correctCount},
        attempt_count = ${data.attemptCount},
        perfect_lessons = ${data.perfectLessons},
        crowns = ${JSON.stringify(data.crowns)},
        mistakes = ${JSON.stringify(data.mistakes)},
        campaigns = ${JSON.stringify(data.campaigns)},
        updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const completePlacement = createServerFn({ method: "POST" })
  .validator((input: unknown) => parsePlacement(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<LearnerSnapshot> => {
    const existing = await readProfile(context.userId);
    if (existing && !data.replace) return existing;
    const graded = gradePlacement(data.answers);
    const level = trackFor(graded.score);
    const placed: Record<string, boolean> = {};
    for (const id of placedLessonIds(level)) placed[id] = true;
    const grace = level === "beginner" ? 5 : 0;
    const shields = level === "beginner" ? 1 : 0;
    const now = Date.now();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into learner_profiles (
        user_id, display_name, level, placement_score, placement_total, daily_goal,
        sound, xp, today_xp, today_date, streak, longest_streak, last_practice_date,
        hearts, heart_updated_at, gems, shields, grace, correct_count, attempt_count,
        perfect_lessons, crowns, mistakes, placed, campaigns
      ) values (
        ${context.userId}, ${data.name}, ${level}, ${graded.score}, ${graded.total}, ${data.goal},
        ${existing?.sound ?? true}, 0, 0, '', 0, 0, null,
        5, ${now}, 0, ${shields}, ${grace}, 0, 0,
        0, '{}', '[]', ${JSON.stringify(placed)}, '{}'
      )
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        level = excluded.level,
        placement_score = excluded.placement_score,
        placement_total = excluded.placement_total,
        daily_goal = excluded.daily_goal,
        xp = 0,
        today_xp = 0,
        today_date = '',
        streak = 0,
        longest_streak = 0,
        last_practice_date = null,
        hearts = 5,
        heart_updated_at = excluded.heart_updated_at,
        gems = 0,
        shields = excluded.shields,
        grace = excluded.grace,
        correct_count = 0,
        attempt_count = 0,
        perfect_lessons = 0,
        crowns = '{}',
        mistakes = '[]',
        placed = excluded.placed,
        campaigns = '{}',
        updated_at = now()
    `;
    const saved = await readProfile(context.userId);
    if (!saved) throw new Error("Could not save placement");
    return saved;
  });
