import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildRagPipelineSummary,
  composeRetrievalResponse,
  noteChunkSchema,
  semanticSearchQuerySchema,
  vectorSearchConfigSchema
} from '../src/rag/vector-search.contract.js'

test('buildRagPipelineSummary describes semantic retrieval stack', () => {
  const summary = buildRagPipelineSummary({
    vectorDb: 'pgvector',
    embeddingProvider: 'openai',
    embeddingModel: 'text-embedding-3-small',
    embeddingDimensions: 1536,
    retrievalMode: 'semantic',
    topK: 8,
    minScore: 0.25,
    enableKnowledgeRetrieval: true,
    enableChatWithNotes: true
  })

  assert.equal(summary.length, 6)
  assert.match(summary[1], /1536-dimensional/)
  assert.match(summary[2], /pgvector/)
  assert.match(summary[4], /Chat with your notes is enabled/)
})

test('composeRetrievalResponse creates Thai fallback copy when nothing matches', () => {
  const response = composeRetrievalResponse({
    workspaceId: 'ws-1',
    userId: 'user-1',
    query: 'สรุปโน้ตประชุมไตรมาสล่าสุด',
    locale: 'th',
    includeArchived: false
  }, [])

  assert.equal(response.hits.length, 0)
  assert.match(response.answerContext, /ไม่พบบริบท/)
  assert.match(response.safetyNotice, /Human Confirmation/)
})

test('schemas accept bilingual note chunks and query filters', () => {
  const chunk = noteChunkSchema.parse({
    id: 'chunk-1',
    noteId: 'note-1',
    workspaceId: 'ws-1',
    locale: 'en',
    content: 'Project launch checklist and customer risks',
    tokenCount: 12,
    embeddingModel: 'bge-m3',
    embeddingVersion: '2026-03',
    sourceUpdatedAt: '2026-03-21T00:00:00.000Z',
    metadata: {
      title: 'Launch planning',
      tags: ['launch', 'risk']
    }
  })

  const query = semanticSearchQuerySchema.parse({
    workspaceId: 'ws-1',
    userId: 'user-1',
    query: 'launch risks',
    locale: 'en',
    noteIds: ['note-1']
  })

  const config = vectorSearchConfigSchema.parse({
    vectorDb: 'qdrant',
    embeddingProvider: 'bge',
    embeddingModel: 'bge-m3',
    embeddingDimensions: 1024
  })

  assert.equal(chunk.locale, 'en')
  assert.deepEqual(query.noteIds, ['note-1'])
  assert.equal(config.retrievalMode, 'semantic')
  assert.equal(config.vectorDb, 'qdrant')
})
