-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Non-destructive embedding migration:
-- 1) Create the column when missing.
-- 2) Keep existing data intact when the column already exists.
-- 3) Fail fast (without dropping data) if the existing column type is not pgvector.
DO $$
DECLARE
  embedding_type TEXT;
BEGIN
  SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
  INTO embedding_type
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'Memory'
    AND a.attname = 'embedding'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF embedding_type IS NULL THEN
    EXECUTE 'ALTER TABLE "Memory" ADD COLUMN embedding vector(1536)';
  ELSIF embedding_type <> 'vector(1536)' THEN
    RAISE EXCEPTION
      'Column "Memory"."embedding" already exists with type %, expected vector(1536). Run a dedicated data migration; do not drop this column in-place.',
      embedding_type;
  END IF;
END
$$;

-- Vector index (IVFFLAT)
CREATE INDEX IF NOT EXISTS memory_embedding_idx
ON "Memory"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);

-- Tenant filter index is already managed by Prisma schema (@@index([tenantId])).

-- Refresh planner stats after index/column changes
ANALYZE "Memory";

-- Recommended partition strategy (production scale)
-- CREATE TABLE memory_partitioned (
--   LIKE "Memory" INCLUDING ALL
-- ) PARTITION BY HASH ("tenantId");
--
-- Then create 16-32 partitions depending on tenant/load profile.
