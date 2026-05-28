type TradeGrade = "A+" | "A" | "B" | "C" | "avoid" | "WAIT";
type MarketRegime = "trending" | "ranging" | "volatile" | "choppy";

// ── Base mock result (XAUUSD prices) ─────────────────────────────────────────
export function getMockAnalysis() {
  return {
    marketRegime: "trending" as MarketRegime,
    marketBias: "bullish" as const,
    structure: {
      trend: "uptrend" as const,
      higherHighs: true,
      lowerLows: false,
      keyLevel: 2334.50,
      description: "Price is forming consistent higher highs and higher lows, confirming a bullish market structure. The most recent swing low held cleanly above the prior pivot, indicating strong buyer participation.",
    },
    indicators: {
      movingAverages: {
        fastAboveSlow: true,
        priceAboveFast: true,
        priceAboveSlow: true,
        crossoverRecent: true,
        crossoverType: "golden" as const,
        description: "Golden cross confirmed — fast MA (yellow) crossed above slow MA three candles ago. Price is trading above both MAs with widening separation, consistent with trend continuation momentum.",
      },
      rsi: {
        value: 61.4,
        zone: "bullish" as const,
        divergence: "none" as const,
        description: "RSI at 61.4 — sitting in the bullish zone above 50 with room to run before reaching overbought territory at 70. No divergence visible. Momentum supports continuation.",
      },
      stochastic: {
        kValue: 68,
        dValue: 62,
        zone: "neutral" as const,
        crossover: "bullish" as const,
        divergence: "none" as const,
        description: "K line recently crossed above D line from the neutral zone. Bullish crossover confirms MA signal. Not overbought — setup has room to develop.",
      },
    },
    supportResistance: {
      nearestSupport: 2318.00,
      nearestResistance: 2355.00,
      keyLevels: [2318.00, 2334.50, 2345.00, 2355.00],
      description: "Key support cluster at 2318.00 — previous swing low and 50 EMA confluence. Major resistance at 2355.00 which has rejected price on two prior attempts this week.",
    },
    momentum: {
      type: "continuation" as const,
      strength: "moderate" as const,
      description: "Momentum indicators align for continuation. Stochastic and RSI both point upward from mid-range — not exhausted. Structure confirms buyer control.",
    },
    tradeSetup: {
      type: "buy" as const,
      rationale: "Golden cross with price above both MAs, RSI bullish at 61, Stochastic confirming from neutral zone. HH/HL structure intact. Risk:reward from current zone is favorable.",
      entryZone: { low: 2332.00, high: 2336.50 },
      stopLoss: 2314.50,
      stopLossRationale: "Below the most recent swing low (2318.00) and prior structure. Invalidates the HH/HL pattern if breached.",
      takeProfits: [
        { level: 2345.00, label: "TP1", rationale: "Mid-range resistance — partial profits, trail stop" },
        { level: 2355.00, label: "TP2", rationale: "Major resistance — two prior rejections this week" },
        { level: 2368.00, label: "TP3", rationale: "Extension target — measured move from breakout base" },
      ],
      riskRewardRatio: 2.3,
    },
    tradeGrade: "A" as TradeGrade,
    confidence: 68,
    alignmentScore: 78,
    contradictions: [] as string[],
    keyReasoning: [
      "Golden cross confirmed with widening MA separation",
      "RSI in bullish zone with no divergence",
      "Clean higher high / higher low structure",
      "Stochastic bullish crossover from neutral zone",
    ] as string[],
    noTradeReason: null as string | null,
    confidenceFactors: [
      "Golden cross confirmed with widening MA separation",
      "RSI in bullish zone with no divergence",
      "Clean higher high / higher low structure",
      "Stochastic bullish crossover from neutral zone",
    ],
    reasoning: "The chart presents a disciplined bullish alignment: golden cross, price above both moving averages, RSI in the bullish zone at 61, and Stochastic recently crossing bullish. Structure shows consistent higher highs and higher lows. Entry is positioned at the current consolidation zone targeting the prior resistance cluster. The setup invalidates on a close below the recent swing low at 2318.",
    invalidationConditions: [
      "Daily close below 2318.00 — negates HH/HL structure",
      "RSI drops back below 50 — signals momentum shift",
      "Death cross forms on this timeframe",
    ],
    warnings: ["Demo mode — analysis is simulated"],
  };
}

