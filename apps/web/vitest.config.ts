import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      // The real packages throw when imported outside Next's own compiler,
      // which is exactly what happens when Vitest loads a server module
      // directly. Next itself special-cases these two; plain Vitest needs
      // an explicit no-op alias to do the same.
      "server-only": path.resolve(__dirname, "./vitest.empty-module.ts"),
      "client-only": path.resolve(__dirname, "./vitest.empty-module.ts"),
      // Mirrors tsconfig's "@/*": ["./*"] (apps/web/tsconfig.json) — Next's
      // compiler resolves that alias itself; plain Vitest needs it explicit.
      "@": __dirname,
    },
  },
})
