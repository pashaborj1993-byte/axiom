import { useState, type FormEvent } from "react";

export function ReportProblem() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const { reportBug } = await import("@/lib/bugs.functions");
      await reportBug({ data: { message, page: window.location.pathname } });
      setMessage("");
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send that.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card mt-8 rounded-2xl px-4 py-4">
      <h2 className="font-serif text-xl">Report a problem</h2>
      <p className="mt-1 text-sm text-pretty text-muted">
        Tell us what broke. An owner reads it on the desk and fixes it in the project.
      </p>
      <label className="mt-3 block">
        <span className="text-sm font-semibold">What happened</span>
        <textarea
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setSent(false);
          }}
          required
          minLength={8}
          maxLength={2000}
          rows={4}
          className="mt-2 w-full rounded-xl bg-paper px-3 py-3 text-base"
        />
      </label>
      {error ? <p className="mt-2 text-sm text-copper">{error}</p> : null}
      {sent ? <p className="mt-2 text-sm text-pine">Sent. Thank you.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="press mt-3 h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
