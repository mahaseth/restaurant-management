-- Run in Supabase SQL editor (or psql) before using AI menu sync.
-- Requires pgvector: Database → Extensions → enable "vector".

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS menu_catalog_rows (
  id uuid PRIMARY KEY,
  restaurant_id text NOT NULL,
  menu_item_id text,
  content text NOT NULL,
  embedding vector(1536),
  attributes jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_catalog_restaurant_id ON menu_catalog_rows (restaurant_id);

-- HNSW works on empty tables (IVFFlat needs enough rows first).
CREATE INDEX IF NOT EXISTS idx_menu_catalog_embedding ON menu_catalog_rows
  USING hnsw (embedding vector_cosine_ops);
