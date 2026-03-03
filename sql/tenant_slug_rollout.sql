-- Staged rollout for Tenant.slug to avoid migration failures on non-empty databases.
--
-- Step 1 (safe deploy): add nullable slug and uniqueness for populated values.
ALTER TABLE "Tenant"
ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS tenant_slug_unique_idx
ON "Tenant" (slug)
WHERE slug IS NOT NULL;

-- Step 2 (one-time backfill): populate slug for historical rows.
-- Note: rerunnable; only fills NULLs.
UPDATE "Tenant"
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id, 1, 8)
WHERE slug IS NULL;

-- Step 3 (after verifying all rows are populated): enforce NOT NULL.
-- ALTER TABLE "Tenant"
-- ALTER COLUMN slug SET NOT NULL;

-- Optional: if you later switch to a full table constraint, drop partial index first.
-- DROP INDEX IF EXISTS tenant_slug_unique_idx;
-- ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_slug_key" UNIQUE (slug);
