export function getMockAnalysis() {
  return {
    marketBias: "bullish",
    structure: {
      trend: "uptrend",
      higherHighs: true,
      lowerLows: false,
      keyLevel: 1.08420,
      description: "Price is making consistent higher highs and higher lows, confirming a clean uptrend structure. The most recent swing low held above the previous, indicating strong buyer control.",
    },
    indicators: {
      movingAverages: {
        fastAboveSlow: true,
        priceAboveFast: true,
        priceAboveSlow: true,
        crossoverRecent: true,
        crossoverType: "golden",
        description: "Golden cross confirmed — fast MA crossed above slow MA three candles ago. Price is riding above both MAs with increasing separation, signaling trend momentum.",
      },
      rsi: {
        value: 62.4,
        zone: "bullish",
        divergence: "none",
        description: "RSI sitting in the bullish zone at 62.4, well above 50 but not overbought. Plenty of room to run before hitting 70. No divergence visible.",
      },
      stochastic: {
        kValue: 71,
        dValue: 65,
        zone: "neutral",
        crossover: "bullish",
        divergence: "none",
        description: "K line recently crossed above D line from the neutral zone — bullish crossover confirming MA signal. Not overbought yet.",
      },
    },
    supportResistance: {
      nearestSupport: 1.08150,
      nearestResistance: 1.09000,
      keyLevels: [1.08150, 1.08420, 1.08750, 1.09000],
      description: "Key support cluster at 1.08150 (previous swing low + 50 EMA confluence). Major resistance at the round number 1.09000 which has rejected price twice.",
    },
    momentum: {
      type: "continuation",
      strength: "moderate",
      description: "Momentum indicators align for continuation. Volume structure (if visible) supports the move. Stochastic and RSI both point up from mid-range.",
    },
    tradeSetup: {
      type: "buy",
      rationale: "Golden cross with price above both MAs, RSI bullish, Stochastic confirming. Structure shows HH/HL pattern. Risk:reward is favorable from current zone.",
      entryZone: { low: 1.08350, high: 1.08480 },
      stopLoss: 1.08050,
      stopLossRationale: "Below the most recent swing low and the support cluster. Invalidates the HH/HL structure if broken.",
      takeProfits: [
        { level: 1.08750, label: "TP1", rationale: "Next key level / prior resistance becoming support" },
        { level: 1.09000, label: "TP2", rationale: "Major round number resistance — two prior rejections" },
        { level: 1.09350, label: "TP3", rationale: "Extension target — measured move from the breakout" },
      ],
      riskRewardRatio: 2.1,
    },
    confidence: 72,
    confidenceFactors: [
      "Multiple indicator alignment (MA, RSI, Stochastic all bullish)",
      "Clean HH/HL structure on the chart",
      "Golden cross is recent and price hasn't pulled back yet",
    ],
    reasoning: "The chart presents a clean bullish alignment with a fresh golden cross, price above both moving averages, and RSI/Stochastic both confirming momentum from mid-range. The structure shows consistent higher highs and higher lows. A long entry in the current zone targets 2.1R with stop below the most recent swing low.",
    invalidationConditions: [
      "Close below 1.08050 (swing low) negates the bullish structure",
      "RSI drops below 50 on the next candle close",
      "Fast MA crosses back below slow MA (death cross)",
    ],
    warnings: [
      "This is mock analysis — no real image was analyzed",
      "Past performance does not guarantee future results",
      "Not financial advice",
    ],
  };
}

