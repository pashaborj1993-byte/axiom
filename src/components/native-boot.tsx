import { useEffect } from "react";

export function NativeBoot() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled || !Capacitor.isNativePlatform()) return;
      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#E7FBF6" });
      await SplashScreen.hide();
      await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.exitApp();
      });
    })().catch(() => {
      // The browser build has no native bridge. Ignore it.
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
