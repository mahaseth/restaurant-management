import pg from "pg";
import config from "../../../config/config.js";

let pool = null;

function getPool() {
  const conn = config.supabase?.databaseUrl;
  if (!conn) {
    throw new Error("SUPABASE_DATABASE_URL (or DATABASE_URL) is required for menu sync.");
  }
  if (!pool) {
    pool = new pg.Pool({ connectionString: conn, max: 4 });
  }
  return pool;
}

const INSERT_SQL = `
  INSERT INTO menu_catalog_rows (id, restaurant_id, menu_item_id, content, embedding, attributes, updated_at)
  VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::vector, $6::jsonb, $7::timestamptz)
`;

/**
 * Remove all rows for a restaurant, then insert new ones.
 * @param {string} restaurantId Mongo ObjectId string
 * @param {Array<{ menuItemId: string, content: string, embedding: number[], attributes: object }>} rows
 */
export async function replaceMenuRows(restaurantId, rows) {
  const pool = getPool();
  const client = await pool.connect();
  const now = new Date();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM menu_catalog_rows WHERE restaurant_id = $1::text`, [restaurantId]);

    for (const row of rows) {
      const vecStr = `[${row.embedding.join(",")}]`;
      const attrs = JSON.stringify(row.attributes ?? {});
      await client.query(INSERT_SQL, [
        row.id,
        restaurantId,
        row.menuItemId,
        row.content,
        vecStr,
        attrs,
        now,
      ]);
    }
    await client.query("COMMIT");
    return { inserted: rows.length };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * @param {string} restaurantId
 * @param {number[]} queryEmbedding
 * @param {number} limit
 */
export async function searchSimilar(restaurantId, queryEmbedding, limit = 8) {
  const pool = getPool();
  const vecStr = `[${queryEmbedding.join(",")}]`;
  const { rows } = await pool.query(
    `
    SELECT content, attributes,
           1 - (embedding <=> $1::vector) AS similarity
    FROM menu_catalog_rows
    WHERE restaurant_id = $2::text
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    [vecStr, restaurantId, limit]
  );
  return rows;
}
