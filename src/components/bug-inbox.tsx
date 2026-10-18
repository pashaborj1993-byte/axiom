import { useEffect, useState } from "react";

type BugReport = {
  id: string;
  email: string;
  page: string;
  message: string;
  status: "open" | "fixed";
  at: string;
};

export function BugInbox() {
  const [bugs, setBugs] = useState<BugReport[] | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const { loadBugs } = await import("@/lib/bugs.functions");
        const rows = await loadBugs();
        if (!cancel) setBugs(rows);
      } catch (caught) {
        if (!cancel) setError(caught instanceof Error ? caught.message : "Reports did not load.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function mark(id: string, status: "open" | "fixed") {
    setPending(id);
    setError("");
    try {
      const { markBug } = await import("@/lib/bugs.functions");
      await markBug({ data: { id, status } });
      const { loadBugs } = await import("@/lib/bugs.functions");
      setBugs(await loadBugs());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update that report.");
    } finally {
      setPending("");
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl">Problems</h2>
      <p className="mt-1 text-sm text-muted">
        Reports from the You tab. Mark one fixed after the change is on the live site.
      </p>
      {error ? <p className="mt-3 text-sm text-copper">{error}</p> : null}
      {bugs && bugs.length === 0 ? <p className="mt-3 text-sm text-muted">No reports yet.</p> : null}
      <ul className="mt-3 space-y-3">
        {(bugs ?? []).map((bug) => (
          <li key={bug.id} className="surface-card rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold">
              {bug.status === "fixed" ? "Fixed" : "Open"} · {bug.email || "No email"}
            </p>
            <p className="mt-1 text-sm text-pretty">{bug.message}</p>
            <p className="mt-1 text-xs text-muted">
              {bug.page || "unknown page"} · {bug.at.slice(0, 16).replace("T", " ")}
            </p>
            <button
              type="button"
              disabled={pending === bug.id}
              onClick={() => void mark(bug.id, bug.status === "open" ? "fixed" : "open")}
              className="press mt-3 h-10 rounded-xl bg-ink px-3 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {bug.status === "open" ? "Mark fixed" : "Reopen"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
