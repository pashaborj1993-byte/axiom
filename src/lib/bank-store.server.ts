import { lessons } from "@/data/curriculum";
import type { Exercise } from "@/data/types";
import type { Sql } from "@/lib/db";
import type { AdReward, BankQuestion, FieldNote, HouseAd, NoteInput } from "@/lib/bank-types";

type Raw = Record<string, unknown>;

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asInt(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function asBool(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "t" || value === "true" || value === 1) return true;
  return false;
}

async function sqlOf() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

function rowOf(exercise: Exercise, lessonId: string, position: number) {
  if (exercise.type === "choice") {
    return {
      kind: "choice",
      payload: JSON.stringify({ options: exercise.options }),
      answer: exercise.answer,
    };
  }
  if (exercise.type === "truefalse") {
    return { kind: "truefalse", payload: "{}", answer: exercise.answer ? "true" : "false" };
  }
  if (exercise.type === "fill") {
    return {
      kind: "fill",
      payload: JSON.stringify({ accept: exercise.accept ?? [] }),
      answer: exercise.answer,
    };
  }
  if (exercise.type === "match") {
    return { kind: "match", payload: JSON.stringify({ pairs: exercise.pairs }), answer: "" };
  }
  return { kind: "order", payload: JSON.stringify({ items: exercise.items }), answer: "" };
}

let seeded: Promise<void> | null = null;

export function ensureBank(sql: Sql) {
  seeded ??= (async () => {
    for (const lesson of lessons) {
      for (let index = 0; index < lesson.exercises.length; index++) {
        const exercise = lesson.exercises[index]!;
        const row = rowOf(exercise, lesson.id, index);
        await sql`
          insert into question_bank (id, lesson_id, position, kind, prompt, payload, answer, explain, active)
          values (
            ${exercise.id},
            ${lesson.id},
            ${index},
            ${row.kind},
            ${exercise.prompt},
            ${row.payload},
            ${row.answer},
            ${exercise.explain},
            true
          )
          on conflict (id) do nothing
        `;
      }
    }
  })().catch((error) => {
    seeded = null;
    throw error;
  });
  return seeded;
}

function readPayload(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  if (value && typeof value === "object") return value;
  return {};
}

function toExercise(row: Raw): Exercise | null {
  const id = asText(row.id);
  const prompt = asText(row.prompt);
  const explain = asText(row.explain);
  const payload = readPayload(row.payload) as Record<string, unknown>;
  const kind = asText(row.kind);
  if (!id || !prompt || !explain) return null;
  if (kind === "choice" && Array.isArray(payload.options)) {
    const options = payload.options.filter((item): item is string => typeof item === "string");
    const answer = asText(row.answer);
    if (options.length < 2 || !options.includes(answer)) return null;
    return { id, type: "choice", prompt, options, answer, explain };
  }
  if (kind === "truefalse") {
    return { id, type: "truefalse", prompt, answer: asText(row.answer) === "true", explain };
  }
  if (kind === "fill") {
    const accept = Array.isArray(payload.accept)
      ? payload.accept.filter((item): item is string => typeof item === "string")
      : [];
    const answer = asText(row.answer);
    if (!answer) return null;
    return { id, type: "fill", prompt, answer, accept, explain };
  }
  if (kind === "match" && Array.isArray(payload.pairs)) {
    const pairs = payload.pairs.filter(
      (item): item is { left: string; right: string } =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as { left?: unknown }).left === "string" &&
        typeof (item as { right?: unknown }).right === "string",
    );
    if (pairs.length < 2) return null;
    return { id, type: "match", prompt, pairs, explain };
  }
  if (kind === "order" && Array.isArray(payload.items)) {
    const items = payload.items.filter((item): item is string => typeof item === "string");
    if (items.length < 2) return null;
    return { id, type: "order", prompt, items, explain };
  }
  return null;
}

