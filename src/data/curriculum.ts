import type { Exercise, Lesson, Unit } from "./types";
import { craft } from "./units/craft";
import { foundations } from "./units/foundations";
import { judgment } from "./units/judgment";
import { language } from "./units/language";
import { learning } from "./units/learning";
import { networks } from "./units/networks";

export const units: Unit[] = [foundations, learning, networks, language, craft, judgment];

export const lessons: Lesson[] = units.flatMap((unit) => unit.lessons);

const exerciseIds = new Set<string>();
for (const lesson of lessons) {
  const local = new Set<string>();
  for (const exercise of lesson.exercises) {
    if (local.has(exercise.id) || exerciseIds.has(exercise.id)) {
      throw new Error(`Duplicate exercise id ${exercise.id}`);
    }
    local.add(exercise.id);
    exerciseIds.add(exercise.id);
    if (exercise.type === "choice" && !exercise.options.includes(exercise.answer)) {
      throw new Error(`Choice answer missing from options: ${exercise.id}`);
    }
    if (exercise.type === "order" && new Set(exercise.items).size !== exercise.items.length) {
      throw new Error(`Order items not unique: ${exercise.id}`);
    }
    if (exercise.type === "match") {
      const lefts = exercise.pairs.map((pair) => pair.left);
      const rights = exercise.pairs.map((pair) => pair.right);
      if (new Set(lefts).size !== lefts.length || new Set(rights).size !== rights.length) {
        throw new Error(`Match pairs not unique: ${exercise.id}`);
      }
    }
  }
}

const byId = new Map<string, Exercise>();
for (const lesson of lessons) {
  for (const exercise of lesson.exercises) byId.set(exercise.id, exercise);
}

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id);
}

export function getUnitOf(lessonId: string) {
  return units.find((unit) => unit.lessons.some((lesson) => lesson.id === lessonId));
}

export function lessonIndex(id: string) {
  return lessons.findIndex((lesson) => lesson.id === id);
}

export type Credit = {
  crowns: Record<string, number>;
  placed?: Record<string, boolean>;
};

function credited(id: string, state: Credit) {
  return (state.crowns[id] ?? 0) > 0 || Boolean(state.placed?.[id]);
}

export function isUnlocked(id: string, state: Credit) {
  const index = lessonIndex(id);
  if (index < 0) return false;
  if (index === 0) return true;
  return credited(lessons[index - 1]!.id, state);
}

export function currentLessonId(state: Credit) {
  return (
    lessons.find((lesson) => !credited(lesson.id, state) && isUnlocked(lesson.id, state))?.id ?? null
  );
}

export function nextAfter(id: string) {
  const index = lessonIndex(id);
  if (index < 0 || index + 1 >= lessons.length) return null;
  return lessons[index + 1]!.id;
}

export function getExercise(id: string) {
  return byId.get(id);
}

export function exercisesByIds(ids: string[]) {
  return ids.flatMap((id) => {
    const exercise = byId.get(id);
    return exercise ? [exercise] : [];
  });
}

export function practicePool(state: Credit) {
  return lessons.filter((lesson) => isUnlocked(lesson.id, state)).flatMap((lesson) => lesson.exercises);
}

export function completedPool(state: Credit) {
  return lessons.filter((lesson) => credited(lesson.id, state)).flatMap((lesson) => lesson.exercises);
}

export function tally(state: Credit) {
  let cleared = 0;
  let crownSum = 0;
  let placed = 0;
  for (const lesson of lessons) {
    const crown = state.crowns[lesson.id] ?? 0;
    if (crown > 0 || state.placed?.[lesson.id]) cleared += 1;
    if (state.placed?.[lesson.id] && crown === 0) placed += 1;
    crownSum += crown;
  }
  return { cleared, crownSum, placed, total: lessons.length };
}
