import { useEffect, type ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { refreshLearner } from "@/lib/learner-client";
import { useHydrated, useProgress } from "@/lib/progress";
import { Splash } from "@/components/welcome";

export function LearnerGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const { user, isPending } = useCurrentUserState();
  const cloudStatus = useProgress((state) => state.cloudStatus);
  const cloudUserId = useProgress((state) => state.cloudUserId);

  useEffect(() => {
    if (!hydrated || isPending || !user) return;
    if (cloudUserId === user.id && (cloudStatus === "ready" || cloudStatus === "loading")) return;
    void refreshLearner(user.id);
  }, [hydrated, isPending, user, cloudUserId, cloudStatus]);

  if (!hydrated || isPending) return <Splash />;
  if (!user || cloudStatus === "signedout") return <RedirectToSignIn />;
  if (cloudStatus === "error") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
        <h1 className="font-serif text-3xl">Couldn’t reach your account.</h1>
        <p className="mt-2 text-muted">Your path is stored with your sign-in. Try again in a moment.</p>
        <button
          type="button"
          className="press mt-6 h-12 rounded-xl bg-pine font-semibold text-paper"
          onClick={() => {
            if (!user) return;
            useProgress.setState({ cloudStatus: "idle" });
          }}
        >
          Retry
        </button>
      </main>
    );
  }
  if (cloudStatus !== "ready" || cloudUserId !== user.id) return <Splash />;
  return children;
}
