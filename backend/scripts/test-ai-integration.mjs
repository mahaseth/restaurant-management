/**
 * Integration checks for AI Studio (Azure/OpenAI, embeddings, chat, optional Supabase PG).
 * Run from repo: node backend/scripts/test-ai-integration.mjs
 * Or: cd backend && node scripts/test-ai-integration.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const results = [];

function ok(name, detail = "") {
  results.push({ name, pass: true, detail });
  console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, err) {
  const msg = err?.message || String(err);
  results.push({ name, pass: false, detail: msg });
  console.error(`[FAIL] ${name} — ${msg}`);
}

async function main() {
  console.log("=== AI Studio integration test ===\n");

  // 1) Config / provider
  try {
    const config = (await import("../src/config/config.js")).default;
    const {
      usesAzureOpenAI,
      getAiStudioOpenAIClient,
      getEmbeddingModelId,
      getChatModelId,
      getEmbeddingDimensions,
    } = await import("../src/features/ai-studio/services/aiStudioOpenai.provider.js");

    const azure = usesAzureOpenAI();
    ok("Provider mode", azure ? "Azure OpenAI" : "OpenAI direct");
    ok("Embedding model/deployment id", getEmbeddingModelId());
    ok("Chat model/deployment id", getChatModelId());
    ok("Embedding dimensions", String(getEmbeddingDimensions()));

    getAiStudioOpenAIClient();
    ok("OpenAI client constructed");
  } catch (e) {
    fail("OpenAI client / config", e);
    printSummary();
    process.exit(1);
  }

  // 2) Embeddings API (real call)
  try {
    const { embedTexts } = await import("../src/features/ai-studio/services/embedding.service.js");
    const vec = await embedTexts(["Integration test phrase for restaurant menu."]);
    if (!vec?.length || !Array.isArray(vec[0])) throw new Error("No embedding vector returned");
    ok("embedTexts()", `dim=${vec[0].length}`);
  } catch (e) {
    fail("embedTexts()", e);
  }

  // 3) Chat completion (real call, minimal)
  try {
    const { getAiStudioOpenAIClient, getChatModelId } = await import(
      "../src/features/ai-studio/services/aiStudioOpenai.provider.js"
    );
    const client = getAiStudioOpenAIClient();
    const model = getChatModelId();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "Reply with exactly: OK" },
        { role: "user", content: "Ping" },
      ],
      max_tokens: 16,
      temperature: 0,
    });
    const text = completion.choices[0]?.message?.content?.trim() || "";
    if (!text) throw new Error("Empty chat response");
    ok("chat.completions", text.slice(0, 80));
  } catch (e) {
    fail("chat.completions", e);
  }

  // 4) Supabase / Postgres (optional)
  try {
    const config = (await import("../src/config/config.js")).default;
    const url = config.supabase?.databaseUrl;
    if (!url) {
      ok("Supabase PG", "skipped (SUPABASE_DATABASE_URL not set)");
    } else {
      const pg = (await import("pg")).default;
      const pool = new pg.Pool({ connectionString: url, max: 1 });
      const r = await pool.query("SELECT 1 AS n");
      await pool.end();
      if (r.rows[0]?.n !== 1) throw new Error("Unexpected SELECT 1 result");
      ok("Supabase PG connection", "SELECT 1 OK");

      const pool2 = new pg.Pool({ connectionString: url, max: 1 });
      const tbl = await pool2.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'menu_catalog_rows'
         ) AS exists`
      );
      await pool2.end();
      const exists = tbl.rows[0]?.exists === true;
      ok("menu_catalog_rows table", exists ? "exists" : "MISSING — run supabase/migrations/001_menu_catalog_rows.sql");
    }
  } catch (e) {
    fail("Supabase PG", e);
  }

  // 5) Mongo + RestaurantAiAgent (optional)
  try {
    const connectDB = (await import("../src/config/database.js")).default;
    await connectDB();
    const RestaurantAiAgent = (await import("../src/models/RestaurantAiAgent.js")).default;
    const count = await RestaurantAiAgent.countDocuments();
    ok("MongoDB + RestaurantAiAgent", `count=${count}`);
  } catch (e) {
    fail("MongoDB / RestaurantAiAgent", e);
  }

  printSummary();
  const failed = results.filter((r) => !r.pass);
  process.exit(failed.length ? 1 : 0);
}

function printSummary() {
  const failed = results.filter((r) => !r.pass);
  console.log("\n=== Summary ===");
  console.log(`Passed: ${results.filter((r) => r.pass).length} / ${results.length}`);
  if (failed.length) {
    console.log("Failed:", failed.map((f) => f.name).join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
