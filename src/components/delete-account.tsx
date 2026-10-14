import { useState, type FormEvent } from "react";
import { getBearerToken } from "@/lib/auth/client";

export function DeleteAccount() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const headers = new Headers({ "content-type": "application/json" });
      const token = getBearerToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const response = await fetch("/api/auth/delete-user", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("That password did not delete the account.");
        return;
      }
      try {
        window.sessionStorage.removeItem("grok-auth.bearer-token");
      } catch {
        /* ignore */
      }
      window.location.assign("/login");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card mt-8 rounded-2xl px-4 py-4">
      <h2 className="font-serif text-xl">Delete account</h2>
      <p className="mt-1 text-sm text-pretty text-muted">
        Removes your login and your learning record. The App Store and Play Store require this. It cannot be undone.
      </p>
      <label className="mt-3 block">
        <span className="text-sm font-semibold">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="mt-2 h-12 w-full rounded-xl bg-paper px-3"
        />
      </label>
      {error ? <p className="mt-2 text-sm text-copper">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="press mt-3 h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete this account"}
      </button>
    </form>
  );
}
