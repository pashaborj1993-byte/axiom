import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mark } from "@/components/mark";
import { Quill } from "@/components/quill";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/login")({
  component: Login,
});

const BEARER_KEY = "grok-auth.bearer-token";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"create" | "enter">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const emailValue = String(data.get("email") ?? "").trim();
    const passwordValue = String(data.get("password") ?? "");
    const nameValue = String(data.get("name") ?? "").trim();
    setError("");
    if (!emailValue.includes("@") || passwordValue.length < 8) {
      setError("Use a real email and a password of at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const path = mode === "create" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
      const response = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "create"
            ? { email: emailValue, password: passwordValue, name: nameValue || emailValue.split("@")[0] }
            : { email: emailValue, password: passwordValue },
        ),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string; token?: string } | null;
      if (!response.ok) {
        setError(payload?.message || (mode === "create" ? "Could not create the account." : "Could not sign in."));
        setPending(false);
        return;
      }
      const headerToken = response.headers.get("set-auth-token");
      const token = headerToken || payload?.token || "";
      if (token) {
        try {
          window.sessionStorage.setItem(BEARER_KEY, token);
        } catch {
          /* ignore */
        }
      }
      await authClient.getSession();
      void navigate({ to: "/", search: { tab: "path" } });
    } catch {
      setError("Could not reach sign-in. Try again.");
      setPending(false);
    }
  }

  return (
    <main className="phone-screen mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
      <div className="my-auto">
        <div className="flex items-end gap-4">
          <Quill mood="greet" className="h-28 shrink-0" label="Quill" />
          <div className="min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <Mark className="size-7" />
              <p className="text-xs font-semibold tracking-widest text-pine uppercase">Axiom</p>
            </div>
            <h1 className="mt-2 font-serif text-3xl leading-tight">
              {mode === "create" ? "Create your account" : "Welcome back"}
            </h1>
          </div>
        </div>
        <p className="mt-3 text-pretty text-muted">
          Your placement, streak, and path are saved to this account, so they follow you to another device.
        </p>
        {authEnabled ? (
          <>
            <form onSubmit={onSubmit} className="mt-8 grid gap-3">
              {mode === "create" ? (
                <label className="block">
                  <span className="text-sm font-semibold">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={24}
                    name="name"
                    autoComplete="name"
                    className="surface-card mt-2 h-12 w-full rounded-xl px-4 outline-none focus-visible:ring-2 focus-visible:ring-pine"
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="text-sm font-semibold">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  name="email"
                  autoComplete="email"
                  required
                  className="surface-card mt-2 h-12 w-full rounded-xl px-4 outline-none focus-visible:ring-2 focus-visible:ring-pine"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  name="password"
                  autoComplete={mode === "create" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                  className="surface-card mt-2 h-12 w-full rounded-xl px-4 outline-none focus-visible:ring-2 focus-visible:ring-pine"
                />
              </label>
              {error ? <p className="text-sm text-copper">{error}</p> : null}
              <button
                type="submit"
                disabled={pending}
                className="press mt-2 h-12 rounded-xl bg-pine font-semibold text-paper disabled:opacity-50"
              >
                {pending ? "Please wait…" : mode === "create" ? "Create account" : "Sign in"}
              </button>
            </form>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-pine"
              onClick={() => {
                setMode((value) => (value === "create" ? "enter" : "create"));
                setError("");
              }}
            >
              {mode === "create" ? "Already registered? Sign in" : "New here? Create an account"}
            </button>
            <div className="mt-8 grid gap-2">
              {GROK_PROVIDERS.map((provider) => (
                <button
                  key={provider.providerId}
                  type="button"
                  onClick={() => void signIn(provider.providerId, { callbackURL: "/" }).catch(() => setError("Could not start sign-in."))}
                  className={cn("press h-12 rounded-xl font-semibold surface-card")}
                >
                  Continue with {provider.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