// ── Per-timeframe realistic mock data (XAUUSD prices) ────────────────────────
const TF_MOCKS = {
  "1D": {
    marketRegime: "trending" as MarketRegime,
    marketBias: "bullish" as const,
    structure: {
      trend: "uptrend" as const, higherHighs: true, lowerLows: false, keyLevel: 2376.00,
      description: "Strong daily uptrend — HH/HL pattern over 6 weeks. Price comfortably above both daily MAs.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none" as const, description: "Daily golden cross 3 weeks ago — still in force. Good MA separation indicating trend health." },
      rsi: { value: 58.0, zone: "bullish" as const, divergence: "none" as const, description: "RSI 58 — mid bullish zone, healthy trend momentum without being overextended." },
      stochastic: { kValue: 68, dValue: 61, zone: "neutral" as const, crossover: "bullish" as const, divergence: "none" as const, description: "Stochastic turning up from mid-range — supportive of continued bullish momentum." },
    },
    supportResistance: {
      nearestSupport: 2345.00, nearestResistance: 2425.00,
      keyLevels: [2345.00, 2376.00, 2400.00, 2425.00],
      description: "Daily support at 2345 (prior swing low). Resistance at 2425 (weekly high).",
    },
    momentum: { type: "continuation" as const, strength: "strong" as const, description: "Strong daily momentum — uptrend fully in force." },
    tradeSetup: {
      type: "buy" as const,
      rationale: "Daily trend strongly bullish — HTF direction confirmed, aligned with all indicators.",
      entryZone: { low: 2360.00, high: 2380.00 },
      stopLoss: 2335.00,
      stopLossRationale: "Below daily swing low — invalidates the daily uptrend structure.",
      takeProfits: [
        { level: 2400.00, label: "TP1", rationale: "Round number resistance" },
        { level: 2425.00, label: "TP2", rationale: "Weekly resistance zone" },
        { level: 2450.00, label: "TP3", rationale: "Psychological round number extension" },
      ],
      riskRewardRatio: 2.5,
    },
    tradeGrade: "A" as TradeGrade,
    confidence: 78,
    alignmentScore: 85,
    contradictions: [] as string[],
    keyReasoning: [
      "Higher highs / higher lows over 6 weeks — macro uptrend fully intact",
      "Price above both daily MAs with strong MA separation — trending health confirmed",
      "RSI 58 mid-bullish zone — has room to continue without reversal risk",
      "Stochastic bullish cross from mid-range — daily momentum supporting continuation",
      "Long setup: 2.5:1 R:R from daily MA support — excellent risk management",
    ] as string[],
    noTradeReason: null as string | null,
    confidenceFactors: ["Daily trend strongly bullish", "Price above both daily MAs", "RSI mid-range — not overbought", "Clean HH/HL structure over 6 weeks"],
    reasoning: "Daily chart shows an established, healthy uptrend with no signs of exhaustion. Higher timeframe context is clearly bullish and RSI has room before overbought. This is the directional context for all lower timeframes.",
    invalidationConditions: ["Daily close below 2345.00", "Daily RSI falls below 45", "Bearish engulfing candle closes below daily MA"],
    warnings: ["Demo mode — analysis is simulated"],
  },

  "4h": {
    marketRegime: "trending" as MarketRegime,
    marketBias: "bullish" as const,
    structure: {
      trend: "uptrend" as const, higherHighs: true, lowerLows: false, keyLevel: 2342.00,
      description: "4H uptrend intact — recent healthy pullback to 4H support held exactly. HH/HL pattern continuing.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: true, crossoverType: "golden" as const, description: "Fresh 4H golden cross. Price retested the MA zone and bounced — textbook continuation signal." },
      rsi: { value: 55.2, zone: "bullish" as const, divergence: "none" as const, description: "RSI 55 — recovering from the pullback, trajectory clearly bullish." },
      stochastic: { kValue: 58, dValue: 52, zone: "neutral" as const, crossover: "bullish" as const, divergence: "none" as const, description: "Stochastic bullish crossover from mid-range — momentum building for continuation." },
    },
    supportResistance: {
      nearestSupport: 2318.00, nearestResistance: 2365.00,
      keyLevels: [2318.00, 2342.00, 2355.00, 2365.00],
      description: "4H support at 2318 (swing low). Next resistance cluster at 2365.",
    },
    momentum: { type: "continuation" as const, strength: "moderate" as const, description: "Momentum building post-pullback. 4H primed for next leg up." },
    tradeSetup: {
      type: "buy" as const,
      rationale: "4H aligned with daily trend. Fresh golden cross with MA retest bounce — quality entry signal.",
      entryZone: { low: 2330.00, high: 2342.00 },
      stopLoss: 2305.00,
      stopLossRationale: "Below 4H support and swing low — invalidates the bullish structure.",
      takeProfits: [
        { level: 2355.00, label: "TP1", rationale: "4H resistance swing high" },
        { level: 2380.00, label: "TP2", rationale: "Daily resistance round number" },
        { level: 2400.00, label: "TP3", rationale: "Extended daily target" },
      ],
      riskRewardRatio: 2.2,
    },
    tradeGrade: "A" as TradeGrade,
    confidence: 74,
    alignmentScore: 80,
    contradictions: [] as string[],
    keyReasoning: [
      "4H higher highs / higher lows — trend continuation pattern confirmed",
      "Fresh golden cross — fast MA above slow MA after healthy pullback retest",
      "RSI 55.2 recovering from pullback — bullish zone with no overbought concern",
      "Stochastic bullish K/D cross at 58 — momentum confirming next leg up",
      "Long setup: 2.2:1 R:R at MA support retest — aligned with D1 HTF trend",
    ] as string[],
    noTradeReason: null as string | null,
    confidenceFactors: ["Aligned with daily bullish trend", "MA retest bounce — quality entry", "Stoch bullish crossover", "RSI recovering without being overbought"],
    reasoning: "4H confirms the daily bullish trend. Healthy pullback to MA zone was retested and held perfectly. Fresh golden cross with price above both MAs. This is a quality continuation setup aligned with the HTF context.",
    invalidationConditions: ["4H close below 2305.00", "Stochastic rolls over below 40", "4H death cross forms"],
    warnings: ["Demo mode — analysis is simulated"],
  },

  "1h": {
    marketRegime: "ranging" as MarketRegime,
    marketBias: "neutral" as const,
    structure: {
      trend: "ranging" as const, higherHighs: false, lowerLows: false, keyLevel: 2342.00,
      description: "1H consolidating inside a tight range 2325–2352. Compression after the 4H move — breakout expected.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none" as const, description: "MAs flattening and converging inside the range. No directional crossover — market pausing." },
      rsi: { value: 51.0, zone: "neutral" as const, divergence: "none" as const, description: "RSI 51 — dead centre neutral. No directional bias on this timeframe." },
      stochastic: { kValue: 52, dValue: 50, zone: "neutral" as const, crossover: "none" as const, divergence: "none" as const, description: "Stochastic mid-range, no cross. Market waiting for a catalyst." },
    },
    supportResistance: {
      nearestSupport: 2325.00, nearestResistance: 2352.00,
      keyLevels: [2325.00, 2342.00, 2352.00],
      description: "1H range: support at 2325, resistance at 2352. Breakout of this range defines next move.",
    },
    momentum: { type: "unclear" as const, strength: "weak" as const, description: "Momentum stalling inside range — wait for breakout direction." },
    tradeSetup: {
      type: "wait" as const,
      rationale: "1H is in a tight range with no directional bias. Wait for breakout above 2352 (given bullish HTF context) before entering long.",
      entryZone: { low: 2352.00, high: 2357.00 },
      stopLoss: 2315.00,
      stopLossRationale: "Below range low — invalidates the bullish breakout thesis.",
      takeProfits: [{ level: 2365.00, label: "TP1", rationale: "Next 4H resistance" }],
      riskRewardRatio: 0.9,
    },
    tradeGrade: "WAIT" as TradeGrade,
    confidence: 52,
    alignmentScore: 0,
    contradictions: [] as string[],
    keyReasoning: [
      "Price consolidating in a range (1.08300–1.08520) — no directional trend on 1H",
      "Moving averages converging without clear direction — 1H trend on pause",
      "RSI 51.0 — dead-centre neutral, no momentum bias in either direction",
      "Stochastic 52 mid-range, no K/D crossover — oscillator neutral",
      "Awaiting entry trigger — breakout above 1.08520 needed to confirm upside aligned with HTF",
    ] as string[],
    noTradeReason: "1H consolidating in a tight range with neutral RSI and no MA direction. Wait for a clean candle close above 1.08520 with RSI > 55 — this confirms the upside breakout aligned with the 4H/1D bullish trend." as string | null,
    confidenceFactors: ["HTF bullish context — bias for upside breakout", "1H consolidation after strong move — typical continuation pattern", "Range compression near resistance"],
    reasoning: "1H is consolidating post-4H bounce. Neutral on this timeframe alone, but given 1D and 4H bullish context, upside breakout is higher probability. No trade until 2352 is cleared with a candle close.",
    invalidationConditions: ["Breakdown below 2315 range low", "RSI drops below 45 inside the range"],
    warnings: ["Demo mode — analysis is simulated", "1H neutral — wait for breakout confirmation before entry"],
  },

  "15m": {
    marketRegime: "ranging" as MarketRegime,
    marketBias: "bearish" as const,
    structure: {
      trend: "downtrend" as const, higherHighs: false, lowerLows: true, keyLevel: 2342.00,
      description: "15M short-term pullback. Lower highs and lower lows — short-term selling pressure within the HTF consolidation range.",
    },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: false, priceAboveSlow: false, crossoverRecent: true, crossoverType: "death" as const, description: "15M death cross. Price below both MAs — short-term sellers in control. This is a retracement signal." },
      rsi: { value: 38.5, zone: "bearish" as const, divergence: "none" as const, description: "RSI 38.5 — bearish zone, approaching oversold. 15M weakness present but nearly exhausted." },
      stochastic: { kValue: 22, dValue: 30, zone: "oversold" as const, crossover: "bearish" as const, divergence: "none" as const, description: "Stochastic entering oversold zone — a bounce from here is likely, which could be the HTF entry trigger." },
    },
    supportResistance: {
      nearestSupport: 2325.00, nearestResistance: 2348.00,
      keyLevels: [2325.00, 2338.00, 2348.00],
      description: "15M support at 2325 (confluence with 1H range low). Resistance at 2348.",
    },
    momentum: { type: "reversal" as const, strength: "moderate" as const, description: "15M bearish momentum approaching exhaustion — stochastic near oversold suggests the low is forming." },
    tradeSetup: {
      type: "wait" as const,
      rationale: "Wait for stochastic to bounce from oversold and price to reclaim 2338 — this signals the HTF bullish continuation entry on the 15M.",
      entryZone: { low: 2337.00, high: 2342.00 },
      stopLoss: 2316.00,
      stopLossRationale: "Below 15M and 1H support confluence.",
      takeProfits: [
        { level: 2352.00, label: "TP1", rationale: "1H range top — breakout trigger level" },
        { level: 2365.00, label: "TP2", rationale: "4H resistance target" },
        { level: 2380.00, label: "TP3", rationale: "Daily round number target" },
      ],
      riskRewardRatio: 1.8,
    },
    tradeGrade: "WAIT" as TradeGrade,
    confidence: 48,
    alignmentScore: 0,
    contradictions: [
      "15M bearish structure conflicts with 4H/1D bullish trend — this is a retracement, not a reversal",
    ] as string[],
    keyReasoning: [
      "15M showing lower highs and lower lows — short-term bearish retracement within HTF uptrend",
      "Death cross on 15M — short-term MAs bearish, but this is a counter-trend setup",
      "RSI 38.5 approaching oversold — 15M selling momentum nearly exhausted",
      "Stochastic 22 in oversold zone — selling exhaustion signal, bounce likely forming",
      "Awaiting entry trigger — stochastic bounce + price reclaim of 1.08380 needed for confirmation",
    ] as string[],
    noTradeReason: "15M is in a counter-trend pullback within the HTF uptrend. Wait for stochastic to bounce from oversold territory and price to reclaim 1.08380 — this confirms the LTF reversal and the HTF continuation entry signal." as string | null,
    confidenceFactors: ["Stochastic approaching oversold — potential bounce zone", "HTF bullish — short-term pullback likely to reverse", "Price near 1H range support confluence"],
    reasoning: "15M is in a normal pullback within the HTF uptrend. Death cross and bearish RSI confirm short-term selling but stochastic nearing oversold signals the low is forming. This is the optimal entry zone for the HTF continuation once 15M reversal is confirmed.",
    invalidationConditions: ["Close below 2316 support", "15M RSI breaks below 30 and continues lower", "4H candle closes below 2305"],
    warnings: ["Demo mode — analysis is simulated", "15M bearish — wait for LTF reversal confirmation before entering"],
  },
};

