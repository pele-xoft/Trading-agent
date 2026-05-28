// ── Grade types ───────────────────────────────────────────────────────────────
type TradeGrade = "A+" | "A" | "B" | "Avoid" | "WAIT";

// ── Base mock result ──────────────────────────────────────────────────────────
export function getMockAnalysis() {
  return {
    marketBias: "bullish" as const,
    structure: {
      trend: "uptrend" as const,
      higherHighs: true,
      lowerLows: false,
      keyLevel: 1.08420,
      description: "Price making consistent higher highs and higher lows — clean uptrend structure.",
    },
    indicators: {
      movingAverages: {
        fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true,
        crossoverRecent: true, crossoverType: "golden" as const,
        description: "Golden cross confirmed — fast MA above slow MA, price above both. Bullish alignment.",
      },
      rsi: { value: 62.4, zone: "bullish" as const, divergence: "none" as const, description: "RSI 62.4 — mid bullish zone, room to continue without being overbought." },
      stochastic: { kValue: 71, dValue: 65, zone: "neutral" as const, crossover: "bullish" as const, divergence: "none" as const, description: "Bullish K/D crossover from mid-range — momentum building." },
    },
    supportResistance: {
      nearestSupport: 1.08150, nearestResistance: 1.09000,
      keyLevels: [1.08150, 1.08420, 1.08750, 1.09000],
      description: "Key support at 1.08150 (recent swing low). Resistance at 1.09000 round number.",
    },
    momentum: { type: "continuation" as const, strength: "moderate" as const, description: "Continuation momentum confirmed across all indicators." },
    tradeSetup: {
      type: "buy" as const,
      rationale: "Golden cross + RSI bullish zone + Stoch bullish cross. Clean HH/HL structure confirms long bias.",
      entryZone: { low: 1.08350, high: 1.08480 },
      stopLoss: 1.08050,
      stopLossRationale: "Below recent swing low — invalidates the higher high / higher low structure.",
      takeProfits: [
        { level: 1.08750, label: "TP1", rationale: "Prior resistance / interim swing high" },
        { level: 1.09000, label: "TP2", rationale: "Round number psychological resistance" },
        { level: 1.09350, label: "TP3", rationale: "Measured move extension from swing low" },
      ],
      riskRewardRatio: 2.1,
    },
    tradeGrade: "A" as TradeGrade,
    confidence: 72,
    confidenceFactors: ["MA golden cross + RSI + Stoch all bullish", "Clean HH/HL structure", "Mid-range RSI — not overbought"],
    reasoning: "Clean bullish confluence: fresh golden cross, price above both MAs, RSI mid-bullish and Stochastic pointing up. No overbought conditions. Structure is healthy with room to the next resistance at 1.09000.",
    invalidationConditions: ["Close below 1.08050 (swing low)", "RSI drops below 50", "Death cross forms"],
    warnings: ["Demo mode — analysis is simulated"],
  };
}

