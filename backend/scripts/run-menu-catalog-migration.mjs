/**
 * Applies 001_menu_catalog_rows.sql using SUPABASE_DATABASE_URL or DATABASE_URL from backend/.env
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

const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "001_menu_catalog_rows.sql");
const raw = fs.readFileSync(sqlPath, "utf8");
// Strip full-line SQL comments before splitting on `;` (semicolons inside comments break naive splits).
const withoutLineComments = raw
  .split("\n")
  .filter((line) => !/^\s*--/.test(line))
  .join("\n");
const statements = withoutLineComments
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

async function main() {
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    for (const stmt of statements) {
      const q = stmt.endsWith(";") ? stmt : `${stmt};`;
      console.log("Running:", q.split("\n")[0].slice(0, 72) + "...");
      await pool.query(q);
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
