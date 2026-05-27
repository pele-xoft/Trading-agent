export function getMockAnalysis() {
  return {
    marketBias: "bullish",
    structure: {
      trend: "uptrend",
      higherHighs: true,
      lowerLows: false,
      keyLevel: 1.08420,
      description: "Price is making consistent higher highs and higher lows, confirming a clean uptrend structure.",
    },
    indicators: {
      movingAverages: {
        fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true,
        crossoverRecent: true, crossoverType: "golden",
        description: "Golden cross confirmed — fast MA crossed above slow MA three candles ago.",
      },
      rsi: { value: 62.4, zone: "bullish", divergence: "none", description: "RSI at 62.4 — bullish zone, room to run." },
      stochastic: { kValue: 71, dValue: 65, zone: "neutral", crossover: "bullish", divergence: "none", description: "Bullish crossover from neutral zone." },
    },
    supportResistance: {
      nearestSupport: 1.08150, nearestResistance: 1.09000,
      keyLevels: [1.08150, 1.08420, 1.08750, 1.09000],
      description: "Support at 1.08150, resistance at 1.09000.",
    },
    momentum: { type: "continuation", strength: "moderate", description: "Continuation momentum across all indicators." },
    tradeSetup: {
      type: "buy",
      rationale: "Golden cross + RSI bullish + Stochastic confirming. HH/HL structure intact.",
      entryZone: { low: 1.08350, high: 1.08480 },
      stopLoss: 1.08050,
      stopLossRationale: "Below recent swing low — invalidates HH/HL structure.",
      takeProfits: [
        { level: 1.08750, label: "TP1", rationale: "Prior resistance" },
        { level: 1.09000, label: "TP2", rationale: "Round number" },
        { level: 1.09350, label: "TP3", rationale: "Measured move extension" },
      ],
      riskRewardRatio: 2.1,
    },
    confidence: 72,
    confidenceFactors: ["MA + RSI + Stochastic all bullish", "Clean HH/HL structure", "Fresh golden cross"],
    reasoning: "Clean bullish alignment: fresh golden cross, price above both MAs, RSI and Stochastic mid-range and pointing up.",
    invalidationConditions: ["Close below 1.08050", "RSI drops below 50", "Death cross forms"],
    warnings: ["Mock analysis — demo mode"],
  };
}