// ── Per-timeframe realistic mock data ─────────────────────────────────────────
const TF_MOCKS = {
  "1D": {
    marketBias: "bullish" as const,
    structure: {
      trend: "uptrend" as const, higherHighs: true, lowerLows: false, keyLevel: 1.08200,
      description: "Strong daily uptrend — HH/HL pattern over 6 weeks. Price comfortably above both daily MAs.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none" as const, description: "Daily golden cross 3 weeks ago — still in force. Good MA separation indicating trend health." },
      rsi: { value: 58.0, zone: "bullish" as const, divergence: "none" as const, description: "RSI 58 — mid bullish zone, healthy trend momentum without being overextended." },
      stochastic: { kValue: 68, dValue: 61, zone: "neutral" as const, crossover: "bullish" as const, divergence: "none" as const, description: "Stochastic turning up from mid-range — supportive of continued bullish momentum." },
    },
    supportResistance: {
      nearestSupport: 1.07800, nearestResistance: 1.09500,
      keyLevels: [1.07800, 1.08200, 1.09000, 1.09500],
      description: "Daily support at 1.07800 (prior swing low). Resistance at 1.09500 (weekly high).",
    },
    momentum: { type: "continuation" as const, strength: "strong" as const, description: "Strong daily momentum — uptrend fully in force." },
    tradeSetup: {
      type: "buy" as const,
      rationale: "Daily trend strongly bullish — HTF direction confirmed, aligned with all indicators.",
      entryZone: { low: 1.08100, high: 1.08400 },
      stopLoss: 1.07700,
      stopLossRationale: "Below daily swing low — invalidates the daily uptrend structure.",
      takeProfits: [
        { level: 1.09000, label: "TP1", rationale: "Round number resistance" },
        { level: 1.09500, label: "TP2", rationale: "Weekly resistance zone" },
        { level: 1.10000, label: "TP3", rationale: "Psychological round number extension" },
      ],
      riskRewardRatio: 2.5,
    },
    tradeGrade: "A" as TradeGrade,
    confidence: 78,
    confidenceFactors: ["Daily trend strongly bullish", "Price above both daily MAs", "RSI mid-range — not overbought", "Clean HH/HL structure over 6 weeks"],
    reasoning: "Daily chart shows an established, healthy uptrend with no signs of exhaustion. Higher timeframe context is clearly bullish and RSI has room before overbought. This is the directional context for all lower timeframes.",
    invalidationConditions: ["Daily close below 1.07800", "Daily RSI falls below 45", "Bearish engulfing candle closes below daily MA"],
    warnings: ["Demo mode — analysis is simulated"],
  },

  "4h": {
    marketBias: "bullish" as const,
    structure: {
      trend: "uptrend" as const, higherHighs: true, lowerLows: false, keyLevel: 1.08350,
      description: "4H uptrend intact — recent healthy pullback to 4H support held exactly. HH/HL pattern continuing.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: true, crossoverType: "golden" as const, description: "Fresh 4H golden cross. Price retested the MA zone and bounced — textbook continuation signal." },
      rsi: { value: 55.2, zone: "bullish" as const, divergence: "none" as const, description: "RSI 55 — recovering from the pullback, trajectory clearly bullish." },
      stochastic: { kValue: 58, dValue: 52, zone: "neutral" as const, crossover: "bullish" as const, divergence: "none" as const, description: "Stochastic bullish crossover from mid-range — momentum building for continuation." },
    },
    supportResistance: {
      nearestSupport: 1.08150, nearestResistance: 1.08900,
      keyLevels: [1.08150, 1.08350, 1.08700, 1.08900],
      description: "4H support at 1.08150 (swing low). Next resistance cluster at 1.08900.",
    },
    momentum: { type: "continuation" as const, strength: "moderate" as const, description: "Momentum building post-pullback. 4H primed for next leg up." },
    tradeSetup: {
      type: "buy" as const,
      rationale: "4H aligned with daily trend. Fresh golden cross with MA retest bounce — quality entry signal.",
      entryZone: { low: 1.08300, high: 1.08420 },
      stopLoss: 1.08050,
      stopLossRationale: "Below 4H support and swing low — invalidates the bullish structure.",
      takeProfits: [
        { level: 1.08750, label: "TP1", rationale: "4H resistance swing high" },
        { level: 1.09000, label: "TP2", rationale: "Daily resistance round number" },
        { level: 1.09300, label: "TP3", rationale: "Extended daily target" },
      ],
      riskRewardRatio: 2.2,
    },
    tradeGrade: "A" as TradeGrade,
    confidence: 74,
    confidenceFactors: ["Aligned with daily bullish trend", "MA retest bounce — quality entry", "Stoch bullish crossover", "RSI recovering without being overbought"],
    reasoning: "4H confirms the daily bullish trend. Healthy pullback to MA zone was retested and held perfectly. Fresh golden cross with price above both MAs. This is a quality continuation setup aligned with the HTF context.",
    invalidationConditions: ["4H close below 1.08050", "Stochastic rolls over below 40", "4H death cross forms"],
    warnings: ["Demo mode — analysis is simulated"],
  },

  "1h": {
    marketBias: "neutral" as const,
    structure: {
      trend: "ranging" as const, higherHighs: false, lowerLows: false, keyLevel: 1.08420,
      description: "1H consolidating inside a tight range 1.08300–1.08520. Compression after the 4H move — breakout expected.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none" as const, description: "MAs flattening and converging inside the range. No directional crossover — market pausing." },
      rsi: { value: 51.0, zone: "neutral" as const, divergence: "none" as const, description: "RSI 51 — dead centre neutral. No directional bias on this timeframe." },
      stochastic: { kValue: 52, dValue: 50, zone: "neutral" as const, crossover: "none" as const, divergence: "none" as const, description: "Stochastic mid-range, no cross. Market waiting for a catalyst." },
    },
    supportResistance: {
      nearestSupport: 1.08300, nearestResistance: 1.08520,
      keyLevels: [1.08300, 1.08420, 1.08520],
      description: "1H range: support at 1.08300, resistance at 1.08520. Breakout of this range defines next move.",
    },
    momentum: { type: "unclear" as const, strength: "weak" as const, description: "Momentum stalling inside range — wait for breakout direction." },
    tradeSetup: {
      type: "wait" as const,
      rationale: "1H is in a tight range with no directional bias. Wait for breakout above 1.08520 (given bullish HTF context) before entering long.",
      entryZone: { low: 1.08520, high: 1.08570 },
      stopLoss: 1.08280,
      stopLossRationale: "Below range low — invalidates the bullish breakout thesis.",
      takeProfits: [{ level: 1.08750, label: "TP1", rationale: "Next 4H resistance" }],
      riskRewardRatio: 0.9,
    },
    tradeGrade: "WAIT" as TradeGrade,
    confidence: 52,
    confidenceFactors: ["HTF bullish context — bias for upside breakout", "1H consolidation after strong move — typical continuation pattern", "Range compression near resistance"],
    reasoning: "1H is consolidating post-4H bounce. Neutral on this timeframe alone, but given 1D and 4H bullish context, upside breakout is higher probability. No trade until 1.08520 is cleared with a candle close.",
    invalidationConditions: ["Breakdown below 1.08280 range low", "RSI drops below 45 inside the range"],
    warnings: ["Demo mode — analysis is simulated", "1H neutral — wait for breakout confirmation before entry"],
  },

  "15m": {
    marketBias: "bearish" as const,
    structure: {
      trend: "downtrend" as const, higherHighs: false, lowerLows: true, keyLevel: 1.08420,
      description: "15M short-term pullback. Lower highs and lower lows — short-term selling pressure within the HTF consolidation range.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: false, priceAboveSlow: false, crossoverRecent: true, crossoverType: "death" as const, description: "15M death cross. Price below both MAs — short-term sellers in control. This is a retracement signal." },
      rsi: { value: 38.5, zone: "bearish" as const, divergence: "none" as const, description: "RSI 38.5 — bearish zone, approaching oversold. 15M weakness present but nearly exhausted." },
      stochastic: { kValue: 22, dValue: 30, zone: "oversold" as const, crossover: "bearish" as const, divergence: "none" as const, description: "Stochastic entering oversold zone — a bounce from here is likely, which could be the HTF entry trigger." },
    },
    supportResistance: {
      nearestSupport: 1.08300, nearestResistance: 1.08460,
      keyLevels: [1.08300, 1.08380, 1.08460],
      description: "15M support at 1.08300 (confluence with 1H range low). Resistance at 1.08460.",
    },
    momentum: { type: "reversal" as const, strength: "moderate" as const, description: "15M bearish momentum approaching exhaustion — stochastic near oversold suggests the low is forming." },
    tradeSetup: {
      type: "wait" as const,
      rationale: "Wait for stochastic to bounce from oversold and price to reclaim 1.08380 — this signals the HTF bullish continuation entry on the 15M.",
      entryZone: { low: 1.08370, high: 1.08420 },
      stopLoss: 1.08270,
      stopLossRationale: "Below 15M and 1H support confluence.",
      takeProfits: [
        { level: 1.08520, label: "TP1", rationale: "1H range top — breakout trigger level" },
        { level: 1.08750, label: "TP2", rationale: "4H resistance target" },
        { level: 1.09000, label: "TP3", rationale: "Daily round number target" },
      ],
      riskRewardRatio: 1.8,
    },
    tradeGrade: "WAIT" as TradeGrade,
    confidence: 48,
    confidenceFactors: ["Stochastic approaching oversold — potential bounce zone", "HTF bullish — short-term pullback likely to reverse", "Price near 1H range support confluence"],
    reasoning: "15M is in a normal pullback within the HTF uptrend. Death cross and bearish RSI confirm short-term selling but stochastic nearing oversold signals the low is forming. This is the optimal entry zone for the HTF continuation once 15M reversal is confirmed.",
    invalidationConditions: ["Close below 1.08270 support", "15M RSI breaks below 30 and continues lower", "4H candle closes below 1.08150"],
    warnings: ["Demo mode — analysis is simulated", "15M bearish — wait for LTF reversal confirmation before entering"],
  },
};

