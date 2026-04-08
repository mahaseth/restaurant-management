/**
 * Applies all SQL files in supabase/migrations using SUPABASE_DATABASE_URL or DATABASE_URL from backend/.env
 * Usage: cd backend && node scripts/run-menu-catalog-migration.mjs
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing SUPABASE_DATABASE_URL or DATABASE_URL in .env");
  process.exit(1);
}

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

function statementsFromFile(sqlPath) {
  const raw = fs.readFileSync(sqlPath, "utf8");
  const withoutLineComments = raw
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
  return withoutLineComments
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.toLowerCase().endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      const statements = statementsFromFile(sqlPath);
      console.log(`\nApplying migration: ${file}`);
      for (const stmt of statements) {
        const q = stmt.endsWith(";") ? stmt : `${stmt};`;
        console.log("Running:", q.split("\n")[0].slice(0, 72) + "...");
        await pool.query(q);
      }
    }
    console.log("\nMigration finished OK.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
