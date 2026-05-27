// ============================================================
// AI SERVICE — Core AI integration layer
// Supports Claude (primary) with OpenAI-compatible fallback
// All AI calls flow through this file
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import type {
  AnalysisResult,
  AnalyzeRequest,
  Timeframe,
} from '@/types'
import { buildAnalysisPrompt, PROMPT_VERSION } from '@/prompts/prompt-builder'

// ─── CLIENT SETUP ────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const AI_MODEL = 'claude-opus-4-5'

// ─── MAIN ANALYSIS FUNCTION ──────────────────────────────────

export async function analyzeChart(request: AnalyzeRequest): Promise<{
  result: AnalysisResult
  processingTimeMs: number
  promptVersion: string
  model: string
}> {
  const startTime = Date.now()

  const systemPrompt = buildAnalysisPrompt(request.timeframe)

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: request.mimeType,
              data: request.imageBase64,
            },
          },
          {
            type: 'text',
            text: buildUserMessage(request.timeframe, request.instrument),
          },
        ],
      },
    ],
  })

  const processingTimeMs = Date.now() - startTime
  const rawText = extractTextContent(response)
  const result = parseAnalysisResponse(rawText)

  return {
    result,
    processingTimeMs,
    promptVersion: PROMPT_VERSION,
    model: AI_MODEL,
  }
}

// ─── USER MESSAGE BUILDER ────────────────────────────────────

function buildUserMessage(timeframe: Timeframe, instrument?: string): string {
  const instrumentText = instrument ? ` of ${instrument}` : ''
  return `Analyze this ${timeframe} chart${instrumentText}. 

Provide your complete technical analysis as a JSON object. Follow the exact output format specified in your instructions.

Focus on:
- What the price structure and moving averages tell you about trend direction
- RSI and Stochastic readings and what they mean for momentum
- Key support and resistance levels visible on this chart
- Whether a trade setup exists and what entry, stop loss, and take profit levels make sense

Be precise with price levels you can read from the chart. If you cannot read exact values, estimate and note it in warnings.`
}

// ─── RESPONSE PARSER ─────────────────────────────────────────

function extractTextContent(response: Anthropic.Message): string {
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI returned no text content')
  }
  return textBlock.text
}

function parseAnalysisResponse(rawText: string): AnalysisResult {
  // Strip markdown code fences if present
  const cleaned = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  // Find JSON object in response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error(`Failed to parse AI JSON response: ${jsonMatch[0].slice(0, 200)}`)
  }

  return validateAnalysisResult(parsed)
}

function validateAnalysisResult(raw: unknown): AnalysisResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Analysis result is not an object')
  }

  const r = raw as Record<string, unknown>

  // Validate required fields exist
  const required = ['marketBias', 'structure', 'indicators', 'tradeSetup', 'confidence', 'reasoning']
  for (const field of required) {
    if (!(field in r)) {
      throw new Error(`Analysis result missing required field: ${field}`)
    }
  }

  // Clamp confidence to 0–100
  if (typeof r.confidence === 'number') {
    r.confidence = Math.max(0, Math.min(100, r.confidence))
  }

  return r as unknown as AnalysisResult
}

// ─── HEALTH CHECK ─────────────────────────────────────────────

export async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    })
    return response.content.length > 0
  } catch {
    return false
  }
}
