// ============================================================
// API ROUTE: GET /api/history
// Returns paginated analysis history
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import type { HistoryResponse } from '@/types'
import { getAnalysisHistory } from '@/services/db.service'

export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))
    const sessionId = searchParams.get('sessionId') ?? undefined

    const { analyses, total } = await getAnalysisHistory(page, pageSize, sessionId)

    return NextResponse.json({ analyses, total, page, pageSize })
  } catch (error) {
    console.error('[/api/history] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
