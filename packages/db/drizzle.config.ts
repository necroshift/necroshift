import { fileURLToPath } from "node:url"
import path from "node:path"
import { config as loadEnv } from "dotenv"
import { defineConfig } from "drizzle-kit"

loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") })

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
