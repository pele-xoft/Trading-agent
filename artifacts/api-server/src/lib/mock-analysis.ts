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
