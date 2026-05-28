export type MarketRegime = "trending" | "ranging" | "volatile" | "choppy";
export type TradeGrade = "A+" | "A" | "B" | "C" | "avoid" | "WAIT";

// ── Shared input type ─────────────────────────────────────────────────────────
export interface AnalysisInput {
  marketBias: string;
  structure: { trend: string; higherHighs: boolean; lowerLows: boolean };
  indicators: {
    movingAverages: {
      fastAboveSlow: boolean;
      priceAboveFast: boolean;
      priceAboveSlow: boolean;
      crossoverRecent: boolean;
      crossoverType: string;
    };
    rsi: { value: number; zone: string; divergence: string };
    stochastic: { kValue?: number; dValue?: number; zone: string; crossover: string; divergence: string };
  };
  momentum: { type: string; strength: string };
  tradeSetup?: { type: string; riskRewardRatio?: number };
  confidence: number;
}

// ── Market regime detection ───────────────────────────────────────────────────
export function detectMarketRegime(analysis: AnalysisInput): MarketRegime {
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;
  const { structure } = analysis;
  const rsiVal = rsi.value;
  const kVal = sto.kValue ?? 50;

  if (rsiVal > 78 || rsiVal < 22 || kVal > 88 || kVal < 12) return "volatile";

  const clearTrend = structure.trend === "uptrend" || structure.trend === "downtrend";
  const maAligned =
    (ma.fastAboveSlow && ma.priceAboveFast && ma.priceAboveSlow) ||
    (!ma.fastAboveSlow && !ma.priceAboveFast && !ma.priceAboveSlow);
  if (clearTrend && maAligned) return "trending";

  if (structure.trend === "ranging") return "ranging";
  if (!ma.fastAboveSlow && ma.priceAboveFast && !ma.priceAboveSlow) return "choppy";
  if (clearTrend && !maAligned) return "choppy";

  return "ranging";
}

// ── Signal alignment score (0–100) ────────────────────────────────────────────
export function computeAlignmentScore(analysis: AnalysisInput, tradeType: "buy" | "sell" | "wait"): number {
  if (tradeType === "wait") return 0;
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;
  const { structure } = analysis;
  const isBuy = tradeType === "buy";
  let score = 0;

  // Structure — 35 pts
  if (isBuy && structure.trend === "uptrend") score += 20;
  if (!isBuy && structure.trend === "downtrend") score += 20;
  if (isBuy && structure.higherHighs && !structure.lowerLows) score += 15;
  if (!isBuy && structure.lowerLows && !structure.higherHighs) score += 15;

  // Moving averages — 30 pts
  if (isBuy && ma.fastAboveSlow) score += 12;
  if (!isBuy && !ma.fastAboveSlow) score += 12;
  if (isBuy && ma.priceAboveFast) score += 10;
  if (!isBuy && !ma.priceAboveFast) score += 10;
  if (isBuy && ma.crossoverType === "golden") score += 8;
  if (!isBuy && ma.crossoverType === "death") score += 8;

  // RSI — 20 pts
  if (isBuy && (rsi.zone === "bullish" || rsi.zone === "oversold")) score += 14;
  if (!isBuy && (rsi.zone === "bearish" || rsi.zone === "overbought")) score += 14;
  if (isBuy && rsi.divergence === "bullish") score += 6;
  if (!isBuy && rsi.divergence === "bearish") score += 6;

  // Stochastic — 15 pts
  if (isBuy && (sto.zone === "oversold" || sto.crossover === "bullish")) score += 10;
  if (!isBuy && (sto.zone === "overbought" || sto.crossover === "bearish")) score += 10;
  if (isBuy && sto.divergence === "bullish") score += 5;
  if (!isBuy && sto.divergence === "bearish") score += 5;

  return Math.round(Math.min(100, score));
}

// ── Contradiction detector ────────────────────────────────────────────────────
export function detectContradictions(analysis: AnalysisInput): string[] {
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;
  const { structure, marketBias } = analysis;
  const contradictions: string[] = [];

  if (marketBias === "bullish" && structure.trend === "downtrend")
    contradictions.push("Bullish bias conflicts with bearish price structure (lower highs/lows)");
  if (marketBias === "bearish" && structure.trend === "uptrend")
    contradictions.push("Bearish bias conflicts with bullish price structure (higher highs/lows)");
  if (ma.fastAboveSlow && rsi.zone === "bearish" && rsi.value < 42)
    contradictions.push("MAs show bullish alignment but RSI momentum is bearish — divergence present");
  if (!ma.fastAboveSlow && rsi.zone === "bullish" && rsi.value > 58)
    contradictions.push("MAs show bearish alignment but RSI momentum is bullish — divergence present");
  if (rsi.zone === "overbought" && sto.zone === "oversold")
    contradictions.push("RSI overbought vs stochastic oversold — oscillators contradicting each other");
  if (rsi.zone === "oversold" && sto.zone === "overbought")
    contradictions.push("RSI oversold vs stochastic overbought — oscillators contradicting each other");
  if (structure.trend === "uptrend" && structure.lowerLows)
    contradictions.push("Classified as uptrend but lower lows present — structure weakening");
  if (structure.trend === "downtrend" && structure.higherHighs)
    contradictions.push("Classified as downtrend but higher highs present — structure weakening");

  return contradictions;
}

