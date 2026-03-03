-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Convert embedding column to pgvector
ALTER TABLE "Memory"
DROP COLUMN IF EXISTS embedding;

ALTER TABLE "Memory"
ADD COLUMN embedding vector(1536);

-- Vector index (IVFFLAT)
CREATE INDEX memory_embedding_idx
ON "Memory"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);

-- Improve tenant filtering
CREATE INDEX memory_tenant_embedding_idx
ON "Memory" ("tenantId");

-- Refresh planner stats after index/column changes
ANALYZE "Memory";

-- Recommended partition strategy (production scale)
-- CREATE TABLE memory_partitioned (
--   LIKE "Memory" INCLUDING ALL
-- ) PARTITION BY HASH ("tenantId");
--
-- Then create 16-32 partitions depending on tenant/load profile.
