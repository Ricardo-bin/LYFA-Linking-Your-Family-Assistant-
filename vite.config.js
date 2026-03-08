import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-ack-html",
      closeBundle() {
        try {
          copyFileSync("public/ack.html", "dist/ack.html");
          console.log("✅ ack.html copied to dist/");
        } catch (e) {
          console.warn("⚠️ Could not copy ack.html:", e.message);
        }
      },
    },
  ],
});