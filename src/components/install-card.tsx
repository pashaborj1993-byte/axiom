import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void> };

function installedAlready() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallCard() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(installedAlready);
  const ios =
    typeof navigator !== "undefined" &&
    (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

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
        Install Axiom on the home screen. It opens full screen, like an app, and stays signed in to the same account.
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
            ? "On iPhone or iPad, open this site in Safari. Tap Share, then Add to Home Screen."
            : "On Android, open this site in Chrome. Tap the menu, then Install app or Add to Home screen."}
        </p>
      )}
    </section>
  );
}
