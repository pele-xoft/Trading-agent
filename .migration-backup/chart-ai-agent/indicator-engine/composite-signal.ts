// ============================================================
// COMPOSITE SIGNAL ENGINE
// Rule-based indicator interpretation layer
// Runs on top of AI output for structural validation
// ============================================================

import type {
  AnalysisResult,
  CompositeSignal,
  IndicatorSignal,
  MarketBias,
} from '@/types'

// ─── MAIN FUNCTION ────────────────────────────────────────────

export function computeCompositeSignal(analysis: AnalysisResult): CompositeSignal {
  const trendSignal = scoreTrend(analysis)
  const rsiSignal = scoreRSI(analysis)
  const stochasticSignal = scoreStochastic(analysis)
  const structureSignal = scoreStructure(analysis)

  // Weighted composite score (-100 to +100)
  const score =
    trendSignal.strength * (trendSignal.signal === 'bullish' ? 1 : trendSignal.signal === 'bearish' ? -1 : 0) * 0.35 +
    rsiSignal.strength * (rsiSignal.signal === 'bullish' ? 1 : rsiSignal.signal === 'bearish' ? -1 : 0) * 0.25 +
    stochasticSignal.strength * (stochasticSignal.signal === 'bullish' ? 1 : stochasticSignal.signal === 'bearish' ? -1 : 0) * 0.20 +
    structureSignal.strength * (structureSignal.signal === 'bullish' ? 1 : structureSignal.signal === 'bearish' ? -1 : 0) * 0.20

  const overall: MarketBias = score > 20 ? 'bullish' : score < -20 ? 'bearish' : 'neutral'
  const confidence = Math.round(Math.abs(score))

  return {
    overall,
    score: Math.round(score),
    signals: {
      trend: trendSignal,
      rsi: rsiSignal,
      stochastic: stochasticSignal,
      structure: structureSignal,
    },
    confidence,
  }
}

// ─── INDIVIDUAL SIGNAL SCORERS ────────────────────────────────

function scoreTrend(analysis: AnalysisResult): IndicatorSignal {
  const { movingAverages } = analysis.indicators
  let strength = 0
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'

  // Price above/below both MAs
  if (movingAverages.priceAboveFast && movingAverages.priceAboveSlow) {
    strength += 40
    signal = 'bullish'
  } else if (!movingAverages.priceAboveFast && !movingAverages.priceAboveSlow) {
    strength += 40
    signal = 'bearish'
  }

  // MA alignment
  if (movingAverages.fastAboveSlow) {
    strength += 30
    if (signal === 'neutral') signal = 'bullish'
  } else {
    strength += 30
    if (signal === 'neutral') signal = 'bearish'
  }

  // Recent crossover bonus
  if (movingAverages.crossoverRecent) {
    if (movingAverages.crossoverType === 'golden') {
      strength += 30
      signal = 'bullish'
    } else if (movingAverages.crossoverType === 'death') {
      strength += 30
      signal = 'bearish'
    }
  }

  return {
    signal,
    strength: Math.min(100, strength),
    description: movingAverages.description,
  }
}

function scoreRSI(analysis: AnalysisResult): IndicatorSignal {
  const { rsi } = analysis.indicators
  let strength = 0
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'

  // Zone scoring
  switch (rsi.zone) {
    case 'bullish':
      signal = 'bullish'; strength = 50; break
    case 'bearish':
      signal = 'bearish'; strength = 50; break
    case 'overbought':
      signal = 'bearish'; strength = 40; break  // Watch for reversal
    case 'oversold':
      signal = 'bullish'; strength = 40; break  // Watch for bounce
    default:
      signal = 'neutral'; strength = 20; break
  }

  // Precise value scoring
  if (rsi.value > 60 && rsi.value < 70) {
    signal = 'bullish'; strength = Math.max(strength, 60)
  } else if (rsi.value > 40 && rsi.value < 50) {
    signal = 'bearish'; strength = Math.max(strength, 55)
  }

  // Divergence bonus
  if (rsi.divergence !== 'none') {
    strength = Math.min(100, strength + 30)
    signal = rsi.divergence === 'bullish' ? 'bullish' : 'bearish'
  }

  return {
    signal,
    strength: Math.min(100, strength),
    description: rsi.description,
  }
}

function scoreStochastic(analysis: AnalysisResult): IndicatorSignal {
  const { stochastic } = analysis.indicators
  let strength = 0
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'

  // Zone scoring
  switch (stochastic.zone) {
    case 'oversold':
      signal = 'bullish'; strength = 45; break
    case 'overbought':
      signal = 'bearish'; strength = 45; break
    default:
      strength = 20; break
  }

  // Crossover
  if (stochastic.crossover === 'bullish') {
    signal = 'bullish'
    strength = Math.min(100, strength + 35)
  } else if (stochastic.crossover === 'bearish') {
    signal = 'bearish'
    strength = Math.min(100, strength + 35)
  }

  // Divergence
  if (stochastic.divergence !== 'none') {
    strength = Math.min(100, strength + 25)
    signal = stochastic.divergence === 'bullish' ? 'bullish' : 'bearish'
  }

  return {
    signal,
    strength: Math.min(100, strength),
    description: stochastic.description,
  }
}

function scoreStructure(analysis: AnalysisResult): IndicatorSignal {
  const { structure, momentum } = analysis

  let strength = 0
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'

  // Trend structure
  if (structure.trend === 'uptrend') {
    signal = 'bullish'
    strength += 50
  } else if (structure.trend === 'downtrend') {
    signal = 'bearish'
    strength += 50
  }

  // HH/LL confirmation
  if (structure.higherHighs && !structure.lowerLows) {
    signal = 'bullish'
    strength += 30
  } else if (structure.lowerLows && !structure.higherHighs) {
    signal = 'bearish'
    strength += 30
  }

  // Momentum
  if (momentum.type === 'continuation') {
    const momentumBonus = momentum.strength === 'strong' ? 20 : momentum.strength === 'moderate' ? 10 : 5
    strength += momentumBonus
  } else if (momentum.type === 'reversal') {
    // Reversal flips the signal
    signal = signal === 'bullish' ? 'bearish' : signal === 'bearish' ? 'bullish' : 'neutral'
    strength += 15
  }

  return {
    signal,
    strength: Math.min(100, strength),
    description: structure.description,
  }
}