// Per-timeframe mock data — realistic differentiation
const TF_MOCKS: Record<string, ReturnType<typeof getMockAnalysis>> = {
  "1D": {
    marketBias: "bullish",
    structure: { trend: "uptrend", higherHighs: true, lowerLows: false, keyLevel: 1.08200, description: "Strong daily uptrend — HH/HL over 6 weeks. Price comfortably above both daily MAs." },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none", description: "Golden cross 3 weeks ago — still in force. Good separation between fast and slow MA." },
      rsi: { value: 58.0, zone: "bullish", divergence: "none", description: "RSI 58 — mid-bullish, room to continue." },
      stochastic: { kValue: 68, dValue: 61, zone: "neutral", crossover: "bullish", divergence: "none", description: "Stochastic turning up from mid-range." },
    },
    supportResistance: { nearestSupport: 1.07800, nearestResistance: 1.09500, keyLevels: [1.07800, 1.08200, 1.09000, 1.09500], description: "Daily support 1.07800. Resistance at weekly high 1.09500." },
    momentum: { type: "continuation", strength: "strong", description: "Strong daily momentum in full effect." },
    tradeSetup: { type: "buy", rationale: "Daily trend bullish — higher TF direction confirmed.", entryZone: { low: 1.08100, high: 1.08400 }, stopLoss: 1.07700, stopLossRationale: "Below daily swing low.", takeProfits: [{ level: 1.09000, label: "TP1", rationale: "Round number" }, { level: 1.09500, label: "TP2", rationale: "Weekly resistance" }], riskRewardRatio: 2.5 },
    confidence: 78,
    confidenceFactors: ["Daily trend strongly bullish", "Price above both daily MAs", "RSI mid-range — not overbought"],
    reasoning: "Daily chart shows an established, healthy uptrend. Higher timeframe context is clearly bullish.",
    invalidationConditions: ["Daily close below 1.07800", "Daily RSI drops below 45"],
    warnings: ["Mock analysis — demo mode"],
  },
  "4h": {
    marketBias: "bullish",
    structure: { trend: "uptrend", higherHighs: true, lowerLows: false, keyLevel: 1.08350, description: "4H uptrend intact — recent pullback to 4H support held perfectly. HH/HL pattern continuing." },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: true, crossoverType: "golden", description: "Fresh 4H golden cross. Price retested MA zone and bounced — textbook signal." },
      rsi: { value: 55.2, zone: "bullish", divergence: "none", description: "RSI 55 recovering from pullback — trajectory bullish." },
      stochastic: { kValue: 58, dValue: 52, zone: "neutral", crossover: "bullish", divergence: "none", description: "Stochastic crossed bullish from mid-range." },
    },
    supportResistance: { nearestSupport: 1.08150, nearestResistance: 1.08900, keyLevels: [1.08150, 1.08350, 1.08700, 1.08900], description: "4H support 1.08150. Next resistance 1.08900." },
    momentum: { type: "continuation", strength: "moderate", description: "Momentum building post-pullback. 4H primed for continuation." },
    tradeSetup: { type: "buy", rationale: "4H aligned with daily. Fresh golden cross with MA retest bounce.", entryZone: { low: 1.08300, high: 1.08420 }, stopLoss: 1.08050, stopLossRationale: "Below 4H support.", takeProfits: [{ level: 1.08750, label: "TP1", rationale: "4H resistance" }, { level: 1.09000, label: "TP2", rationale: "Daily resistance" }], riskRewardRatio: 2.2 },
    confidence: 74,
    confidenceFactors: ["Aligned with daily bullish trend", "MA retest bounce — quality entry signal", "Stochastic bullish cross"],
    reasoning: "4H confirms daily bullish trend. Healthy pullback to MA zone retested and held. Fresh golden cross presents a continuation setup.",
    invalidationConditions: ["4H close below 1.08050", "Stochastic rolls below 50"],
    warnings: ["Mock analysis — demo mode"],
  },
  "1h": {
    marketBias: "neutral",
    structure: { trend: "sideways", higherHighs: false, lowerLows: false, keyLevel: 1.08420, description: "1H consolidating inside a tight range 1.08300–1.08520. Price compressing — awaiting breakout direction." },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none", description: "MAs flattening inside the range. No directional crossover." },
      rsi: { value: 51.0, zone: "neutral", divergence: "none", description: "RSI 51 — dead centre, no bias." },
      stochastic: { kValue: 52, dValue: 50, zone: "neutral", crossover: "none", divergence: "none", description: "Stochastic mid-range, no cross. Waiting." },
    },
    supportResistance: { nearestSupport: 1.08300, nearestResistance: 1.08520, keyLevels: [1.08300, 1.08420, 1.08520], description: "Tight 1H range. Support 1.08300, resistance 1.08520." },
    momentum: { type: "consolidation", strength: "weak", description: "Momentum stalling inside range — breakout imminent." },
    tradeSetup: { type: "wait", rationale: "Wait for breakout above 1.08520 before entering long — given HTF bullish context.", entryZone: { low: 1.08520, high: 1.08560 }, stopLoss: 1.08280, stopLossRationale: "Below range low.", takeProfits: [{ level: 1.08750, label: "TP1", rationale: "Next resistance" }], riskRewardRatio: 0.9 },
    confidence: 52,
    confidenceFactors: ["HTF trend bullish — bias for upside breakout", "Consolidation after strong move — typical continuation"],
    reasoning: "1H is consolidating post-4H bounce. Neutral on this TF alone but given 1D and 4H context, upside breakout is higher probability.",
    invalidationConditions: ["Break below 1.08280 range low", "RSI drops below 45"],
    warnings: ["Mock analysis — demo mode", "1H neutral — confirmation needed before entry"],
  },
  "15m": {
    marketBias: "bearish",
    structure: { trend: "downtrend", higherHighs: false, lowerLows: true, keyLevel: 1.08420, description: "15M short-term pullback. Lower highs and lower lows — short-term bearish pressure within the HTF consolidation." },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: false, priceAboveSlow: false, crossoverRecent: true, crossoverType: "death", description: "15M death cross. Price below both MAs — short-term sellers in control." },
      rsi: { value: 38.5, zone: "bearish", divergence: "none", description: "RSI 38.5 — approaching oversold. 15M weakness present." },
      stochastic: { kValue: 22, dValue: 30, zone: "oversold", crossover: "bearish", divergence: "none", description: "Stochastic entering oversold. Bounce likely — which may provide the entry trigger." },
    },
    supportResistance: { nearestSupport: 1.08300, nearestResistance: 1.08460, keyLevels: [1.08300, 1.08380, 1.08460], description: "15M support at 1.08300. Resistance at 1.08460." },
    momentum: { type: "reversal", strength: "moderate", description: "15M bearish but approaching oversold — reversal from support likely." },
    tradeSetup: { type: "wait", rationale: "Wait for stochastic to bounce from oversold and reclaim 1.08380 — that signals the HTF continuation entry.", entryZone: { low: 1.08370, high: 1.08420 }, stopLoss: 1.08270, stopLossRationale: "Below 15M and 1H support.", takeProfits: [{ level: 1.08520, label: "TP1", rationale: "1H range top" }, { level: 1.08750, label: "TP2", rationale: "4H target" }, { level: 1.09000, label: "TP3", rationale: "Daily target" }], riskRewardRatio: 1.8 },
    confidence: 48,
    confidenceFactors: ["Stochastic approaching oversold — potential bounce zone", "HTF bullish — pullback likely to reverse"],
    reasoning: "15M is in a normal pullback within the HTF uptrend. Death cross and bearish RSI confirm short-term selling but stochastic nearing oversold suggests the low is close. This is the entry zone for the HTF continuation.",
    invalidationConditions: ["Break below 1.08270", "15M RSI breaks below 30 with no recovery"],
    warnings: ["Mock analysis — demo mode", "15M bearish — wait for LTF reversal signal before entering"],
  },
};

