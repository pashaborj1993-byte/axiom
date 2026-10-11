import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void> };

export function InstallCard() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const ios = typeof navigator !== "undefined" && /iphone|ipad/i.test(navigator.userAgent);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as PromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  return (
    <section className="surface-card mt-6 rounded-2xl px-4 py-4">
      <h2 className="font-serif text-xl">On your phone</h2>
      <p className="mt-1 text-sm text-pretty text-muted">
        The same app runs in the browser and as a home-screen app on iPhone and Android. It stays online, so the path and the field notes come from your account.
      </p>
      {prompt ? (
        <button
          type="button"
          className="press mt-3 h-12 w-full rounded-xl bg-pine font-semibold text-paper"
          onClick={() => void prompt.prompt()}
        >
          Install Axiom
        </button>
      ) : (
        <p className="mt-3 text-sm text-pretty">
          {ios
            ? "In Safari, tap Share, then Add to Home Screen."
            : "In Chrome on Android, open the browser menu and choose Install app."}
        </p>
      )}
    </section>
  );
}
