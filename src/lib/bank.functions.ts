import { createServerFn } from "@tanstack/react-start";
import { getLesson } from "@/data/curriculum";
import { authMiddleware } from "@/lib/auth/middleware";
import { canManage } from "@/lib/org-policy";
import type { NoteInput } from "@/lib/bank-types";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function httpsUrl(value: unknown) {
  const url = text(value, 300);
  if (!/^https:\/\/[^\s]+$/i.test(url)) throw new Error("Use an https source link");
  return url;
}

function dateKey(value: unknown) {
  const date = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Use a YYYY-MM-DD date");
  return date;
}

async function requireManager(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    select role from org_members where user_id = ${userId} limit 1
  `;
  const role = rows[0]?.role;
  if (role !== "owner" && role !== "admin") throw new Error("Only a workspace admin can edit the bank");
  if (!canManage(role)) throw new Error("Only a workspace admin can edit the bank");
  return role;
}

export const loadLessonBank = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = text(input, 80);
    if (!getLesson(id)) throw new Error("Unknown lesson");
    return id;
  })
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const { exercisesForLesson } = await import("./bank-store.server");
    return exercisesForLesson(data);
  });

export const loadNotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { listNotes } = await import("./bank-store.server");
    return listNotes(false);
  });

export const loadAds = createServerFn({ method: "POST" })
  .validator((input: unknown) => (input === "lesson_end" ? "lesson_end" : "hearts") as "hearts" | "lesson_end")
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const { listAds } = await import("./bank-store.server");
    return listAds(data);
  });

export const collectAd = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = text(input, 40);
    if (!id) throw new Error("Missing ad");
    return id;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { claimAdFor } = await import("./bank-store.server");
    return claimAdFor(context.userId, data);
  });

export const loadBankDesk = createServerFn({ method: "POST" })
  .validator((input: unknown) => text(input, 80))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireManager(context.userId);
    const store = await import("./bank-store.server");
    const lessonId = getLesson(data) ? data : "foundations-meaning";
    const [questions, notes, ads, counts] = await Promise.all([
      store.questionsForLesson(lessonId),
      store.listNotes(true),
      store.listAds(),
      store.pulse(),
    ]);
    return { lessonId, questions, notes, ads, counts };
  });

function cleanNote(input: unknown): NoteInput {
  if (!input || typeof input !== "object") throw new Error("Write the note");
  const raw = input as Record<string, unknown>;
  const title = text(raw.title, 80);
  const summary = text(raw.summary, 400);
  const sourceName = text(raw.sourceName, 40);
  if (title.length < 4 || summary.length < 12 || sourceName.length < 2) {
    throw new Error("A note needs a title, a summary, and a source name");
  }
  return {
    id: text(raw.id, 40) || undefined,
    title,
    summary,
    sourceName,
    sourceUrl: httpsUrl(raw.sourceUrl),
    publishedOn: dateKey(raw.publishedOn),
  };
}

export const publishNote = createServerFn({ method: "POST" })
  .validator(cleanNote)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireManager(context.userId);
    const { saveNote } = await import("./bank-store.server");
    return saveNote(data);
  });

export const retireNote = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Missing note");
    const raw = input as { id?: unknown; active?: unknown };
    const id = text(raw.id, 40);
    if (!id) throw new Error("Missing note");
    return { id, active: raw.active === true };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireManager(context.userId);
    const { setNoteActive } = await import("./bank-store.server");
    return setNoteActive(data.id, data.active);
  });

export const editQuestion = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Missing question");
    const raw = input as Record<string, unknown>;
    const id = text(raw.id, 80);
    const prompt = text(raw.prompt, 280);
    const explain = text(raw.explain, 280);
    if (!id || prompt.length < 8 || explain.length < 4) throw new Error("Prompt and explanation are required");
    return { id, prompt, explain, active: raw.active !== false };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireManager(context.userId);
    const { updateQuestion } = await import("./bank-store.server");
    return updateQuestion(data);
  });

export const addBankChoice = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Missing question");
    const raw = input as Record<string, unknown>;
    const lessonId = text(raw.lessonId, 80);
    if (!getLesson(lessonId)) throw new Error("Unknown lesson");
    const prompt = text(raw.prompt, 280);
    const explain = text(raw.explain, 280);
    const options = Array.isArray(raw.options)
      ? raw.options.map((item) => text(item, 120)).filter(Boolean).slice(0, 4)
      : [];
    const answer = text(raw.answer, 120);
    if (prompt.length < 8 || explain.length < 4 || options.length < 2 || !options.includes(answer)) {
      throw new Error("Need a prompt, two options, the correct one, and an explanation");
    }
    return { lessonId, prompt, options, answer, explain };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireManager(context.userId);
    const { addChoice } = await import("./bank-store.server");
    return addChoice(data);
  });

export const editAd = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Missing ad");
    const raw = input as Record<string, unknown>;
    const title = text(raw.title, 60);
    const body = text(raw.body, 240);
    if (title.length < 3 || body.length < 8) throw new Error("An ad needs a title and a line of copy");
    const placement = raw.placement === "lesson_end" ? "lesson_end" : "hearts";
    const n = (value: unknown, max: number) => {
      const parsed = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(parsed)) return 0;
      return Math.max(0, Math.min(max, Math.trunc(parsed)));
    };
    return {
      id: text(raw.id, 40),
      title,
      body,
      placement: placement as "hearts" | "lesson_end",
      rewardHearts: n(raw.rewardHearts, 5),
      rewardGems: n(raw.rewardGems, 50),
      rewardXp: n(raw.rewardXp, 100),
      active: raw.active !== false,
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireManager(context.userId);
    const { saveAd } = await import("./bank-store.server");
    return saveAd(data);
  });

export const pauseAd = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Missing ad");
    const raw = input as { id?: unknown; active?: unknown };
    const id = text(raw.id, 40);
    if (!id) throw new Error("Missing ad");
    return { id, active: raw.active === true };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireManager(context.userId);
    const { setAdActive } = await import("./bank-store.server");
    return setAdActive(data.id, data.active);
  });