// ── Composite confidence (rule-based) ────────────────────────────────────────
export function computeCompositeSignal(analysis: AnalysisInput): { confidence: number } {
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;

  // ─── MA Trend (35% weight) ───────────────────────────────────────────────
  let maScore = 0;
  let maDir = 0;

  if (ma.priceAboveFast && ma.priceAboveSlow) {
    maScore += 40; maDir = 1;
  } else if (!ma.priceAboveFast && !ma.priceAboveSlow) {
    maScore += 40; maDir = -1;
  } else {
    maScore += 10;
  }

  if (ma.fastAboveSlow) {
    maScore += 30; if (maDir === 0) maDir = 1;
  } else {
    maScore += 30; if (maDir === 0) maDir = -1;
  }

  if (maDir === 0) maDir = ma.fastAboveSlow ? 1 : -1;

  if (ma.crossoverRecent) {
    maScore += 30;
    if (ma.crossoverType === "golden") maDir = 1;
    else if (ma.crossoverType === "death") maDir = -1;
  }

  // ─── RSI (25% weight) ────────────────────────────────────────────────────
  let rsiScore = 20;
  let rsiDir = 0;
  if (rsi.zone === "bullish")     { rsiScore = 55; rsiDir = 1; }
  else if (rsi.zone === "bearish")    { rsiScore = 55; rsiDir = -1; }
  else if (rsi.zone === "oversold")   { rsiScore = 45; rsiDir = 1; }
  else if (rsi.zone === "overbought") { rsiScore = 45; rsiDir = -1; }
  else { rsiScore = 20; rsiDir = maDir; }

  if (rsi.divergence !== "none") {
    rsiScore = Math.min(100, rsiScore + 30);
    rsiDir = rsi.divergence === "bullish" ? 1 : -1;
  }

  // ─── Stochastic (20% weight) ─────────────────────────────────────────────
  let stoScore = 20;
  let stoDir = maDir;
  if (sto.zone === "oversold")      { stoScore = 45; stoDir = 1; }
  else if (sto.zone === "overbought") { stoScore = 45; stoDir = -1; }

  if (sto.crossover === "bullish")      { stoScore = Math.min(100, stoScore + 35); stoDir = 1; }
  else if (sto.crossover === "bearish") { stoScore = Math.min(100, stoScore + 35); stoDir = -1; }

  if (sto.divergence !== "none") {
    stoScore = Math.min(100, stoScore + 20);
    stoDir = sto.divergence === "bullish" ? 1 : -1;
  }

  // ─── Market Structure (20% weight) ───────────────────────────────────────
  let strScore = 0;
  let strDir = 0;
  if (analysis.structure.trend === "uptrend")   { strScore = 50; strDir = 1; }
  else if (analysis.structure.trend === "downtrend") { strScore = 50; strDir = -1; }

  if (analysis.structure.higherHighs && !analysis.structure.lowerLows)  { strScore += 30; strDir = 1; }
  else if (analysis.structure.lowerLows && !analysis.structure.higherHighs) { strScore += 30; strDir = -1; }

  if (strDir === 0) strDir = maDir;

  // ─── Weighted composite ───────────────────────────────────────────────────
  const composite =
    maScore  * maDir  * 0.35 +
    rsiScore * rsiDir * 0.25 +
    stoScore * stoDir * 0.20 +
    strScore * strDir * 0.20;

  return { confidence: Math.round(Math.min(85, Math.abs(composite))) };
}

// ── Confidence blending (65% AI / 35% rule-based, capped at 85) ──────────────
export function blendConfidence(aiConfidence: number, ruleConfidence: number): number {
  const blended = aiConfidence * 0.65 + ruleConfidence * 0.35;
  return Math.round(Math.max(0, Math.min(85, blended)));
}

// ── Trade grade ───────────────────────────────────────────────────────────────
export function computeTradeGrade(
  confidence: number,
  setupType: string,
  riskRewardRatio: number,
  momentumStrength: string,
  indicatorAlignmentCount: number,
): TradeGrade {
  if (setupType === "wait") return "WAIT";
  if (confidence < 40 || riskRewardRatio < 1.0) return "avoid";

  if (confidence >= 75 && riskRewardRatio >= 2.5 && indicatorAlignmentCount >= 4) return "A+";
  if (confidence >= 65 && riskRewardRatio >= 2.0 && indicatorAlignmentCount >= 3) return "A";
  if (confidence >= 52 && riskRewardRatio >= 1.5) return "B";
  if (confidence >= 40 && riskRewardRatio >= 1.0) return "C";
  return "avoid";
}

// ── Count aligned indicators ──────────────────────────────────────────────────
export function countAlignedIndicators(analysis: AnalysisInput): number {
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;
  const isLong = analysis.marketBias === "bullish";
  let count = 0;

  if (isLong) {
    if (ma.priceAboveFast && ma.priceAboveSlow) count++;
    if (ma.fastAboveSlow || ma.crossoverType === "golden") count++;
    if (rsi.zone === "bullish" || rsi.zone === "oversold" || rsi.divergence === "bullish") count++;
    if (sto.zone === "oversold" || sto.crossover === "bullish") count++;
    if (analysis.structure.trend === "uptrend" && analysis.structure.higherHighs) count++;
  } else {
    if (!ma.priceAboveFast && !ma.priceAboveSlow) count++;
    if (!ma.fastAboveSlow || ma.crossoverType === "death") count++;
    if (rsi.zone === "bearish" || rsi.zone === "overbought" || rsi.divergence === "bearish") count++;
    if (sto.zone === "overbought" || sto.crossover === "bearish") count++;
    if (analysis.structure.trend === "downtrend" && analysis.structure.lowerLows) count++;
  }

  return count;
}
