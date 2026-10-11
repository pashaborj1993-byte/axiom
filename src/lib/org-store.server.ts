import { lessons, tally } from "@/data/curriculum";
import type { Sql } from "@/lib/db";
import {
  canManage,
  inviteCode,
  isOrgRole,
  keepsAnOwner,
  roleChangeAllowed,
  slugify,
} from "@/lib/org-policy";
import type { AuditRow, OrgRole, RosterPerson, WorkspaceReport, WorkspaceView } from "@/lib/org-types";

type Raw = Record<string, unknown>;

function asInt(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asTime(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
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

function crownsOf(value: unknown) {
  const parsed = readJson(value);
  const out: Record<string, number> = {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return out;
  for (const [key, raw] of Object.entries(parsed)) out[key] = asInt(raw);
  return out;
}

function placedOf(value: unknown) {
  const parsed = readJson(value);
  const out: Record<string, boolean> = {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return out;
  for (const [key, raw] of Object.entries(parsed)) if (raw === true) out[key] = true;
  return out;
}

function newInvite() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return inviteCode(bytes);
}

async function sqlOf() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

async function membership(sql: Sql, userId: string) {
  const rows = await sql<Raw>`
    select m.org_id, m.role, o.name, o.invite_code
    from org_members m
    join organizations o on o.id = m.org_id
    where m.user_id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row || !isOrgRole(row.role)) return null;
  return {
    orgId: asText(row.org_id),
    role: row.role,
    name: asText(row.name),
    inviteCode: asText(row.invite_code),
  };
}

async function memberCount(sql: Sql, orgId: string) {
  const rows = await sql<{ n: number }>`select count(*) as n from org_members where org_id = ${orgId}`;
  return asInt(rows[0]?.n);
}

function toView(row: { name: string; role: OrgRole; inviteCode: string }, count: number): WorkspaceView {
  return {
    name: row.name,
    role: row.role,
    inviteCode: canManage(row.role) ? row.inviteCode : null,
    memberCount: count,
  };
}

export async function writeAudit(
  sql: Sql,
  input: { orgId: string; actorId: string; action: string; detail: string },
) {
  await sql`
    insert into audit_events (id, org_id, actor_id, action, detail)
    values (
      ${crypto.randomUUID()},
      ${input.orgId},
      ${input.actorId},
      ${input.action},
      ${input.detail.slice(0, 240)}
    )
  `;
}

async function requireMember(userId: string) {
  const sql = await sqlOf();
  const row = await membership(sql, userId);
  if (!row) throw new Error("Join a workspace first");
  return { sql, row };
}

async function requireManager(userId: string) {
  const found = await requireMember(userId);
  if (!canManage(found.row.role)) throw new Error("Only an admin can open the desk");
  return found;
}

export async function loadWorkspaceFor(userId: string): Promise<WorkspaceView | null> {
  const sql = await sqlOf();
  const row = await membership(sql, userId);
  if (!row) return null;
  return toView(row, await memberCount(sql, row.orgId));
}

export async function createOrgFor(userId: string, data: string): Promise<WorkspaceView> {
  const sql = await sqlOf();
  if (await membership(sql, userId)) throw new Error("You already belong to a workspace");
    const id = crypto.randomUUID();
    let slug = slugify(data);
    for (let n = 2; n < 20; n++) {
      const taken = await sql<{ slug: string }>`select slug from organizations where slug = ${slug} limit 1`;
      if (taken.length === 0) break;
      slug = `${slugify(data).slice(0, 36)}-${n}`;
    }
    let code = newInvite();
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await sql`select id from organizations where invite_code = ${code} limit 1`;
      if (taken.length === 0) break;
      code = newInvite();
    }
    await sql`
      insert into organizations (id, name, slug, invite_code, created_by)
      values (${id}, ${data}, ${slug}, ${code}, ${userId})
    `;
    await sql`
      insert into org_members (org_id, user_id, role)
      values (${id}, ${userId}, 'owner')
    `;
    await writeAudit(sql, {
      orgId: id,
      actorId: userId,
      action: "org.created",
      detail: data,
    });
    return { name: data, role: "owner", inviteCode: code, memberCount: 1 };
}

export async function joinOrgFor(userId: string, data: string): Promise<WorkspaceView> {
  const sql = await sqlOf();
  if (await membership(sql, userId)) throw new Error("Leave your current workspace first");
    const orgs = await sql<Raw>`
      select id, name from organizations where invite_code = ${data} limit 1
    `;
    const org = orgs[0];
    if (!org) throw new Error("That invite code is not active");
    const orgId = asText(org.id);
    await sql`
      insert into org_members (org_id, user_id, role)
      values (${orgId}, ${userId}, 'learner')
    `;
    await writeAudit(sql, {
      orgId,
      actorId: userId,
      action: "member.joined",
      detail: "Joined as learner",
    });
    return {
      name: asText(org.name),
      role: "learner",
      inviteCode: null,
      memberCount: await memberCount(sql, orgId),
    };
}

export async function leaveOrgFor(userId: string) {
  const { sql, row } = await requireMember(userId);
  if (row.role === "owner") throw new Error("An owner stays until another owner is named");
  await sql`delete from org_members where org_id = ${row.orgId} and user_id = ${userId}`;
  await writeAudit(sql, {
    orgId: row.orgId,
    actorId: userId,
    action: "member.left",
    detail: "Left the workspace",
  });
  return { ok: true as const };
}

export async function setRoleFor(userId: string, data: { userId: string; role: OrgRole }) {
  const { sql, row } = await requireManager(userId);
    const targets = await sql<Raw>`
      select role from org_members where org_id = ${row.orgId} and user_id = ${data.userId} limit 1
    `;
    const targetRole = targets[0]?.role;
    if (!isOrgRole(targetRole)) throw new Error("That person is not in this workspace");
    if (!roleChangeAllowed(row.role, userId, data.userId, targetRole, data.role)) {
      throw new Error("You cannot make that change");
    }
    const owners = await sql<{ n: number }>`
      select count(*) as n from org_members where org_id = ${row.orgId} and role = 'owner'
    `;
    if (!keepsAnOwner(asInt(owners[0]?.n), targetRole, data.role)) {
      throw new Error("Name another owner first");
    }
    await sql`
      update org_members set role = ${data.role}
      where org_id = ${row.orgId} and user_id = ${data.userId}
    `;
    await writeAudit(sql, {
      orgId: row.orgId,
      actorId: userId,
      action: "member.role",
      detail: `Role set to ${data.role}`,
    });
    return { ok: true as const };
}

export async function rotateInviteFor(userId: string) {
  const { sql, row } = await requireMember(userId);
    if (row.role !== "owner") throw new Error("Only an owner can rotate the invite");
    const code = newInvite();
    await sql`update organizations set invite_code = ${code} where id = ${row.orgId}`;
    await writeAudit(sql, {
      orgId: row.orgId,
      actorId: userId,
      action: "invite.rotated",
      detail: "Invite code replaced",
    });
    return { inviteCode: code };
}

function personFrom(row: Raw): RosterPerson {
  const hasProfile = row.level !== null && row.level !== undefined;
  const stats = tally({ crowns: crownsOf(row.crowns), placed: placedOf(row.placed) });
  const track = asText(row.level);
  return {
    userId: asText(row.user_id),
    name: asText(row.display_name) || asText(row.account_name) || "Learner",
    email: asText(row.email),
    role: isOrgRole(row.role) ? row.role : "learner",
    track: track || "unplaced",
    lessonsCleared: hasProfile ? stats.cleared : 0,
    lessonsTotal: lessons.length,
    xp: asInt(row.xp),
    streak: asInt(row.streak),
    lastPractice: asText(row.last_practice_date) || null,
  };
}

function daysAgo(n: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - n);
  return date.toISOString().slice(0, 10);
}

export async function recordPlacement(userId: string, detail: string) {
  const sql = await sqlOf();
  const row = await membership(sql, userId);
  if (!row) return;
  await writeAudit(sql, {
    orgId: row.orgId,
    actorId: userId,
    action: "placement.finished",
    detail,
  });
}

export async function loadDeskFor(userId: string): Promise<{
  workspace: WorkspaceView;
  report: WorkspaceReport;
  people: RosterPerson[];
  audit: AuditRow[];
}> {
  const { sql, row } = await requireManager(userId);
    const peopleRows = await sql<Raw>`
      select
        m.user_id, m.role, u.email, u.name as account_name,
        p.display_name, p.level, p.xp, p.streak, p.last_practice_date, p.crowns, p.placed
      from org_members m
      left join "user" u on u.id = m.user_id
      left join learner_profiles p on p.user_id = m.user_id
      where m.org_id = ${row.orgId}
      order by m.joined_at asc
    `;
    const people = peopleRows.map(personFrom);
    const week = daysAgo(7);
    const tracks = { beginner: 0, intermediate: 0, advanced: 0, unplaced: 0 };
    let cleared = 0;
    let activeWeek = 0;
    let owners = 0;
    let admins = 0;
    let learners = 0;
    for (const person of people) {
      cleared += person.lessonsCleared;
      if (person.role === "owner") owners += 1;
      else if (person.role === "admin") admins += 1;
      else learners += 1;
      if (person.track === "beginner" || person.track === "intermediate" || person.track === "advanced") {
        tracks[person.track] += 1;
      } else tracks.unplaced += 1;
      if (person.lastPractice && person.lastPractice >= week) activeWeek += 1;
    }
    const auditRows = await sql<Raw>`
      select e.id, e.action, e.detail, e.created_at, u.name as actor_name, p.display_name
      from audit_events e
      left join "user" u on u.id = e.actor_id
      left join learner_profiles p on p.user_id = e.actor_id
      where e.org_id = ${row.orgId}
      order by e.created_at desc
      limit 40
    `;
    return {
      workspace: toView(row, people.length),
      report: {
        people: people.length,
        owners,
        admins,
        learners,
        tracks,
        averageCleared: people.length === 0 ? 0 : Math.round(cleared / people.length),
        activeWeek,
      },
      people,
      audit: auditRows.map((item) => ({
        id: asText(item.id),
        action: asText(item.action),
        detail: asText(item.detail),
        actor: asText(item.display_name) || asText(item.actor_name) || "Member",
        at: asTime(item.created_at),
      })),
    };
}
