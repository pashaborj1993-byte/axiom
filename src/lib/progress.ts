import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CharacterId } from "@/data/characters";
import { characterId } from "@/data/characters";
import type { ThemeId } from "@/data/themes";
import { themeId } from "@/data/themes";
import type { Locale } from "@/i18n/messages";
import { localeId } from "@/i18n/messages";
import type { Track } from "@/data/placement";
import { dayDiff, localDateKey, yesterdayKey } from "./format";
import type { CampaignRecord, LearnerSnapshot } from "./learner-types";

export const MAX_HEARTS = 5;
export const HEART_MS = 20 * 60 * 1000;
export const GOALS = [50, 100, 150] as const;
export type Goal = (typeof GOALS)[number];

export type Graded = { id: string; correct: boolean };

export type CloudStatus = "idle" | "loading" | "ready" | "error" | "signedout";
export type SyncStatus = "idle" | "saving" | "saved" | "error";

type Data = {
  onboarded: boolean;
  name: string;
  level: Track | "";
  placementScore: number;
  placementTotal: number;
  dailyGoal: Goal;
  sound: boolean;
  xp: number;
  todayXp: number;
  todayDate: string;
  streak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  hearts: number;
  heartUpdatedAt: number;
  gems: number;
  shields: number;
  grace: number;
  crowns: Record<string, number>;
  placed: Record<string, boolean>;
  campaigns: Record<string, CampaignRecord>;
  mistakes: string[];
  correctCount: number;
  attemptCount: number;
  perfectLessons: number;
  character: CharacterId;
  bonusDate: string;
  locale: Locale;
  theme: ThemeId;
  cloudStatus: CloudStatus;
  cloudUserId: string;
  syncStatus: SyncStatus;
};

type LessonOutcome = {
  xp: number;
  accuracy: number;
  crown: number;
  crownedUp: boolean;
  perfect: boolean;
  streak: number;
  streakLine: string;
};

type DrillOutcome = {
  xp: number;
  accuracy: number;
  heartAwarded: boolean;
  streak: number;
  streakLine: string;
};

type CampaignOutcome = {
  xp: number;
  gems: number;
  accuracy: number;
  passed: boolean;
  shieldAwarded: boolean;
  streak: number;
  streakLine: string;
};

type Actions = {
  sync: () => void;
  setName: (name: string) => void;
  setGoal: (goal: Goal) => void;
  setSound: (sound: boolean) => void;
  setCharacter: (id: CharacterId) => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeId) => void;
  claimBonus: () => { xp: number; gems: number; heart: boolean } | null;
  loseHeart: () => number;
  noteMistake: (id: string) => void;
  completeLesson: (input: { lessonId: string; graded: Graded[] }) => LessonOutcome;
  finishDrill: (input: {
    graded: Graded[];
    xpEach: number;
    perfectBonus?: number;
    awardHeart?: boolean;
  }) => DrillOutcome;
  finishCampaign: (input: {
    id: string;
    graded: Graded[];
    rewardXp: number;
    rewardGems: number;
    passAt: number;
    grantsShield?: boolean;
  }) => CampaignOutcome;
  applyServer: (row: LearnerSnapshot | null, userId: string) => void;
  reset: () => void;
};

const initial: Data = {
  onboarded: false,
  name: "",
  level: "",
  placementScore: 0,
  placementTotal: 0,
  dailyGoal: 50,
  sound: true,
  xp: 0,
  todayXp: 0,
  todayDate: "",
  streak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  hearts: MAX_HEARTS,
  heartUpdatedAt: 0,
  gems: 0,
  shields: 0,
  grace: 0,
  crowns: {},
  placed: {},
  campaigns: {},
  mistakes: [],
  correctCount: 0,
  attemptCount: 0,
  perfectLessons: 0,
  character: "quill",
  bonusDate: "",
  locale: "en",
  theme: "lagoon",
  cloudStatus: "idle",
  cloudUserId: "",
  syncStatus: "idle",
};

function touchStreak(data: Data, today: string) {
  if (data.lastPracticeDate === today) {
    return {
      streak: data.streak,
      lastPracticeDate: today,
      longestStreak: data.longestStreak,
      grew: false,
      shields: data.shields,
      usedShield: false,
    };
  }
  let streak = 1;
  let shields = data.shields;
  let usedShield = false;
  if (data.lastPracticeDate) {
    const gap = dayDiff(data.lastPracticeDate, today);
    if (gap === 1) streak = data.streak + 1;
    else if (gap === 2 && data.shields > 0 && data.streak > 0) {
      streak = data.streak + 1;
      shields -= 1;
      usedShield = true;
    }
  }
  return {
    streak,
    lastPracticeDate: today,
    longestStreak: Math.max(data.longestStreak, streak),
    grew: true,
    shields,
    usedShield,
  };
}