export function getMockTimeframeAnalysis(timeframe: string): ReturnType<typeof getMockAnalysis> {
  return (TF_MOCKS as unknown as Record<string, ReturnType<typeof getMockAnalysis>>)[timeframe] ?? getMockAnalysis();
}

// ── Confluence computation (mock mode) ────────────────────────────────────────
export function computeMockConfluence(timeframes: string[]) {
  const TF_WEIGHTS: Record<string, number> = { "1D": 0.35, "4h": 0.25, "1h": 0.25, "15m": 0.15 };
  const HTF = ["1D", "4h"];
  const LTF = ["1h", "15m"];

  const entries = timeframes.map(tf => ({
    tf,
    data: (TF_MOCKS as unknown as Record<string, ReturnType<typeof getMockAnalysis>>)[tf] ?? getMockAnalysis(),
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
    ? "Timeframes are split — no clear directional bias. Wait for market to resolve before risking capital."
    : `${agreeCount}/${entries.length} timeframes show ${overallBias} bias (${agreeList}).`;
  if (htfDominates) reasoning += ` Higher-timeframe trend is ${higherTimeframeBias} — lower-timeframe counter-move is a retracement. Wait for ${entryTimeframe} to confirm ${higherTimeframeBias} before entering.`;
  else if (allAgree) reasoning += " All timeframes aligned — high-conviction setup.";

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

  const entryTFData = (TF_MOCKS as unknown as Record<string, ReturnType<typeof getMockAnalysis>>)[entryTimeframe] ?? getMockAnalysis();
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
    overallBias, alignmentScore, confluenceStrength, alignedCount: agreeCount,
    totalCount: entries.length, higherTimeframeBias, entryTimeframe, recommendation,
    reasoning, entryCondition, conflictingSignals, overallConfidence, finalSetup, perTimeframe,
  };
}
