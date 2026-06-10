import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.karala.redact",
  appName: "Karala",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