export async function exercisesForLesson(lessonId: string): Promise<Exercise[]> {
  const sql = await sqlOf();
  await ensureBank(sql);
  const rows = await sql<Raw>`
    select * from question_bank
    where lesson_id = ${lessonId} and active = true
    order by position asc, id asc
  `;
  return rows.map(toExercise).filter((item): item is Exercise => item !== null);
}

export async function questionsForLesson(lessonId: string): Promise<BankQuestion[]> {
  const sql = await sqlOf();
  await ensureBank(sql);
  const rows = await sql<Raw>`
    select id, lesson_id, kind, prompt, explain, active
    from question_bank
    where lesson_id = ${lessonId}
    order by position asc, id asc
  `;
  return rows.map((row) => ({
    id: asText(row.id),
    lessonId: asText(row.lesson_id),
    kind: asText(row.kind),
    prompt: asText(row.prompt),
    explain: asText(row.explain),
    active: asBool(row.active),
  }));
}

export async function updateQuestion(input: { id: string; prompt: string; explain: string; active: boolean }) {
  const sql = await sqlOf();
  await sql`
    update question_bank set
      prompt = ${input.prompt},
      explain = ${input.explain},
      active = ${input.active},
      updated_at = now()
    where id = ${input.id}
  `;
  return { ok: true as const };
}

export async function addChoice(input: {
  lessonId: string;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}) {
  const sql = await sqlOf();
  const positions = await sql<{ n: number }>`
    select coalesce(max(position), -1) + 1 as n from question_bank where lesson_id = ${input.lessonId}
  `;
  const id = `bank-${crypto.randomUUID().slice(0, 8)}`;
  await sql`
    insert into question_bank (id, lesson_id, position, kind, prompt, payload, answer, explain, active)
    values (
      ${id},
      ${input.lessonId},
      ${asInt(positions[0]?.n)},
      'choice',
      ${input.prompt},
      ${JSON.stringify({ options: input.options })},
      ${input.answer},
      ${input.explain},
      true
    )
  `;
  return { id };
}

function noteFrom(row: Raw): FieldNote {
  return {
    id: asText(row.id),
    title: asText(row.title),
    summary: asText(row.summary),
    sourceName: asText(row.source_name),
    sourceUrl: asText(row.source_url),
    publishedOn: asText(row.published_on),
  };
}

export async function listNotes(includeHidden: boolean): Promise<FieldNote[]> {
  const sql = await sqlOf();
  const rows = includeHidden
    ? await sql<Raw>`select * from field_notes order by published_on desc, updated_at desc limit 40`
    : await sql<Raw>`
        select * from field_notes where active = true
        order by published_on desc, updated_at desc limit 8
      `;
  return rows.map(noteFrom);
}

export async function saveNote(input: NoteInput) {
  const sql = await sqlOf();
  const id = input.id?.trim() || `note-${crypto.randomUUID().slice(0, 8)}`;
  await sql`
    insert into field_notes (id, title, summary, source_name, source_url, published_on, active)
    values (
      ${id}, ${input.title}, ${input.summary}, ${input.sourceName}, ${input.sourceUrl}, ${input.publishedOn}, true
    )
    on conflict (id) do update set
      title = excluded.title,
      summary = excluded.summary,
      source_name = excluded.source_name,
      source_url = excluded.source_url,
      published_on = excluded.published_on,
      active = true,
      updated_at = now()
  `;
  return { id };
}

export async function setNoteActive(id: string, active: boolean) {
  const sql = await sqlOf();
  await sql`update field_notes set active = ${active}, updated_at = now() where id = ${id}`;
  return { ok: true as const };
}

function adFrom(row: Raw): HouseAd {
  const placement = asText(row.placement) === "lesson_end" ? "lesson_end" : "hearts";
  return {
    id: asText(row.id),
    title: asText(row.title),
    body: asText(row.body),
    placement,
    rewardHearts: asInt(row.reward_hearts),
    rewardGems: asInt(row.reward_gems),
    rewardXp: asInt(row.reward_xp),
    active: asBool(row.active),
  };
}