function streakLine(grew: boolean, streak: number, usedShield = false) {
  if (usedShield) return `Shield used. ${streak}-day streak holds.`;
  if (!grew) return streak > 0 ? `Streak holds at ${streak}.` : "Finish a round to start a streak.";
  if (streak <= 1) return "Streak started. Come back tomorrow to keep it.";
  return `${streak}-day streak.`;
}

function mergeMistakes(current: string[], graded: Graded[]) {
  const right = new Set(graded.filter((item) => item.correct).map((item) => item.id));
  const wrong = graded.filter((item) => !item.correct).map((item) => item.id);
  const kept = current.filter((id) => !right.has(id) && !wrong.includes(id));
  return [...kept, ...wrong].slice(-40);
}

function accuracyOf(graded: Graded[]) {
  if (graded.length === 0) return 0;
  const correct = graded.filter((item) => item.correct).length;
  return Math.round((correct / graded.length) * 100);
}

function fromSnapshot(row: LearnerSnapshot): Partial<Data> {
  return {
    onboarded: true,
    name: row.displayName,
    level: row.level,
    placementScore: row.placementScore,
    placementTotal: row.placementTotal,
    dailyGoal: row.dailyGoal,
    sound: row.sound,
    xp: row.xp,
    todayXp: row.todayXp,
    todayDate: row.todayDate,
    streak: row.streak,
    longestStreak: row.longestStreak,
    lastPracticeDate: row.lastPracticeDate,
    hearts: row.hearts,
    heartUpdatedAt: row.heartUpdatedAt,
    gems: row.gems,
    shields: row.shields,
    grace: row.grace,
    crowns: row.crowns,
    placed: row.placed,
    campaigns: row.campaigns,
    mistakes: row.mistakes,
    correctCount: row.correctCount,
    attemptCount: row.attemptCount,
    perfectLessons: row.perfectLessons,
    character: characterId(row.character),
    bonusDate: row.bonusDate,
    locale: localeId(row.locale),
    theme: themeId(row.theme),
  };
}

export function toSnapshot(state: Data): LearnerSnapshot {
  return {
    displayName: state.name,
    level: state.level || "beginner",
    placementScore: state.placementScore,
    placementTotal: state.placementTotal,
    dailyGoal: state.dailyGoal,
    sound: state.sound,
    xp: state.xp,
    todayXp: state.todayXp,
    todayDate: state.todayDate,
    streak: state.streak,
    longestStreak: state.longestStreak,
    lastPracticeDate: state.lastPracticeDate,
    hearts: state.hearts,
    heartUpdatedAt: state.heartUpdatedAt,
    gems: state.gems,
    shields: state.shields,
    grace: state.grace,
    correctCount: state.correctCount,
    attemptCount: state.attemptCount,
    perfectLessons: state.perfectLessons,
    character: state.character,
    bonusDate: state.bonusDate,
    locale: state.locale,
    theme: state.theme,
    crowns: state.crowns,
    mistakes: state.mistakes,
    placed: state.placed,
    campaigns: state.campaigns,
  };
}

export function outOfLives(state: Pick<Data, "hearts" | "level" | "grace">) {
  if (state.hearts > 0) return false;
  return !(state.level === "beginner" && state.grace > 0);
}