export function getMockTimeframeAnalysis(timeframe: string): ReturnType<typeof getMockAnalysis> {
  return (TF_MOCKS as Record<string, ReturnType<typeof getMockAnalysis>>)[timeframe] ?? getMockAnalysis();
}

// ── Confluence computation (mock mode) ────────────────────────────────────────
export function computeMockConfluence(timeframes: string[]) {
  const TF_WEIGHTS: Record<string, number> = { "1D": 0.35, "4h": 0.25, "1h": 0.25, "15m": 0.15 };
  const HTF = ["1D", "4h"];
  const LTF = ["1h", "15m"];

  const entries = timeframes.map(tf => ({
    tf,
    data: (TF_MOCKS as Record<string, ReturnType<typeof getMockAnalysis>>)[tf] ?? getMockAnalysis(),
    weight: TF_WEIGHTS[tf] ?? 0.2,
  }));

  const biasScore = (b: string) => b === "bullish" ? 1 : b === "bearish" ? -1 : 0;

  const htfEntries = entries.filter(e => HTF.includes(e.tf));
  const ltfEntries = entries.filter(e => LTF.includes(e.tf));

  const weightedAvg = (arr: typeof entries) => {
    if (arr.length === 0) return 0;
    const totalW = arr.reduce((s, e) => s + e.weight, 0);
    return arr.reduce((s, e) => s + biasScore(e.data.marketBias) * e.weight, 0) / totalW;
  };

  const htfScore = weightedAvg(htfEntries);
  const ltfScore = weightedAvg(ltfEntries);
  const hasHtf = htfEntries.length > 0;
  const hasLtf = ltfEntries.length > 0;

  const htfDominates = hasHtf && hasLtf && Math.abs(htfScore) >= 0.3 && Math.sign(htfScore) !== Math.sign(ltfScore) && Math.sign(ltfScore) !== 0;
  const finalScore = htfDominates ? htfScore : (hasHtf && hasLtf ? htfScore * 0.6 + ltfScore * 0.4 : weightedAvg(entries));

  let overallBias: string;
  if (Math.abs(finalScore) <= 0.1) overallBias = "conflicted";
  else if (finalScore > 0.25) overallBias = "bullish";
  else if (finalScore < -0.25) overallBias = "bearish";
  else overallBias = "neutral";

  const alignmentScore = Math.min(100, Math.round(Math.abs(finalScore) * 100));

  let confluenceStrength: string;
  if (overallBias === "conflicted") confluenceStrength = "conflicted";
  else if (alignmentScore >= 75) confluenceStrength = "strong";
  else if (alignmentScore >= 50) confluenceStrength = "moderate";
  else if (alignmentScore >= 25) confluenceStrength = "weak";
  else confluenceStrength = "conflicted";

  const baseConf = Math.round(entries.reduce((s, e) => s + e.data.confidence, 0) / entries.length);
  const allAgree = entries.every(e => e.data.marketBias === overallBias);
  const agreeCount = entries.filter(e => e.data.marketBias === overallBias).length;
  const confBoost = allAgree ? 20 : agreeCount >= 3 ? 10 : overallBias === "conflicted" ? -10 : 0;
  const overallConfidence = Math.max(0, Math.min(100, baseConf + confBoost));

  const conflictingSignals: string[] = [];
  if (htfDominates) {
    const ltfBiasLabel = ltfScore > 0 ? "bullish" : "bearish";
    conflictingSignals.push(`Lower timeframes show ${ltfBiasLabel} signal — this is a retracement within the ${htfScore > 0 ? "bullish" : "bearish"} higher-timeframe trend`);
  }
  entries.filter(e => e.data.marketBias !== overallBias && overallBias !== "conflicted").forEach(e => {
    conflictingSignals.push(`${e.tf} shows ${e.data.marketBias} — diverging from the ${overallBias} consensus`);
  });

  const recommendation = overallBias === "bullish" ? (htfDominates ? "wait" : "buy") :
    overallBias === "bearish" ? (htfDominates ? "wait" : "sell") : "wait";

  const higherTimeframeBias = htfEntries.length > 0 ? (htfScore > 0 ? "bullish" : htfScore < 0 ? "bearish" : "neutral") : overallBias;
  const entryTFPreference = ["1h", "15m", "4h", "1D"];
  const entryTimeframe = entryTFPreference.find(tf => timeframes.includes(tf)) ?? timeframes[0];

  const agreeList = entries.filter(e => e.data.marketBias === overallBias).map(e => e.tf).join(", ");
  let reasoning = overallBias === "conflicted"
    ? `Timeframes are split — no clear directional bias. Wait for market to resolve before risking capital.`
    : `${agreeCount}/${entries.length} timeframes show ${overallBias} bias (${agreeList}).`;
  if (htfDominates) reasoning += ` Higher-timeframe trend is ${higherTimeframeBias} — lower-timeframe counter-move is a retracement. Wait for ${entryTimeframe} to confirm ${higherTimeframeBias} before entering.`;
  else if (allAgree) reasoning += ` All timeframes aligned — high-conviction setup.`;

  let entryCondition: string;
  if (overallBias === "conflicted") {
    entryCondition = "No trade — timeframes are genuinely split. Wait for clearer alignment before risking capital.";
  } else if (htfDominates) {
    const ltfBiasLabel = ltfScore > 0 ? "bullish" : "bearish";
    entryCondition = `${entryTimeframe} is currently ${ltfBiasLabel} (retracement). Wait for ${entryTimeframe} stochastic to exit oversold/overbought and price to reclaim the ${entryTimeframe} fast MA — that confirms the ${higherTimeframeBias} continuation entry.`;
  } else if (allAgree) {
    entryCondition = `All timeframes aligned ${overallBias}. Enter ${overallBias === "bullish" ? "long" : "short"} at the nearest ${entryTimeframe} support/resistance retest.`;
  } else {
    entryCondition = `Wait for ${entries.filter(e => e.data.marketBias !== overallBias).map(e => e.tf).join(", ")} to confirm ${overallBias} direction before entering.`;
  }

  const entryTFData = (TF_MOCKS as Record<string, ReturnType<typeof getMockAnalysis>>)[entryTimeframe] ?? getMockAnalysis();
  const finalSetup = {
    type: recommendation,
    entryZone: entryTFData.tradeSetup.entryZone,
    stopLoss: entryTFData.tradeSetup.stopLoss,
    stopLossRationale: entryTFData.tradeSetup.stopLossRationale,
    takeProfits: entryTFData.tradeSetup.takeProfits,
    riskRewardRatio: entryTFData.tradeSetup.riskRewardRatio,
    entryTimeframe,
    rationale: recommendation === "wait"
      ? `Wait for ${entryTimeframe} confirmation before entering. ${entryCondition}`
      : `Enter ${recommendation === "buy" ? "long" : "short"} at ${entryTimeframe} entry zone. Higher-timeframe bias confirms ${overallBias} direction.`,
  };

  const perTimeframe = entries.map(e => ({
    timeframe: e.tf,
    bias: e.data.marketBias,
    confidence: e.data.confidence,
    trend: e.data.structure.trend,
    rsi: e.data.indicators.rsi.value,
    recommendation: e.data.tradeSetup.type,
    aligned: e.data.marketBias === overallBias,
    isRetracement: htfDominates && LTF.includes(e.tf) && e.data.marketBias !== overallBias,
    keyLevel: e.data.structure.keyLevel,
  }));

  return {
    overallBias,
    alignmentScore,
    confluenceStrength,
    alignedCount: agreeCount,
    totalCount: entries.length,
    higherTimeframeBias,
    entryTimeframe,
    recommendation,
    reasoning,
    entryCondition,
    conflictingSignals,
    overallConfidence,
    finalSetup,
    perTimeframe,
  };
}
