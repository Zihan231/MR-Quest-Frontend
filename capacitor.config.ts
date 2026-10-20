import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mrquest.app",
  appName: "MR Quest",
  webDir: "www",
  server: {
    url: "https://mr-quest-frontend.vercel.app",
    cleartext: false,
  },
};

export default config;
