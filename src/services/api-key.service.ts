import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_PREFIX = 'snk'
const KEY_ID_BYTES = 12
const KEY_SECRET_BYTES = 32
const HASH_KEYLEN = 64
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1

export interface ApiKeyRecord {
  id: string
  workspaceId: string
  keyHash: string
  keyPrefix: string
  scopes: string[]
  expiresAt: Date | null
  revokedAt: Date | null
  lastUsedAt: Date | null
}

export interface CreateApiKeyInput {
  workspaceId: string
  scopes: string[]
  expiresAt?: Date | null
}

export interface CreateApiKeyResult {
  id: string
  key: string // returned once to the caller/UI
  keyPrefix: string
  keyPreview: string // helper for UI list after first reveal
}

export interface ApiKeyStore {
  create(data: Omit<ApiKeyRecord, 'lastUsedAt' | 'revokedAt'> & { lastUsedAt?: Date | null; revokedAt?: Date | null }): Promise<ApiKeyRecord>
  findById(id: string): Promise<ApiKeyRecord | null>
  touchLastUsed(id: string, usedAt: Date): Promise<void>
}

function encodeTokenPart(bytes: Buffer): string {
  return bytes.toString('hex')
}

function parseToken(token: string): { keyId: string; secret: string } | null {
  const parts = token.split('_')
  if (parts.length !== 3 || parts[0] !== KEY_PREFIX) {
    return null
  }

  const [, keyId, secret] = parts
  if (!keyId || !secret) {
    return null
  }

  return { keyId, secret }
}

function buildDisplayPrefix(token: string): string {
  return token.slice(0, 16)
}

function buildPreview(token: string): string {
  return `${token.slice(0, 12)}...${token.slice(-4)}`
}

async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = scryptSync(secret, salt, HASH_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${derived.toString('base64url')}`
}

async function verifySecret(secret: string, keyHash: string): Promise<boolean> {
  const [algorithm, n, r, p, saltBase64, hashBase64] = keyHash.split('$')
  if (algorithm !== 'scrypt' || !n || !r || !p || !saltBase64 || !hashBase64) {
    return false
  }

  const salt = Buffer.from(saltBase64, 'base64url')
  const expected = Buffer.from(hashBase64, 'base64url')
  const derived = scryptSync(secret, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p)
  })

  if (derived.length !== expected.length) {
    return false
  }

  return timingSafeEqual(derived, expected)
}

export class ApiKeyService {
  constructor(private readonly store: ApiKeyStore) {}

  async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const keyId = encodeTokenPart(randomBytes(KEY_ID_BYTES))
    const secret = encodeTokenPart(randomBytes(KEY_SECRET_BYTES))
    const fullKey = `${KEY_PREFIX}_${keyId}_${secret}`
    const keyHash = await hashSecret(secret)
    const keyPrefix = buildDisplayPrefix(fullKey)

    const record = await this.store.create({
      id: keyId,
      workspaceId: input.workspaceId,
      keyHash,
      keyPrefix,
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
      revokedAt: null,
      lastUsedAt: null
    })

    return {
      id: record.id,
      key: fullKey,
      keyPrefix: record.keyPrefix,
      keyPreview: buildPreview(fullKey)
    }
  }

  async validateApiKey(presentedKey: string, requiredScope?: string): Promise<ApiKeyRecord | null> {
    const parsed = parseToken(presentedKey)
    if (!parsed) {
      return null
    }

    const record = await this.store.findById(parsed.keyId)
    if (!record) {
      return null
    }

    const now = new Date()
    if (record.revokedAt || (record.expiresAt && record.expiresAt <= now)) {
      return null
    }

    if (requiredScope && !record.scopes.includes(requiredScope)) {
      return null
    }

    const isValid = await verifySecret(parsed.secret, record.keyHash)
    if (!isValid) {
      return null
    }

    await this.store.touchLastUsed(record.id, now)
    return { ...record, lastUsedAt: now }
  }
}
