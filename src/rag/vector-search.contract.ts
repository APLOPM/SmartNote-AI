import { z } from 'zod'

export const supportedVectorDbSchema = z.enum(['pgvector', 'weaviate', 'milvus', 'qdrant'])
export const supportedEmbeddingProviderSchema = z.enum(['openai', 'bge', 'e5', 'instructor'])
export const retrievalModeSchema = z.enum(['semantic', 'hybrid'])

export type SupportedVectorDb = z.infer<typeof supportedVectorDbSchema>
export type SupportedEmbeddingProvider = z.infer<typeof supportedEmbeddingProviderSchema>
export type RetrievalMode = z.infer<typeof retrievalModeSchema>

export const noteChunkSchema = z.object({
  id: z.string().min(1),
  noteId: z.string().min(1),
  workspaceId: z.string().min(1),
  locale: z.enum(['th', 'en']).default('th'),
  content: z.string().min(1),
  tokenCount: z.number().int().positive(),
  embeddingModel: z.string().min(1),
  embeddingVersion: z.string().min(1),
  sourceUpdatedAt: z.coerce.date(),
  metadata: z.record(z.string(), z.unknown()).default({})
})

export const vectorSearchConfigSchema = z.object({
  vectorDb: supportedVectorDbSchema,
  embeddingProvider: supportedEmbeddingProviderSchema,
  embeddingModel: z.string().min(1),
  embeddingDimensions: z.number().int().positive(),
  retrievalMode: retrievalModeSchema.default('semantic'),
  topK: z.number().int().positive().max(50).default(8),
  minScore: z.number().min(0).max(1).default(0.2),
  enableKnowledgeRetrieval: z.boolean().default(true),
  enableChatWithNotes: z.boolean().default(true)
})

export const semanticSearchQuerySchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  query: z.string().min(1),
  locale: z.enum(['th', 'en']).default('th'),
  topK: z.number().int().positive().max(20).optional(),
  noteIds: z.array(z.string().min(1)).optional(),
  includeArchived: z.boolean().default(false)
})

export const retrievalHitSchema = z.object({
  chunkId: z.string().min(1),
  noteId: z.string().min(1),
  score: z.number().min(0).max(1),
  content: z.string().min(1),
  summary: z.string().min(1),
  rationale: z.string().min(1),
  locale: z.enum(['th', 'en']),
  metadata: z.record(z.string(), z.unknown()).default({})
})

export const retrievalResponseSchema = z.object({
  mode: retrievalModeSchema,
  hits: z.array(retrievalHitSchema),
  answerContext: z.string().min(1),
  followUpPrompt: z.string().min(1),
  safetyNotice: z.string().min(1)
})

export type NoteChunk = z.infer<typeof noteChunkSchema>
export type VectorSearchConfig = z.infer<typeof vectorSearchConfigSchema>
export type SemanticSearchQuery = z.infer<typeof semanticSearchQuerySchema>
export type RetrievalHit = z.infer<typeof retrievalHitSchema>
export type RetrievalResponse = z.infer<typeof retrievalResponseSchema>

export function buildRagPipelineSummary(config: VectorSearchConfig): string[] {
  const parsed = vectorSearchConfigSchema.parse(config)

  return [
    'Note content is chunked and normalized before embedding.',
    `Embedding provider ${parsed.embeddingProvider} produces ${parsed.embeddingDimensions}-dimensional vectors with model ${parsed.embeddingModel}.`,
    `Vectors are indexed in ${parsed.vectorDb} for ${parsed.retrievalMode} retrieval.`,
    parsed.enableKnowledgeRetrieval
      ? 'Knowledge retrieval is enabled for grounded answers and note linking.'
      : 'Knowledge retrieval is disabled; only direct note search is available.',
    parsed.enableChatWithNotes
      ? 'Chat with your notes is enabled with retrieval-backed context assembly.'
      : 'Chat with your notes is disabled for this workspace.',
    'The LLM answer layer must cite retrieved notes and keep Human Confirmation for sensitive actions.'
  ]
}

export function composeRetrievalResponse(
  query: SemanticSearchQuery,
  hits: RetrievalHit[],
  mode: RetrievalMode = 'semantic'
): RetrievalResponse {
  const parsedQuery = semanticSearchQuerySchema.parse(query)
  const parsedHits = z.array(retrievalHitSchema).parse(hits)

  const answerContext = parsedHits.length > 0
    ? parsedHits
        .map((hit, index) => `[#${index + 1}] ${hit.summary}: ${hit.content}`)
        .join('\n')
    : parsedQuery.locale === 'th'
      ? 'ไม่พบบริบทที่ตรงเพียงพอ ให้เสนอคำค้นใหม่หรือขอให้ผู้ใช้ระบุโน้ตที่เกี่ยวข้องมากขึ้น'
      : 'No sufficiently relevant context was found. Suggest a refined query or ask the user to narrow the note scope.'

  const followUpPrompt = parsedQuery.locale === 'th'
    ? 'สรุปคำตอบโดยอ้างอิงโน้ตที่ค้นพบ และแจ้งผู้ใช้หากยังต้องการข้อมูลเพิ่มก่อนทำงานต่อ'
    : 'Answer using the retrieved notes, and explicitly tell the user if more evidence is needed before taking further action.'

  const safetyNotice = parsedQuery.locale === 'th'
    ? 'หากคำตอบเกี่ยวข้องกับการแชร์ ลบ หรือแก้ไขข้อมูลสำคัญ ต้องขอ Human Confirmation ก่อนเสมอ'
    : 'If the answer leads to sharing, deleting, or changing sensitive data, require Human Confirmation before proceeding.'

  return retrievalResponseSchema.parse({
    mode,
    hits: parsedHits,
    answerContext,
    followUpPrompt,
    safetyNotice
  })
}
