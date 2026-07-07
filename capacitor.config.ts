import type { CapacitorConfig } from "@capacitor/cli";

// App stores (iOS + Android) : meme codebase que le web.
// npx cap add ios && npx cap add android, puis npm run cap:sync apres chaque build.
const config: CapacitorConfig = {
  appId: "org.modaia.app",
  appName: "Modaia",
  webDir: "dist",
  server: { androidScheme: "https" }
};

export default config;