export const useProgress = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      sync: () => {
        const now = Date.now();
        const today = localDateKey();
        const data = get();
        let hearts = data.hearts;
        let heartUpdatedAt = data.heartUpdatedAt || now;
        let todayXp = data.todayXp;
        let todayDate = data.todayDate;
        if (todayDate !== today) {
          todayXp = 0;
          todayDate = today;
        }
        if (hearts < MAX_HEARTS) {
          const gained = Math.floor((now - heartUpdatedAt) / HEART_MS);
          if (gained > 0) {
            hearts = Math.min(MAX_HEARTS, hearts + gained);
            heartUpdatedAt = hearts >= MAX_HEARTS ? now : heartUpdatedAt + gained * HEART_MS;
          }
        } else if (!data.heartUpdatedAt) {
          heartUpdatedAt = now;
        } else {
          heartUpdatedAt = data.heartUpdatedAt;
        }
        if (
          hearts !== data.hearts ||
          heartUpdatedAt !== data.heartUpdatedAt ||
          todayXp !== data.todayXp ||
          todayDate !== data.todayDate
        ) {
          set({ hearts, heartUpdatedAt, todayXp, todayDate });
        }
      },
      setName: (name) => set({ name: name.trim().slice(0, 24) }),
      setGoal: (goal) => set({ dailyGoal: goal }),
      setSound: (sound) => set({ sound }),
      setCharacter: (id) => set({ character: characterId(id) }),
      setLocale: (locale) => set({ locale: localeId(locale) }),
      setTheme: (theme) => set({ theme: themeId(theme) }),
      claimBonus: () => {
        const data = get();
        const today = localDateKey();
        if (data.bonusDate === today) return null;
        const heart = data.hearts < MAX_HEARTS;
        set({
          bonusDate: today,
          gems: data.gems + 15,
          xp: data.xp + 20,
          todayXp: data.todayDate === today ? data.todayXp + 20 : 20,
          todayDate: today,
          hearts: heart ? data.hearts + 1 : data.hearts,
        });
        return { xp: 20, gems: 15, heart };
      },
      loseHeart: () => {
        const data = get();
        if (data.level === "beginner" && data.grace > 0) {
          const grace = data.grace - 1;
          set({ grace });
          return data.hearts + grace;
        }
        if (data.hearts <= 0) return 0;
        const hearts = data.hearts - 1;
        const heartUpdatedAt = data.hearts === MAX_HEARTS ? Date.now() : data.heartUpdatedAt;
        set({ hearts, heartUpdatedAt });
        return hearts;
      },
      noteMistake: (id) => {
        const data = get();
        if (data.mistakes.includes(id)) return;
        set({ mistakes: [...data.mistakes, id].slice(-40) });
      },
      completeLesson: ({ lessonId, graded }) => {
        get().sync();
        const data = get();
        const today = localDateKey();
        const correct = graded.filter((item) => item.correct).length;
        const perfect = graded.length > 0 && correct === graded.length;
        const prev = data.crowns[lessonId] ?? 0;
        const first = prev === 0 && !data.placed[lessonId];
        let xp = correct * (first ? 10 : 6);
        if (perfect) xp += first ? 15 : 10;
        let crown = prev;
        let crownedUp = false;
        if (prev === 0) {
          crown = 1;
          crownedUp = true;
        } else if (perfect && prev < 3) {
          crown = prev + 1;
          crownedUp = true;
        }
        const placed = { ...data.placed };
        if (crown > 0) delete placed[lessonId];
        const streak = touchStreak(data, today);
        set({
          xp: data.xp + xp,
          todayXp: data.todayXp + xp,
          todayDate: today,
          streak: streak.streak,
          longestStreak: streak.longestStreak,
          lastPracticeDate: streak.lastPracticeDate,
          shields: streak.shields,
          crowns: { ...data.crowns, [lessonId]: crown },
          placed,
          mistakes: mergeMistakes(data.mistakes, graded),
          correctCount: data.correctCount + correct,
          attemptCount: data.attemptCount + graded.length,
          perfectLessons: data.perfectLessons + (perfect ? 1 : 0),
        });
        return {
          xp,
          accuracy: accuracyOf(graded),
          crown,
          crownedUp,
          perfect,
          streak: streak.streak,
          streakLine: streakLine(streak.grew, streak.streak, streak.usedShield),
        };
      },
      finishDrill: ({ graded, xpEach, perfectBonus = 0, awardHeart = false }) => {
        get().sync();
        const data = get();
        const today = localDateKey();
        const correct = graded.filter((item) => item.correct).length;
        const perfect = graded.length > 0 && correct === graded.length;
        let xp = correct * xpEach;
        if (perfect) xp += perfectBonus;
        const heartAwarded =
          awardHeart && graded.length > 0 && correct * 3 >= graded.length * 2 && data.hearts < MAX_HEARTS;
        const streak = touchStreak(data, today);
        set({
          xp: data.xp + xp,
          todayXp: data.todayXp + xp,
          todayDate: today,
          streak: streak.streak,
          longestStreak: streak.longestStreak,
          lastPracticeDate: streak.lastPracticeDate,
          shields: streak.shields,
          hearts: heartAwarded ? data.hearts + 1 : data.hearts,
          heartUpdatedAt: heartAwarded && data.hearts + 1 >= MAX_HEARTS ? Date.now() : data.heartUpdatedAt,
          mistakes: mergeMistakes(data.mistakes, graded),
          correctCount: data.correctCount + correct,
          attemptCount: data.attemptCount + graded.length,
        });
        return {
          xp,
          accuracy: accuracyOf(graded),
          heartAwarded,
          streak: streak.streak,
          streakLine: streakLine(streak.grew, streak.streak, streak.usedShield),
        };
      },
      finishCampaign: ({ id, graded, rewardXp, rewardGems, passAt, grantsShield = false }) => {
        get().sync();
        const data = get();
        const today = localDateKey();
        const accuracy = accuracyOf(graded);
        const passed = graded.length > 0 && accuracy >= passAt;
        const already = Boolean(data.campaigns[id]);
        const xp = passed ? rewardXp : Math.round(rewardXp * (accuracy / 100) * 0.4);
        const gems = passed && !already ? rewardGems : 0;
        const shieldAwarded = passed && grantsShield && !already;
        const streak = touchStreak(data, today);
        const correct = graded.filter((item) => item.correct).length;
        set({
          xp: data.xp + xp,
          todayXp: data.todayXp + xp,
          todayDate: today,
          gems: data.gems + gems,
          shields: streak.shields + (shieldAwarded ? 1 : 0),
          streak: streak.streak,
          longestStreak: streak.longestStreak,
          lastPracticeDate: streak.lastPracticeDate,
          campaigns: {
            ...data.campaigns,
            [id]: { accuracy, at: new Date().toISOString() },
          },
          mistakes: mergeMistakes(data.mistakes, graded),
          correctCount: data.correctCount + correct,
          attemptCount: data.attemptCount + graded.length,
        });
        return {
          xp,
          gems,
          accuracy,
          passed,
          shieldAwarded,
          streak: streak.streak,
          streakLine: streakLine(streak.grew, streak.streak, streak.usedShield),
        };
      },
      applyServer: (row, userId) => {
        if (!row) {
          set({
            ...initial,
            heartUpdatedAt: Date.now(),
            todayDate: localDateKey(),
            cloudStatus: "ready",
            cloudUserId: userId,
            syncStatus: "saved",
          });
          return;
        }
        set({
          ...initial,
          ...fromSnapshot(row),
          cloudStatus: "ready",
          cloudUserId: userId,
          syncStatus: "saved",
        });
        get().sync();
      },
      reset: () => set({ ...initial, heartUpdatedAt: Date.now(), todayDate: localDateKey() }),
    }),
    {
      name: "axiom-progress-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        onboarded: state.onboarded,
        name: state.name,
        level: state.level,
        placementScore: state.placementScore,
        placementTotal: state.placementTotal,
        dailyGoal: state.dailyGoal,
        sound: state.sound,
        xp: state.xp,
        todayXp: state.todayXp,
        todayDate: state.todayDate,
        streak: state.streak,
        longestStreak: state.longestStreak,
        lastPracticeDate: state.lastPracticeDate,
        hearts: state.hearts,
        heartUpdatedAt: state.heartUpdatedAt,
        gems: state.gems,
        shields: state.shields,
        grace: state.grace,
        crowns: state.crowns,
        placed: state.placed,
        campaigns: state.campaigns,
        mistakes: state.mistakes,
        correctCount: state.correctCount,
        attemptCount: state.attemptCount,
        perfectLessons: state.perfectLessons,
      }),
      onRehydrateStorage: () => () => {
        useProgress.getState().sync();
      },
    },
  ),
);

