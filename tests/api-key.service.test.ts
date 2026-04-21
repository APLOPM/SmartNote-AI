import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiKeyRecord, ApiKeyService, ApiKeyStore } from '../src/services/api-key.service'

class InMemoryApiKeyStore implements ApiKeyStore {
  private rows = new Map<string, ApiKeyRecord>()

  async create(data: ApiKeyRecord): Promise<ApiKeyRecord> {
    this.rows.set(data.id, data)
    return data
  }

  async findById(id: string): Promise<ApiKeyRecord | null> {
    return this.rows.get(id) ?? null
  }

  async touchLastUsed(id: string, usedAt: Date): Promise<void> {
    const row = this.rows.get(id)
    if (!row) return
    row.lastUsedAt = usedAt
    this.rows.set(id, row)
  }
}

test('createApiKey returns full key once and persists only hash/prefix', async () => {
  const store = new InMemoryApiKeyStore()
  const service = new ApiKeyService(store)

  const created = await service.createApiKey({
    workspaceId: 'ws_1',
    scopes: ['notes:read', 'notes:write']
  })

  assert.match(created.key, /^snk_[A-Za-z0-9_-]+_[A-Za-z0-9_-]+$/)
  assert.ok(created.keyPrefix.length > 0)
  assert.match(created.keyPreview, /^snk_[A-Za-z0-9_-]+\.\.\.[A-Za-z0-9_-]{4}$/)

  const parsed = created.key.split('_')
  const persisted = await store.findById(parsed[1])
  assert.ok(persisted)
  assert.ok(!persisted?.keyHash.includes(created.key))
  assert.equal(persisted?.workspaceId, 'ws_1')
})

test('validateApiKey compares against hash and updates lastUsedAt', async () => {
  const store = new InMemoryApiKeyStore()
  const service = new ApiKeyService(store)

  const created = await service.createApiKey({
    workspaceId: 'ws_2',
    scopes: ['agent:run']
  })

  const valid = await service.validateApiKey(created.key, 'agent:run')
  assert.ok(valid)
  assert.equal(valid?.workspaceId, 'ws_2')
  assert.ok(valid?.lastUsedAt instanceof Date)

  const invalid = await service.validateApiKey(`${created.key}x`, 'agent:run')
  assert.equal(invalid, null)
})

test('validateApiKey rejects revoked, expired, and missing scope keys', async () => {
  const store = new InMemoryApiKeyStore()
  const service = new ApiKeyService(store)

  const created = await service.createApiKey({
    workspaceId: 'ws_3',
    scopes: ['notes:read'],
    expiresAt: new Date(Date.now() + 60_000)
  })

  const keyId = created.key.split('_')[1]
  const row = await store.findById(keyId)
  assert.ok(row)
  if (!row) return

  row.revokedAt = new Date()
  await store.create(row)

  const revoked = await service.validateApiKey(created.key)
  assert.equal(revoked, null)

  row.revokedAt = null
  row.expiresAt = new Date(Date.now() - 1_000)
  await store.create(row)

  const expired = await service.validateApiKey(created.key)
  assert.equal(expired, null)

  row.expiresAt = null
  await store.create(row)

  const scopeMismatch = await service.validateApiKey(created.key, 'notes:write')
  assert.equal(scopeMismatch, null)
})
