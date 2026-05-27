// ============================================================
// DATABASE SERVICE — Supabase Postgres operations
// All DB access flows through here — never query directly from routes
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { AnalysisRecord, AnalysisResult, AnalysisStatus, Timeframe } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── CREATE ───────────────────────────────────────────────────

interface CreateRecordParams {
  status: AnalysisStatus
  timeframe: Timeframe
  instrument: string | null
  imageUrl: string
  imagePath: string
  aiModel: string
  sessionId: string | null
}

export async function createAnalysisRecord(params: CreateRecordParams): Promise<AnalysisRecord> {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      status: params.status,
      timeframe: params.timeframe,
      instrument: params.instrument,
      image_url: params.imageUrl,
      image_path: params.imagePath,
      ai_model: params.aiModel,
      session_id: params.sessionId,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create analysis record: ${error?.message}`)
  }

  return data as AnalysisRecord
}

// ─── UPDATE ───────────────────────────────────────────────────

interface UpdateRecordParams {
  status?: AnalysisStatus
  result?: AnalysisResult
  promptVersion?: string
  aiModel?: string
  processingTimeMs?: number
  errorMessage?: string
}

export async function updateAnalysisRecord(
  id: string,
  params: UpdateRecordParams
): Promise<AnalysisRecord> {
  const updates: Record<string, unknown> = {}

  if (params.status !== undefined) updates.status = params.status
  if (params.result !== undefined) updates.result = params.result
  if (params.promptVersion !== undefined) updates.prompt_version = params.promptVersion
  if (params.aiModel !== undefined) updates.ai_model = params.aiModel
  if (params.processingTimeMs !== undefined) updates.processing_time_ms = params.processingTimeMs
  if (params.errorMessage !== undefined) updates.error_message = params.errorMessage

  const { data, error } = await supabase
    .from('analyses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to update analysis record: ${error?.message}`)
  }

  return data as AnalysisRecord
}

// ─── READ ─────────────────────────────────────────────────────

export async function getAnalysisById(id: string): Promise<AnalysisRecord | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select()
    .eq('id', id)
    .single()

  if (error) return null
  return data as AnalysisRecord
}

export async function getAnalysisHistory(
  page = 1,
  pageSize = 20,
  sessionId?: string
): Promise<{ analyses: AnalysisRecord[]; total: number }> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('analyses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (sessionId) {
    query = query.eq('session_id', sessionId)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch analysis history: ${error.message}`)
  }

  return {
    analyses: (data ?? []) as AnalysisRecord[],
    total: count ?? 0,
  }
}
