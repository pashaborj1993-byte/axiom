import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Install still works from the browser menu if registration fails.
    });
  }, []);
  return null;
}