const TF_MOCKS: Record<string, ReturnType<typeof getMockAnalysis>> = {
  "1D": {
    marketBias: "bullish",
    structure: { trend: "uptrend", higherHighs: true, lowerLows: false, keyLevel: 1.08200, description: "Strong daily uptrend — clear sequence of HH/HL over the past 6 weeks. Price well above both MAs." },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none", description: "Price comfortably above both MAs. Golden cross established 3 weeks ago — still in play." },
      rsi: { value: 58.0, zone: "bullish", divergence: "none", description: "RSI 58 — mid-bullish range, room to continue up." },
      stochastic: { kValue: 68, dValue: 61, zone: "neutral", crossover: "bullish", divergence: "none", description: "Stochastic turning up from mid-range. Bullish cross." },
    },
    supportResistance: { nearestSupport: 1.07800, nearestResistance: 1.09500, keyLevels: [1.07800, 1.08200, 1.09000, 1.09500], description: "Daily support at 1.07800. Major resistance at 1.09500 weekly high." },
    momentum: { type: "continuation", strength: "strong", description: "Strong daily momentum — trend in full effect." },
    tradeSetup: { type: "buy", rationale: "Daily trend bullish. Higher TF confirms direction.", entryZone: { low: 1.08100, high: 1.08400 }, stopLoss: 1.07700, stopLossRationale: "Below daily swing low.", takeProfits: [{ level: 1.09000, label: "TP1", rationale: "Round number" }, { level: 1.09500, label: "TP2", rationale: "Weekly resistance" }], riskRewardRatio: 2.5 },
    confidence: 78,
    confidenceFactors: ["Daily trend strongly bullish", "Price above both MAs on daily", "RSI mid-range — not overbought"],
    reasoning: "Daily chart shows strong established uptrend. Higher timeframe bias is clearly bullish and provides directional context for lower timeframe entries.",
    invalidationConditions: ["Daily close below 1.07800", "RSI daily drops below 45"],
    warnings: ["Mock analysis — demo mode"],
  },
  "4h": {
    marketBias: "bullish",
    structure: { trend: "uptrend", higherHighs: true, lowerLows: false, keyLevel: 1.08350, description: "4H trend bullish — recent pullback to 4H support held perfectly. HH/HL structure intact." },
    indicators: {
      movingAverages: { fastAboveSlow: true, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: true, crossoverType: "golden", description: "Fresh golden cross on 4H. Price pulled back to MA zone then bounced — classic retest." },
      rsi: { value: 55.2, zone: "bullish", divergence: "none", description: "RSI 55 recovering from pullback low. Bullish trajectory confirmed." },
      stochastic: { kValue: 58, dValue: 52, zone: "neutral", crossover: "bullish", divergence: "none", description: "Stochastic just crossed bullish from oversold — strong signal." },
    },
    supportResistance: { nearestSupport: 1.08150, nearestResistance: 1.08900, keyLevels: [1.08150, 1.08350, 1.08700, 1.08900], description: "4H support at 1.08150. Next key resistance at 1.08900." },
    momentum: { type: "continuation", strength: "moderate", description: "Momentum building after pullback. 4H is primed for continuation." },
    tradeSetup: { type: "buy", rationale: "4H trend aligns with daily. Fresh golden cross with MA retest bounce.", entryZone: { low: 1.08300, high: 1.08420 }, stopLoss: 1.08050, stopLossRationale: "Below 4H support cluster.", takeProfits: [{ level: 1.08750, label: "TP1", rationale: "4H resistance" }, { level: 1.09000, label: "TP2", rationale: "Daily resistance" }], riskRewardRatio: 2.2 },
    confidence: 74,
    confidenceFactors: ["Aligned with daily bullish trend", "MA retest bounce — textbook entry signal", "Stochastic bullish cross from oversold"],
    reasoning: "4H chart confirms daily bullish trend. The pullback to the 4H MA zone was a healthy retest. Fresh golden cross with stochastic turning up presents a quality continuation setup.",
    invalidationConditions: ["4H close below 1.08050", "Stochastic rolls back below 50"],
    warnings: ["Mock analysis — demo mode"],
  },
  "1h": {
    marketBias: "neutral",
    structure: { trend: "sideways", higherHighs: false, lowerLows: false, keyLevel: 1.08420, description: "1H chart consolidating inside a tight range. Price compressing between 1.08300 and 1.08500 — waiting for a breakout." },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: true, priceAboveSlow: true, crossoverRecent: false, crossoverType: "none", description: "MAs flattening out as price consolidates. No clear crossover — range-bound." },
      rsi: { value: 51.0, zone: "neutral", divergence: "none", description: "RSI 51 — dead centre. No directional bias on the 1H." },
      stochastic: { kValue: 52, dValue: 50, zone: "neutral", crossover: "none", divergence: "none", description: "Stochastic mid-range with no clear cross. Waiting for direction." },
    },
    supportResistance: { nearestSupport: 1.08300, nearestResistance: 1.08520, keyLevels: [1.08300, 1.08420, 1.08520], description: "Tight 1H range. Support 1.08300, resistance 1.08520. Breakout will be decisive." },
    momentum: { type: "consolidation", strength: "weak", description: "Momentum stalling — price compressing. Breakout imminent." },
    tradeSetup: { type: "wait", rationale: "1H consolidating. Wait for a breakout above 1.08520 before entering long.", entryZone: { low: 1.08520, high: 1.08560 }, stopLoss: 1.08280, stopLossRationale: "Below range low.", takeProfits: [{ level: 1.08750, label: "TP1", rationale: "Next resistance" }], riskRewardRatio: 0.9 },
    confidence: 52,
    confidenceFactors: ["Higher TF trend bullish — bias for upside breakout", "Consolidation after strong move — typical continuation pattern"],
    reasoning: "1H is consolidating after the 4H bounce. This is a neutral zone — direction unclear on this timeframe alone. However, given higher TF context (daily and 4H both bullish), an upside breakout is the higher-probability outcome.",
    invalidationConditions: ["Break below 1.08280 range low", "RSI drops below 45"],
    warnings: ["Mock analysis — demo mode", "1H is currently neutral — confirmation needed before entry"],
  },
  "15m": {
    marketBias: "bearish",
    structure: { trend: "downtrend", higherHighs: false, lowerLows: true, keyLevel: 1.08420, description: "15M showing a short-term pullback within the consolidation zone. Lower highs and lower lows on the 15M — short-term bearish pressure." },
    indicators: {
      movingAverages: { fastAboveSlow: false, priceAboveFast: false, priceAboveSlow: false, crossoverRecent: true, crossoverType: "death", description: "Death cross on 15M. Price below both MAs — short-term sellers in control." },
      rsi: { value: 38.5, zone: "bearish", divergence: "none", description: "RSI 38.5 — approaching oversold. 15M weakness confirmed." },
      stochastic: { kValue: 22, dValue: 30, zone: "oversold", crossover: "bearish", divergence: "none", description: "Stochastic entering oversold territory. May see a bounce soon which could present the entry opportunity." },
    },
    supportResistance: { nearestSupport: 1.08300, nearestResistance: 1.08460, keyLevels: [1.08300, 1.08380, 1.08460], description: "15M support at 1.08300 — aligns with 1H range low. Resistance at 1.08460." },
    momentum: { type: "reversal", strength: "moderate", description: "15M momentum bearish but approaching oversold — reversal from support likely soon." },
    tradeSetup: { type: "wait", rationale: "15M currently bearish. Wait for stochastic to bounce from oversold and reclaim 1.08380 before entering long.", entryZone: { low: 1.08370, high: 1.08420 }, stopLoss: 1.08270, stopLossRationale: "Below 15M and 1H support.", takeProfits: [{ level: 1.08520, label: "TP1", rationale: "1H range top" }, { level: 1.08750, label: "TP2", rationale: "4H target" }], riskRewardRatio: 1.8 },
    confidence: 48,
    confidenceFactors: ["Stochastic approaching oversold — potential bounce zone", "Higher TF trend bullish — pullback likely to reverse"],
    reasoning: "15M is in a short-term pullback / downtrend. Death cross visible, RSI and Stochastic bearish. However, this aligns with a normal pullback in a higher-TF bullish trend. Watch for stochastic to enter oversold and then cross bullish — that would be the entry signal for the higher-TF continuation trade.",
    invalidationConditions: ["Break below 1.08270", "15M RSI drops below 30 and fails to recover"],
    warnings: ["Mock analysis — demo mode", "15M is bearish — do NOT enter long until lower TF confirms reversal"],
  },
};

