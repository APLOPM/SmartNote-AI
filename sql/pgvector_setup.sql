CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Memory"
ADD COLUMN embedding vector(1536);

CREATE INDEX memory_embedding_idx
ON "Memory"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);

-- Optional partition:
CREATE TABLE memory_partitioned PARTITION BY HASH (tenant_id);
