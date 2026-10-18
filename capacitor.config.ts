import type { CapacitorConfig } from "@capacitor/cli";

const PRODUCTION_URL = "https://palm-brick-terra-lilac.grok.me";
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() || PRODUCTION_URL;

const config: CapacitorConfig = {
  appId: "app.axiom.learn",
  appName: "Axiom",
  webDir: "mobile/www",
  backgroundColor: "#E7FBF6",
  server: {
    url: serverUrl,
    androidScheme: "https",
    cleartext: serverUrl.startsWith("http://"),
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#E7FBF6",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#E7FBF6",
    },
  },
};

export default config;
