// ============================================================
// API ROUTE: POST /api/analyze
// Receives image + metadata, runs analysis pipeline, returns result
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import type { AnalyzeRequest, AnalyzeResponse } from '@/types'
import { runAnalysisPipeline } from '@/analysis-engine/pipeline'

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1D']

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = await request.json()

    // ── Validate input ──────────────────────────────────────
    if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
      return NextResponse.json(
        { success: false, analysisId: '', error: 'imageBase64 is required' },
        { status: 400 }
      )
    }

    if (!body.mimeType || !SUPPORTED_MIME_TYPES.includes(body.mimeType)) {
      return NextResponse.json(
        { success: false, analysisId: '', error: `mimeType must be one of: ${SUPPORTED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!body.timeframe || !TIMEFRAMES.includes(body.timeframe)) {
      return NextResponse.json(
        { success: false, analysisId: '', error: `timeframe must be one of: ${TIMEFRAMES.join(', ')}` },
        { status: 400 }
      )
    }

    // ── Validate image size ─────────────────────────────────
    const estimatedBytes = (body.imageBase64.length * 3) / 4
    if (estimatedBytes > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, analysisId: '', error: 'Image exceeds 10MB limit' },
        { status: 413 }
      )
    }

    // ── Run pipeline ────────────────────────────────────────
    const analyzeRequest: AnalyzeRequest = {
      imageBase64: body.imageBase64,
      mimeType: body.mimeType,
      timeframe: body.timeframe,
      instrument: body.instrument,
      sessionId: body.sessionId,
    }

    const record = await runAnalysisPipeline(analyzeRequest)

    return NextResponse.json({
      success: true,
      analysisId: record.id,
      result: record.result ?? undefined,
      processingTimeMs: record.processing_time_ms ?? undefined,
    })
  } catch (error) {
    console.error('[/api/analyze] Error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    return NextResponse.json(
      { success: false, analysisId: '', error: message },
      { status: 500 }
    )
  }
}