export function getMockTimeframeAnalysis(timeframe: string): ReturnType<typeof getMockAnalysis> {
  return TF_MOCKS[timeframe] ?? getMockAnalysis();
}

export function computeMockConfluence(timeframes: string[]) {
  const TF_WEIGHTS: Record<string, number> = { "1D": 0.35, "4h": 0.25, "1h": 0.25, "15m": 0.15 };
  const HTF = ["1D", "4h"];
  const LTF = ["1h", "15m"];

  const entries = timeframes.map(tf => ({
    tf,
    data: TF_MOCKS[tf] ?? getMockAnalysis(),
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

  // HTF dominates when both available and diverging
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

  // Confidence
  const baseConf = Math.round(entries.reduce((s, e) => s + e.data.confidence, 0) / entries.length);
  const allAgree = entries.every(e => e.data.marketBias === (entries[0].data.marketBias));
  const agreeCount = entries.filter(e => e.data.marketBias === overallBias).length;
  const confBoost = allAgree ? 20 : agreeCount >= 3 ? 10 : overallBias === "conflicted" ? -10 : 0;
  const overallConfidence = Math.max(0, Math.min(100, baseConf + confBoost));

  // Conflict signals
  const conflictingSignals: string[] = [];
  if (htfDominates) {
    const ltfBiasLabel = ltfScore > 0 ? "bullish" : "bearish";
    conflictingSignals.push(`Lower timeframes show ${ltfBiasLabel} signal — this is a retracement within the ${htfScore > 0 ? "bullish" : "bearish"} higher-timeframe trend`);
  }
  entries.filter(e => e.data.marketBias !== overallBias && overallBias !== "conflicted").forEach(e => {
    conflictingSignals.push(`${e.tf} shows ${e.data.marketBias} — diverging from the ${overallBias} consensus`);
  });

  // Recommendation
  const recommendation = overallBias === "bullish" ? (htfDominates ? "wait" : "buy") :
    overallBias === "bearish" ? (htfDominates ? "wait" : "sell") : "wait";

  // Higher TF bias
  const higherTimeframeBias = htfEntries.length > 0 ? (htfScore > 0 ? "bullish" : htfScore < 0 ? "bearish" : "neutral") : overallBias;

  // Entry timeframe
  const entryTFPreference = ["1h", "15m", "4h", "1D"];
  const entryTimeframe = entryTFPreference.find(tf => timeframes.includes(tf)) ?? timeframes[0];

  // Reasoning
  const agreeList = entries.filter(e => e.data.marketBias === overallBias).map(e => e.tf).join(", ");
  let reasoning = overallBias === "conflicted"
    ? `Timeframes are split — no clear directional bias. Higher-timeframe analysis is needed or wait for market to resolve.`
    : `${agreeCount}/${entries.length} timeframes show ${overallBias} bias (${agreeList}).`;
  if (htfDominates) reasoning += ` Higher-timeframe trend is ${higherTimeframeBias} — lower-timeframe counter-move is a retracement. Wait for ${entryTimeframe} to confirm ${higherTimeframeBias} before entering.`;
  else if (allAgree) reasoning += ` All timeframes aligned — this is a high-conviction setup.`;

  // Entry condition
  let entryCondition: string;
  if (overallBias === "conflicted") {
    entryCondition = "No trade — timeframes are genuinely split. Wait for clearer alignment before risking capital.";
  } else if (htfDominates) {
    const ltfBiasLabel = ltfScore > 0 ? "bullish" : "bearish";
    const opposite = ltfBiasLabel;
    entryCondition = `${entryTimeframe} is currently showing ${opposite} (retracement). Wait for ${entryTimeframe} stochastic to exit oversold and price to reclaim the ${entryTimeframe} fast MA — that confirms the ${higherTimeframeBias} continuation entry.`;
  } else if (allAgree) {
    entryCondition = `All timeframes aligned ${overallBias}. Enter ${overallBias === "bullish" ? "long" : "short"} at the nearest ${entryTimeframe} support retest. Use the ${entryTimeframe} swing low as your stop reference.`;
  } else {
    entryCondition = `Wait for ${entries.filter(e => e.data.marketBias !== overallBias).map(e => e.tf).join(" and ")} to confirm ${overallBias} direction before entering.`;
  }

  // finalSetup — derive from entry TF analysis
  const entryTFData = (TF_MOCKS[entryTimeframe] ?? getMockAnalysis());
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

  // Per-TF summary for UI
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
