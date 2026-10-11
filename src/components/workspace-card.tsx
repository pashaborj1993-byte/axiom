import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { formatInvite } from "@/lib/org-policy";
import type { WorkspaceView } from "@/lib/org-types";

type Phase =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; workspace: WorkspaceView }
  | { status: "error"; message: string };

export function WorkspaceCard() {
  const [phase, setPhase] = useState<Phase>({ status: "loading" });
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<"create" | "join" | "leave" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const { loadWorkspace } = await import("@/lib/org.functions");
        const workspace = await loadWorkspace();
        if (cancel) return;
        setPhase(workspace ? { status: "ready", workspace } : { status: "empty" });
      } catch (error) {
        if (!cancel) setPhase({ status: "error", message: note(error) });
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setPending("create");
    setMessage("");
    try {
      const { createOrganization } = await import("@/lib/org.functions");
      const workspace = await createOrganization({ data: { name } });
      setPhase({ status: "ready", workspace });
    } catch (error) {
      setMessage(note(error));
    } finally {
      setPending(null);
    }
  }

  async function join(event: FormEvent) {
    event.preventDefault();
    setPending("join");
    setMessage("");
    try {
      const { joinOrganization } = await import("@/lib/org.functions");
      const workspace = await joinOrganization({ data: { code } });
      setPhase({ status: "ready", workspace });
    } catch (error) {
      setMessage(note(error));
    } finally {
      setPending(null);
    }
  }

  async function leave() {
    if (!window.confirm("Leave this workspace? Your lessons stay on your account.")) return;
    setPending("leave");
    setMessage("");
    try {
      const { leaveOrganization } = await import("@/lib/org.functions");
      await leaveOrganization();
      setPhase({ status: "empty" });
    } catch (error) {
      setMessage(note(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="surface-card mt-6 rounded-2xl px-4 py-4">
      <h2 className="font-serif text-xl">Workspace</h2>
      {phase.status === "loading" ? <p className="mt-2 text-sm text-muted">Looking up your company…</p> : null}
      {phase.status === "error" ? <p className="mt-2 text-sm text-copper">{phase.message}</p> : null}
      {phase.status === "empty" ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-pretty text-muted">
            A workspace is how a company sees who is learning. Create one and share the invite, or join with a code.
          </p>
          <form onSubmit={create} className="space-y-2">
            <label className="block text-sm font-semibold" htmlFor="workspace-name">
              New workspace
            </label>
            <input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="Northwind learning"
              className="h-12 w-full rounded-xl bg-paper px-4 outline-none focus-visible:ring-2 focus-visible:ring-pine"
            />
            <button
              type="submit"
              disabled={pending !== null}
              className="press h-12 w-full rounded-xl bg-pine font-semibold text-paper disabled:opacity-60"
            >
              {pending === "create" ? "Creating…" : "Create workspace"}
            </button>
          </form>
          <form onSubmit={join} className="space-y-2">
            <label className="block text-sm font-semibold" htmlFor="workspace-code">
              Invite code
            </label>
            <input
              id="workspace-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABCD-EFGH"
              className="h-12 w-full rounded-xl bg-paper px-4 font-mono tracking-widest uppercase outline-none focus-visible:ring-2 focus-visible:ring-pine"
            />
            <button
              type="submit"
              disabled={pending !== null}
              className="press h-12 w-full rounded-xl bg-ink font-semibold text-paper disabled:opacity-60"
            >
              {pending === "join" ? "Joining…" : "Join"}
            </button>
          </form>
        </div>
      ) : null}
      {phase.status === "ready" ? (
        <div className="mt-3">
          <p className="font-semibold">{phase.workspace.name}</p>
          <p className="text-sm text-muted">
            {roleLabel(phase.workspace.role)} · {phase.workspace.memberCount}{" "}
            {phase.workspace.memberCount === 1 ? "person" : "people"}
          </p>
          {phase.workspace.inviteCode ? (
            <p className="mt-3 font-mono text-lg tracking-widest">{formatInvite(phase.workspace.inviteCode)}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">Ask an admin for the invite if someone else should join.</p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            {phase.workspace.role !== "learner" ? (
              <Link
                to="/admin"
                className="press flex h-12 items-center justify-center rounded-xl bg-pine font-semibold text-paper"
              >
                Open the desk
              </Link>
            ) : null}
            {phase.workspace.role !== "owner" ? (
              <button
                type="button"
                onClick={() => void leave()}
                disabled={pending !== null}
                className="press h-12 rounded-xl text-sm font-semibold text-copper disabled:opacity-60"
              >
                {pending === "leave" ? "Leaving…" : "Leave workspace"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-copper">{message}</p> : null}
    </section>
  );
}

function roleLabel(role: WorkspaceView["role"]) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Learner";
}

function note(error: unknown) {
  return error instanceof Error && error.message ? error.message : "That didn’t work. Try again.";
}
