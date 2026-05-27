// ============================================================
// CHART AI AGENT — TYPE DEFINITIONS
// Single source of truth for all TypeScript types
// Version: 1.0.0
// ============================================================

// ─── ENUMS ───────────────────────────────────────────────────

export type MarketBias = 'bullish' | 'bearish' | 'neutral'
export type TrendDirection = 'uptrend' | 'downtrend' | 'ranging'
export type TradeType = 'buy' | 'sell' | 'wait'
export type MomentumType = 'continuation' | 'reversal' | 'unclear'
export type MomentumStrength = 'strong' | 'moderate' | 'weak'
export type DivergenceType = 'bullish' | 'bearish' | 'none'
export type CrossoverType = 'golden' | 'death' | 'none'
export type RSIZone = 'overbought' | 'oversold' | 'bullish' | 'bearish' | 'neutral'
export type StochasticZone = 'overbought' | 'oversold' | 'neutral'
export type StochasticCrossover = 'bullish' | 'bearish' | 'none'
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'error'
export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1D'

// ─── INDICATOR TYPES ─────────────────────────────────────────

export interface MovingAverageAnalysis {
  fastAboveSlow: boolean
  priceAboveFast: boolean
  priceAboveSlow: boolean
  crossoverRecent: boolean
  crossoverType: CrossoverType
  description: string
}

export interface RSIAnalysis {
  value: number
  zone: RSIZone
  divergence: DivergenceType
  description: string
}

export interface StochasticAnalysis {
  kValue: number
  dValue: number
  zone: StochasticZone
  crossover: StochasticCrossover
  divergence: DivergenceType
  description: string
}

export interface IndicatorSet {
  movingAverages: MovingAverageAnalysis
  rsi: RSIAnalysis
  stochastic: StochasticAnalysis
}

// ─── STRUCTURE TYPES ─────────────────────────────────────────

export interface MarketStructure {
  trend: TrendDirection
  higherHighs: boolean
  lowerLows: boolean
  keyLevel: number | null
  description: string
}

export interface SupportResistance {
  nearestSupport: number | null
  nearestResistance: number | null
  keyLevels: number[]
  description: string
}

export interface MomentumAnalysis {
  type: MomentumType
  strength: MomentumStrength
  description: string
}

// ─── TRADE SETUP TYPES ───────────────────────────────────────

export interface TakeProfitLevel {
  level: number
  label: 'TP1' | 'TP2' | 'TP3'
  rationale: string
}

export interface EntryZone {
  low: number
  high: number
}

export interface TradeSetup {
  type: TradeType
  rationale: string
  entryZone: EntryZone
  stopLoss: number
  stopLossRationale: string
  takeProfits: TakeProfitLevel[]
  riskRewardRatio: number
}

// ─── CORE ANALYSIS RESULT ────────────────────────────────────

export interface AnalysisResult {
  marketBias: MarketBias
  structure: MarketStructure
  indicators: IndicatorSet
  supportResistance: SupportResistance
  momentum: MomentumAnalysis
  tradeSetup: TradeSetup
  confidence: number              // 0–100
  confidenceFactors: string[]
  reasoning: string
  invalidationConditions: string[]
  warnings: string[]
}

// ─── MULTI-TIMEFRAME TYPES ───────────────────────────────────

export interface TimeframeAnalysis {
  timeframe: Timeframe
  analysis: AnalysisResult
  imageUrl: string
}

export interface MTFConfluence {
  alignmentScore: number
  dominantBias: MarketBias | 'conflicted'
  highestTimeframeBias: string
  entryTimeframe: Timeframe
  conflictingSignals: string[]
  summary: string
}

export interface MultiTimeframeAnalysis {
  timeframes: TimeframeAnalysis[]
  confluence: MTFConfluence
  combinedSetup: TradeSetup
  analyzedAt: string
}

// ─── DATABASE RECORD TYPES ───────────────────────────────────

export interface AnalysisRecord {
  id: string
  created_at: string
  updated_at: string
  status: AnalysisStatus
  timeframe: Timeframe
  image_url: string
  image_path: string
  instrument: string | null
  result: AnalysisResult | null
  prompt_version: string
  ai_model: string
  processing_time_ms: number | null
  error_message: string | null
  user_feedback: UserFeedback | null
  session_id: string | null
}

export interface UserFeedback {
  rating: 'helpful' | 'not_helpful'
  outcome: 'tp_hit' | 'sl_hit' | 'no_trade' | 'still_open' | null
  notes: string | null
  submitted_at: string
}

// ─── API TYPES ────────────────────────────────────────────────

export interface AnalyzeRequest {
  imageBase64: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  timeframe: Timeframe
  instrument?: string
  sessionId?: string
}

export interface AnalyzeResponse {
  success: boolean
  analysisId: string
  result?: AnalysisResult
  error?: string
  processingTimeMs?: number
}

export interface UploadRequest {
  file: File
  timeframe: Timeframe
  instrument?: string
}

export interface UploadResponse {
  success: boolean
  imageUrl: string
  imagePath: string
  error?: string
}

export interface HistoryResponse {
  analyses: AnalysisRecord[]
  total: number
  page: number
  pageSize: number
}

// ─── UI STATE TYPES ───────────────────────────────────────────

export interface UploadState {
  file: File | null
  preview: string | null
  timeframe: Timeframe
  instrument: string
  isUploading: boolean
  uploadError: string | null
}

export interface AnalysisState {
  status: AnalysisStatus
  analysisId: string | null
  result: AnalysisResult | null
  error: string | null
  processingStarted: number | null
}

// ─── CONFIG TYPES ─────────────────────────────────────────────

export interface AIConfig {
  model: string
  maxTokens: number
  temperature: number
  promptVersion: string
}

export interface AppConfig {
  ai: AIConfig
  maxImageSizeBytes: number
  supportedMimeTypes: string[]
  maxHistoryItems: number
}

// ─── INDICATOR ENGINE TYPES ───────────────────────────────────

export interface IndicatorSignal {
  signal: 'bullish' | 'bearish' | 'neutral'
  strength: number  // 0–100
  description: string
}

export interface CompositeSignal {
  overall: MarketBias
  score: number  // -100 (strong bear) to +100 (strong bull)
  signals: {
    trend: IndicatorSignal
    rsi: IndicatorSignal
    stochastic: IndicatorSignal
    structure: IndicatorSignal
  }
  confidence: number
}
