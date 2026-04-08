ALTER TABLE menu_catalog_rows
ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';

UPDATE menu_catalog_rows
SET image_url = COALESCE(NULLIF(TRIM(attributes->>'imageUrl'), ''), '')
WHERE COALESCE(NULLIF(TRIM(image_url), ''), '') = '';
