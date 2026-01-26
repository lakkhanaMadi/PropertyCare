import { Config, defineConfig } from "drizzle-kit";
import "dotenv/config"

if (!process.env.DB_URL) {
  throw new Error('DATABASE_URL is not set in the .env file');
}

export default defineConfig({
  schema: "./src/db/schemas.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL!,
  },
}) satisfies Config;