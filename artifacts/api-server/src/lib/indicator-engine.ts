interface AnalysisResult {
  marketBias: string
  structure: { trend: string; higherHighs: boolean; lowerLows: boolean; description: string }
  indicators: {
    movingAverages: { fastAboveSlow: boolean; priceAboveFast: boolean; priceAboveSlow: boolean; crossoverRecent: boolean; crossoverType: string; description: string }
    rsi: { value: number; zone: string; divergence: string; description: string }
    stochastic: { zone: string; crossover: string; divergence: string; description: string }
  }
  momentum: { type: string; strength: string }
  confidence: number
}

export function computeCompositeSignal(analysis: AnalysisResult): { confidence: number } {
  const { movingAverages } = analysis.indicators
  const { rsi } = analysis.indicators
  const { stochastic } = analysis.indicators

  let trendScore = 0
  let trendDir = 0
  if (movingAverages.priceAboveFast && movingAverages.priceAboveSlow) { trendScore = 40; trendDir = 1 }
  else if (!movingAverages.priceAboveFast && !movingAverages.priceAboveSlow) { trendScore = 40; trendDir = -1 }
  if (movingAverages.fastAboveSlow) { trendScore += 30; if (trendDir === 0) trendDir = 1 }
  else { trendScore += 30; if (trendDir === 0) trendDir = -1 }
  if (movingAverages.crossoverRecent) {
    trendScore += 30
    if (movingAverages.crossoverType === 'golden') trendDir = 1
    else if (movingAverages.crossoverType === 'death') trendDir = -1
  }

  let rsiScore = 20
  let rsiDir = 0
  if (rsi.zone === 'bullish') { rsiScore = 50; rsiDir = 1 }
  else if (rsi.zone === 'bearish') { rsiScore = 50; rsiDir = -1 }
  else if (rsi.zone === 'oversold') { rsiScore = 40; rsiDir = 1 }
  else if (rsi.zone === 'overbought') { rsiScore = 40; rsiDir = -1 }
  if (rsi.divergence !== 'none') { rsiScore = Math.min(100, rsiScore + 30); rsiDir = rsi.divergence === 'bullish' ? 1 : -1 }

  let stoScore = 20
  let stoDir = 0
  if (stochastic.zone === 'oversold') { stoScore = 45; stoDir = 1 }
  else if (stochastic.zone === 'overbought') { stoScore = 45; stoDir = -1 }
  if (stochastic.crossover === 'bullish') { stoScore = Math.min(100, stoScore + 35); stoDir = 1 }
  else if (stochastic.crossover === 'bearish') { stoScore = Math.min(100, stoScore + 35); stoDir = -1 }

  let strScore = 0
  let strDir = 0
  if (analysis.structure.trend === 'uptrend') { strScore = 50; strDir = 1 }
  else if (analysis.structure.trend === 'downtrend') { strScore = 50; strDir = -1 }
  if (analysis.structure.higherHighs && !analysis.structure.lowerLows) { strScore += 30; strDir = 1 }
  else if (analysis.structure.lowerLows && !analysis.structure.higherHighs) { strScore += 30; strDir = -1 }

  const score =
    trendScore * trendDir * 0.35 +
    rsiScore * rsiDir * 0.25 +
    stoScore * stoDir * 0.20 +
    strScore * strDir * 0.20

  const confidence = Math.round(Math.abs(score))
  return { confidence }
}

export function blendConfidence(aiConfidence: number, ruleConfidence: number): number {
  const blended = aiConfidence * 0.7 + ruleConfidence * 0.3
  return Math.round(Math.max(0, Math.min(100, blended)))
}