export async function listAds(placement?: "hearts" | "lesson_end"): Promise<HouseAd[]> {
  const sql = await sqlOf();
  const rows = placement
    ? await sql<Raw>`
        select * from house_ads where active = true and placement = ${placement} order by created_at asc
      `
    : await sql<Raw>`select * from house_ads order by created_at asc`;
  return rows.map(adFrom);
}

export async function saveAd(input: Omit<HouseAd, "active"> & { active?: boolean }) {
  const sql = await sqlOf();
  const id = input.id.trim() || `ad-${crypto.randomUUID().slice(0, 8)}`;
  await sql`
    insert into house_ads (id, title, body, placement, reward_hearts, reward_gems, reward_xp, active)
    values (
      ${id},
      ${input.title},
      ${input.body},
      ${input.placement},
      ${input.rewardHearts},
      ${input.rewardGems},
      ${input.rewardXp},
      ${input.active !== false}
    )
    on conflict (id) do update set
      title = excluded.title,
      body = excluded.body,
      placement = excluded.placement,
      reward_hearts = excluded.reward_hearts,
      reward_gems = excluded.reward_gems,
      reward_xp = excluded.reward_xp,
      active = excluded.active
  `;
  return { id };
}

export async function setAdActive(id: string, active: boolean) {
  const sql = await sqlOf();
  await sql`update house_ads set active = ${active} where id = ${id}`;
  return { ok: true as const };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function claimAdFor(userId: string, adId: string): Promise<AdReward> {
  const sql = await sqlOf();
  const ads = await sql<Raw>`select * from house_ads where id = ${adId} and active = true limit 1`;
  const ad = ads[0];
  if (!ad) throw new Error("That ad is not running");
  const today = todayKey();
  const claimed = await sql`
    select user_id from ad_claims where user_id = ${userId} and ad_id = ${adId} and claimed_on = ${today} limit 1
  `;
  if (claimed.length > 0) throw new Error("Already collected today");
  const profiles = await sql<Raw>`select * from learner_profiles where user_id = ${userId} limit 1`;
  const profile = profiles[0];
  if (!profile) throw new Error("Finish placement first");
  const gainedHearts = Math.min(5, asInt(ad.reward_hearts));
  const gainedGems = Math.min(100, asInt(ad.reward_gems));
  const gainedXp = Math.min(200, asInt(ad.reward_xp));
  const hearts = Math.min(5, asInt(profile.hearts) + gainedHearts);
  const gems = asInt(profile.gems) + gainedGems;
  const xp = asInt(profile.xp) + gainedXp;
  const storedDay = asText(profile.today_date);
  const todayXp = (storedDay === today ? asInt(profile.today_xp) : 0) + gainedXp;
  await sql`
    update learner_profiles set
      hearts = ${hearts},
      gems = ${gems},
      xp = ${xp},
      today_xp = ${todayXp},
      today_date = ${today},
      updated_at = now()
    where user_id = ${userId}
  `;
  await sql`
    insert into ad_claims (user_id, ad_id, claimed_on) values (${userId}, ${adId}, ${today})
  `;
  return { hearts, gems, xp, todayXp, todayDate: today, gainedHearts, gainedGems, gainedXp };
}

export async function pulse() {
  const sql = await sqlOf();
  await ensureBank(sql);
  const accounts = await sql<{ n: number }>`select count(*) as n from "user"`;
  const questions = await sql<{ n: number }>`select count(*) as n from question_bank`;
  const notes = await sql<{ n: number }>`select count(*) as n from field_notes where active = true`;
  return {
    accounts: asInt(accounts[0]?.n),
    questions: asInt(questions[0]?.n),
    notes: asInt(notes[0]?.n),
  };
}
