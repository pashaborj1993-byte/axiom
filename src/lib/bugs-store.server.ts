import { getSql } from "@/lib/db";
import { canManage, isOrgRole } from "@/lib/org-policy";

export type BugReport = {
  id: string;
  email: string;
  page: string;
  message: string;
  status: "open" | "fixed";
  at: string;
};

async function requireManager(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`select role from org_members where user_id = ${userId} limit 1`;
  const role = rows[0]?.role;
  if (!isOrgRole(role) || !canManage(role)) {
    throw new Error("Only an owner or admin can read reports");
  }
  return sql;
}

export async function fileBug(userId: string, message: string, page: string): Promise<{ id: string }> {
  const sql = await getSql();
  const people = await sql<{ email: string }>`select email from "user" where id = ${userId} limit 1`;
  const id = crypto.randomUUID();
  await sql`
    insert into bug_reports (id, user_id, email, page, message)
    values (${id}, ${userId}, ${people[0]?.email ?? ""}, ${page}, ${message})
  `;
  return { id };
}

export async function listBugs(userId: string): Promise<BugReport[]> {
  const sql = await requireManager(userId);
  const rows = await sql<{
    id: string;
    email: string;
    page: string;
    message: string;
    status: string;
    created_at: string | Date;
  }>`
    select id, email, page, message, status, created_at
    from bug_reports
    order by created_at desc
    limit 100
  `;
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    page: row.page,
    message: row.message,
    status: row.status === "fixed" ? "fixed" : "open",
    at: new Date(row.created_at).toISOString(),
  }));
}

export async function setBugStatus(userId: string, id: string, status: "open" | "fixed") {
  const sql = await requireManager(userId);
  await sql`update bug_reports set status = ${status} where id = ${id}`;
  return { ok: true };
}
