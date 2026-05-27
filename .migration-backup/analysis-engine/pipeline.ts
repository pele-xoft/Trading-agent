// ============================================================
// ANALYSIS ENGINE — Core orchestration pipeline
// Coordinates: upload → store → AI → parse → save → return
// ============================================================

import type {
  AnalyzeRequest,
  AnalysisRecord,
  AnalysisStatus,
} from '@/types'
import { analyzeChart, AI_MODEL } from '@/services/ai.service'
import { uploadImage } from '@/services/storage.service'
import { createAnalysisRecord, updateAnalysisRecord } from '@/services/db.service'
import { computeCompositeSignal } from '@/indicator-engine/composite-signal'

// ─── MAIN PIPELINE ────────────────────────────────────────────

export async function runAnalysisPipeline(
  request: AnalyzeRequest
): Promise<AnalysisRecord> {
  // Step 1: Upload image to Supabase Storage
  const { imageUrl, imagePath } = await uploadImage({
    base64: request.imageBase64,
    mimeType: request.mimeType,
    timeframe: request.timeframe,
  })

  // Step 2: Create pending DB record
  const record = await createAnalysisRecord({
    status: 'processing' as AnalysisStatus,
    timeframe: request.timeframe,
    instrument: request.instrument ?? null,
    imageUrl,
    imagePath,
    aiModel: AI_MODEL,
    sessionId: request.sessionId ?? null,
  })

  try {
    // Step 3: Run AI analysis
    const { result, processingTimeMs, promptVersion, model } = await analyzeChart(request)

    // Step 4: Compute composite signal (rule-based layer on top of AI)
    const compositeSignal = computeCompositeSignal(result)

    // Augment confidence with composite signal
    const finalConfidence = blendConfidence(result.confidence, compositeSignal.confidence)
    result.confidence = finalConfidence

    // Step 5: Save complete result
    const completed = await updateAnalysisRecord(record.id, {
      status: 'complete',
      result,
      promptVersion,
      aiModel: model,
      processingTimeMs,
    })

    return completed
  } catch (error) {
    // Save error state
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    const failed = await updateAnalysisRecord(record.id, {
      status: 'error',
      errorMessage,
    })

    throw new Error(`Analysis failed: ${errorMessage}`)
  }
}

// ─── CONFIDENCE BLENDER ───────────────────────────────────────

/**
 * Blend AI-reported confidence with rule-based composite signal
 * AI: 70% weight (it saw the chart)
 * Rule engine: 30% weight (structural confirmation)
 */
function blendConfidence(aiConfidence: number, ruleConfidence: number): number {
  const blended = aiConfidence * 0.7 + ruleConfidence * 0.3
  return Math.round(Math.max(0, Math.min(100, blended)))
}