let lastSent = "";
let saveTimer: number | undefined;
let saving = false;
let dirty = false;

function scheduleSave() {
  if (typeof window === "undefined") return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void flushSave();
  }, 500);
}

async function flushSave() {
  const state = useProgress.getState();
  if (state.cloudStatus !== "ready" || !state.onboarded) return;
  const snap = toSnapshot(state);
  const encoded = JSON.stringify(snap);
  if (encoded === lastSent || saving) {
    if (encoded !== lastSent) dirty = true;
    return;
  }
  lastSent = encoded;
  saving = true;
  useProgress.setState({ syncStatus: "saving" });
  try {
    const { saveLearner } = await import("./learner.functions");
    const result = await saveLearner({ data: snap });
    useProgress.setState({ syncStatus: result.ok ? "saved" : "error" });
    if (!result.ok) lastSent = "";
  } catch {
    lastSent = "";
    useProgress.setState({ syncStatus: "error" });
  } finally {
    saving = false;
    if (dirty) {
      dirty = false;
      scheduleSave();
    }
  }
}

if (typeof window !== "undefined") {
  useProgress.subscribe((state) => {
    if (state.cloudStatus !== "ready" || !state.onboarded) return;
    const encoded = JSON.stringify(toSnapshot(state));
    if (encoded === lastSent) return;
    scheduleSave();
  });
}

export function effectiveStreak(streak: number, last: string | null, shields = 0, now = new Date()) {
  if (!last) return 0;
  const today = localDateKey(now);
  if (last === today || last === yesterdayKey(now)) return streak;
  if (shields > 0 && dayDiff(last, today) === 2) return streak;
  return 0;
}

export function msUntilHeart(hearts: number, heartUpdatedAt: number, now = Date.now()) {
  if (hearts >= MAX_HEARTS) return 0;
  const elapsed = Math.max(0, now - heartUpdatedAt);
  return HEART_MS - (elapsed % HEART_MS);
}

export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void Promise.resolve(useProgress.persist.rehydrate()).finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => useProgress.getState().sync(), 30_000);
    return () => window.clearInterval(id);
  }, [ready]);
  return ready;
}