export function getMockTimeframeAnalysis(timeframe: string): ReturnType<typeof getMockAnalysis> {
  return TF_MOCKS[timeframe] ?? getMockAnalysis();
}

export function computeMockConfluence(timeframes: string[]): {
  overallBias: string;
  alignmentScore: number;
  confluenceStrength: string;
  alignedCount: number;
  totalCount: number;
  recommendation: string;
  reasoning: string;
  entryCondition: string;
} {
  const results = timeframes.map(tf => ({ tf, data: TF_MOCKS[tf] ?? getMockAnalysis() }));
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  for (const { data } of results) {
    counts[data.marketBias as keyof typeof counts]++;
  }
  const total = results.length;
  const dominant = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as string;
  const alignedCount = counts[dominant as keyof typeof counts];
  const alignmentScore = Math.round((alignedCount / total) * 100);

  let confluenceStrength = "weak";
  if (alignmentScore >= 100) confluenceStrength = "perfect";
  else if (alignmentScore >= 75) confluenceStrength = "strong";
  else if (alignmentScore >= 50) confluenceStrength = "moderate";
  else confluenceStrength = "divergent";

  const hasWaitTFs = results.filter(r => r.data.tradeSetup.type === "wait").map(r => r.tf);
  const isAllAligned = alignedCount === total;

  const recommendation = dominant === "bullish" ? (isAllAligned ? "buy" : "wait") :
    dominant === "bearish" ? (isAllAligned ? "sell" : "wait") : "wait";

  const alignedTFs = results.filter(r => r.data.marketBias === dominant).map(r => r.tf).join(", ");
  const divergentTFs = results.filter(r => r.data.marketBias !== dominant).map(r => r.tf);

  let reasoning = `${alignedCount}/${total} timeframes show ${dominant} bias (${alignedTFs}).`;
  if (divergentTFs.length > 0) reasoning += ` ${divergentTFs.join(", ")} ${divergentTFs.length === 1 ? "diverges" : "diverge"} — typical pullback within the ${dominant} trend.`;
  if (confluenceStrength === "strong" || confluenceStrength === "perfect") reasoning += " Multi-timeframe alignment is strong — higher conviction setup.";
  else if (confluenceStrength === "moderate") reasoning += " Moderate confluence — valid setup but watch lower TFs closely.";
  else reasoning += " Timeframes are divergent — no clean confluence. Avoid trading until alignment improves.";

  let entryCondition = "Wait for all monitored timeframes to align before entering.";
  if (hasWaitTFs.length > 0 && dominant !== "neutral") {
    entryCondition = `Wait for ${hasWaitTFs.join(" and ")} to confirm ${dominant} direction (stochastic cross + price above MAs) before entering ${dominant === "bullish" ? "long" : "short"}.`;
  } else if (isAllAligned) {
    entryCondition = `All timeframes aligned ${dominant}. Enter ${dominant === "bullish" ? "long" : "short"} on a pullback to the nearest support zone or on the next lower-TF confirmation candle.`;
  }

  return { overallBias: dominant, alignmentScore, confluenceStrength, alignedCount, totalCount: total, recommendation, reasoning, entryCondition };
}
