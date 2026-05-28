export type MarketRegime = "trending" | "ranging" | "volatile" | "choppy";

interface MAData {
  fastAboveSlow: boolean;
  priceAboveFast: boolean;
  priceAboveSlow: boolean;
  crossoverRecent: boolean;
  crossoverType: string;
}
interface RsiData { value: number; zone: string; divergence: string }
interface StoData { kValue?: number; dValue?: number; zone: string; crossover: string; divergence: string }
interface StructureData { trend: string; higherHighs: boolean; lowerLows: boolean }

interface AnalysisInput {
  marketBias: string;
  structure: StructureData;
  indicators: { movingAverages: MAData; rsi: RsiData; stochastic: StoData };
  momentum: { type: string; strength: string };
  confidence: number;
}

// ── Market regime detection ───────────────────────────────────────────────────
export function detectMarketRegime(analysis: AnalysisInput): MarketRegime {
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;
  const { structure } = analysis;
  const rsiVal = rsi.value;
  const kVal = sto.kValue ?? 50;

  // Volatile: extreme oscillator readings
  if (rsiVal > 78 || rsiVal < 22 || kVal > 88 || kVal < 12) return "volatile";

  // Trending: clear directional structure + MAs aligned
  const clearTrend = structure.trend === "uptrend" || structure.trend === "downtrend";
  const maAligned =
    (ma.fastAboveSlow && ma.priceAboveFast && ma.priceAboveSlow) ||
    (!ma.fastAboveSlow && !ma.priceAboveFast && !ma.priceAboveSlow);
  if (clearTrend && maAligned) return "trending";

  // Ranging: explicit ranging structure or flat MAs
  if (structure.trend === "ranging") return "ranging";
  if (!ma.fastAboveSlow && ma.priceAboveFast && !ma.priceAboveSlow) return "choppy";
  if (clearTrend && !maAligned) return "choppy";

  return "ranging";
}

// ── Signal alignment score (0-100) ───────────────────────────────────────────
export function computeAlignmentScore(analysis: AnalysisInput, tradeType: "buy" | "sell" | "wait"): number {
  if (tradeType === "wait") return 0;
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;
  const { structure } = analysis;
  const isBuy = tradeType === "buy";
  let score = 0;
  const max = 100;

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

  return Math.round(Math.min(max, (score / max) * 100));
}

// ── Contradiction detector ────────────────────────────────────────────────────
export function detectContradictions(analysis: AnalysisInput): string[] {
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;
  const { structure, marketBias } = analysis;
  const contradictions: string[] = [];

  if (marketBias === "bullish" && structure.trend === "downtrend") {
    contradictions.push("Bullish bias conflicts with bearish price structure (lower highs/lows)");
  }
  if (marketBias === "bearish" && structure.trend === "uptrend") {
    contradictions.push("Bearish bias conflicts with bullish price structure (higher highs/lows)");
  }
  if (ma.fastAboveSlow && rsi.zone === "bearish" && rsi.value < 42) {
    contradictions.push("MAs show bullish alignment but RSI momentum is bearish — divergence present");
  }
  if (!ma.fastAboveSlow && rsi.zone === "bullish" && rsi.value > 58) {
    contradictions.push("MAs show bearish alignment but RSI momentum is bullish — divergence present");
  }
  if (rsi.zone === "overbought" && sto.zone === "oversold") {
    contradictions.push("RSI overbought vs stochastic oversold — oscillators contradicting each other");
  }
  if (rsi.zone === "oversold" && sto.zone === "overbought") {
    contradictions.push("RSI oversold vs stochastic overbought — oscillators contradicting each other");
  }
  if (structure.trend === "uptrend" && structure.lowerLows) {
    contradictions.push("Classified as uptrend but lower lows present — structure weakening");
  }
  if (structure.trend === "downtrend" && structure.higherHighs) {
    contradictions.push("Classified as downtrend but higher highs present — structure weakening");
  }
  return contradictions;
}

// ── Composite confidence (rule-based) ────────────────────────────────────────
export function computeCompositeSignal(analysis: AnalysisInput): { confidence: number } {
  const { movingAverages: ma, rsi, stochastic: sto } = analysis.indicators;

  let trendScore = 0, trendDir = 0;
  if (ma.priceAboveFast && ma.priceAboveSlow) { trendScore = 40; trendDir = 1; }
  else if (!ma.priceAboveFast && !ma.priceAboveSlow) { trendScore = 40; trendDir = -1; }
  if (ma.fastAboveSlow) { trendScore += 30; if (trendDir === 0) trendDir = 1; }
  else { trendScore += 30; if (trendDir === 0) trendDir = -1; }
  if (ma.crossoverRecent) {
    trendScore += 30;
    if (ma.crossoverType === "golden") trendDir = 1;
    else if (ma.crossoverType === "death") trendDir = -1;
  }

  let rsiScore = 20, rsiDir = 0;
  if (rsi.zone === "bullish") { rsiScore = 50; rsiDir = 1; }
  else if (rsi.zone === "bearish") { rsiScore = 50; rsiDir = -1; }
  else if (rsi.zone === "oversold") { rsiScore = 40; rsiDir = 1; }
  else if (rsi.zone === "overbought") { rsiScore = 40; rsiDir = -1; }
  if (rsi.divergence !== "none") {
    rsiScore = Math.min(100, rsiScore + 30);
    rsiDir = rsi.divergence === "bullish" ? 1 : -1;
  }

  let stoScore = 20, stoDir = 0;
  if (sto.zone === "oversold") { stoScore = 45; stoDir = 1; }
  else if (sto.zone === "overbought") { stoScore = 45; stoDir = -1; }
  if (sto.crossover === "bullish") { stoScore = Math.min(100, stoScore + 35); stoDir = 1; }
  else if (sto.crossover === "bearish") { stoScore = Math.min(100, stoScore + 35); stoDir = -1; }

  const strData = analysis.structure;
  let strScore = 0, strDir = 0;
  if (strData.trend === "uptrend") { strScore = 50; strDir = 1; }
  else if (strData.trend === "downtrend") { strScore = 50; strDir = -1; }
  if (strData.higherHighs && !strData.lowerLows) { strScore += 30; strDir = 1; }
  else if (strData.lowerLows && !strData.higherHighs) { strScore += 30; strDir = -1; }

  const score =
    trendScore * trendDir * 0.35 +
    rsiScore * rsiDir * 0.25 +
    stoScore * stoDir * 0.20 +
    strScore * strDir * 0.20;

  return { confidence: Math.round(Math.abs(score)) };
}

export function blendConfidence(aiConfidence: number, ruleConfidence: number): number {
  return Math.round(Math.max(0, Math.min(100, aiConfidence * 0.7 + ruleConfidence * 0.3)));
}
