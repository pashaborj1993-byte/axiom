import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BankDesk } from "@/components/bank-desk";
import { BugInbox } from "@/components/bug-inbox";
import { LearnerGate } from "@/components/learner-gate";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { formatInvite } from "@/lib/org-policy";
import type { AuditRow, OrgRole, RosterPerson, WorkspaceReport, WorkspaceView } from "@/lib/org-types";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

const ACTIONS: Record<string, string> = {
  "org.created": "Workspace created",
  "member.joined": "Joined",
  "member.left": "Left",
  "member.role": "Role changed",
  "invite.rotated": "Invite replaced",
  "placement.finished": "Placement finished",
};

function Admin() {
  return (
    <LearnerGate>
      <Desk />
    </LearnerGate>
  );
}

function Desk() {
  const user = useCurrentUser();
  const [workspace, setWorkspace] = useState<WorkspaceView | null>(null);
  const [report, setReport] = useState<WorkspaceReport | null>(null);
  const [people, setPeople] = useState<RosterPerson[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function reload() {
    const { loadDesk } = await import("@/lib/org.functions");
    const desk = await loadDesk();
    setWorkspace(desk.workspace);
    setReport(desk.report);
    setPeople(desk.people);
    setAudit(desk.audit);
  }

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const { loadDesk } = await import("@/lib/org.functions");
        const desk = await loadDesk();
        if (cancel) return;
        setWorkspace(desk.workspace);
        setReport(desk.report);
        setPeople(desk.people);
        setAudit(desk.audit);
      } catch (caught) {
        if (!cancel) setError(caught instanceof Error ? caught.message : "The desk didn’t load.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function rotate() {
    if (!window.confirm("Replace the invite code? The old one stops working.")) return;
    setPending("invite");
    setError("");
    try {
      const { rotateInvite } = await import("@/lib/org.functions");
      const next = await rotateInvite();
      setWorkspace((current) => (current ? { ...current, inviteCode: next.inviteCode } : current));
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not replace the invite.");
    } finally {
      setPending("");
    }
  }

  async function changeRole(userId: string, role: OrgRole) {
    setPending(userId);
    setError("");
    try {
      const { setMemberRole } = await import("@/lib/org.functions");
      await setMemberRole({ data: { userId, role } });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not change that role.");
    } finally {
      setPending("");
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 pt-6 pb-16">
      <Link to="/" search={{ tab: "path" }} className="text-sm font-semibold text-pine">
        Back to the path
      </Link>
      <h1 className="mt-3 font-serif text-4xl">{workspace?.name ?? "Workspace desk"}</h1>
      <p className="mt-2 max-w-xl text-sm text-pretty text-muted">
        Who is in the company, how far they have walked, and a record of joins, roles, and placements.
      </p>
      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      {!workspace && !error ? <p className="mt-6 text-sm text-muted">Opening the desk…</p> : null}

      {workspace && report ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="People" value={String(report.people)} />
            <Stat label="Active 7 days" value={String(report.activeWeek)} />
            <Stat label="Avg lessons" value={String(report.averageCleared)} />
            <Stat label="Learners" value={String(report.learners)} />
          </dl>
          <p className="mt-3 text-sm text-muted">
            Tracks: {report.tracks.beginner} beginner, {report.tracks.intermediate} intermediate,{" "}
            {report.tracks.advanced} advanced
            {report.tracks.unplaced ? `, ${report.tracks.unplaced} not placed` : ""}. {report.owners} owner
            {report.owners === 1 ? "" : "s"}, {report.admins} admin{report.admins === 1 ? "" : "s"}.
          </p>

          {workspace.inviteCode ? (
            <section className="surface-card mt-6 rounded-2xl px-4 py-4">
              <h2 className="font-serif text-xl">Invite</h2>
              <p className="mt-1 font-mono text-2xl tracking-widest">{formatInvite(workspace.inviteCode)}</p>
              <p className="mt-1 text-sm text-muted">Share this with people who should join as learners.</p>
              {workspace.role === "owner" ? (
                <button
                  type="button"
                  onClick={() => void rotate()}
                  disabled={pending === "invite"}
                  className="press mt-3 h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-60"
                >
                  {pending === "invite" ? "Replacing…" : "Replace code"}
                </button>
              ) : null}
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="font-serif text-2xl">People</h2>
            <ul className="mt-3 space-y-3">
              {people.map((person) => (
                <li key={person.userId} className="surface-card rounded-2xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{person.name}</p>
                      <p className="truncate text-sm text-muted">{person.email || "No email"}</p>
                    </div>
                    <RoleSelect
                      person={person}
                      self={person.userId === user?.id}
                      actor={workspace.role}
                      pending={pending === person.userId}
                      onChange={(role) => void changeRole(person.userId, role)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {person.track === "unplaced" ? "Not placed yet" : person.track} · {person.lessonsCleared}/
                    {person.lessonsTotal} lessons · {person.xp} XP · {person.streak} day streak
                    {person.lastPractice ? ` · last ${person.lastPractice}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-2xl">Record</h2>
            {audit.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing has been recorded yet.</p> : null}
            <ol className="mt-3 space-y-2">
              {audit.map((item) => (
                <li key={item.id} className="surface-card rounded-xl px-4 py-3 text-sm">
                  <p className="font-semibold">{ACTIONS[item.action] ?? item.action}</p>
                  <p className="text-muted">
                    {item.actor}
                    {item.detail ? ` · ${item.detail}` : ""} · {when(item.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          {workspace.role === "owner" || workspace.role === "admin" ? <BugInbox /> : null}
          <BankDesk />
        </>
      ) : null}
    </main>
  );
}

function RoleSelect({
  person,
  self,
  actor,
  pending,
  onChange,
}: {
  person: RosterPerson;
  self: boolean;
  actor: OrgRole;
  pending: boolean;
  onChange: (role: OrgRole) => void;
}) {
  const locked = self || (actor === "admin" && person.role === "owner");
  if (locked) {
    const label = person.role === "owner" ? "Owner" : person.role === "admin" ? "Admin" : "Learner";
    return <span className="text-sm font-semibold">{label}</span>;
  }
  return (
    <label className="shrink-0 text-sm">
      <span className="sr-only">Role for {person.name}</span>
      <select
        value={person.role}
        disabled={pending}
        onChange={(event) => {
          const role = event.target.value;
          if (role === "owner" || role === "admin" || role === "learner") onChange(role);
        }}
        className="h-10 rounded-lg bg-paper px-2 font-semibold"
      >
        {actor === "owner" ? <option value="owner">Owner</option> : null}
        <option value="admin">Admin</option>
        <option value="learner">Learner</option>
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-2xl px-4 py-3">
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
    </div>
  );
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
