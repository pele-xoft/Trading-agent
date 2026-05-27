// Mock analysis data returned when NEXT_PUBLIC_MOCK_MODE=true or OPENAI_API_KEY=mock

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
      entryZone: { low: 1.08380, high: 1.08450 },
      stopLoss: 1.08100,
      stopLossRationale: "Below the most recent swing low at 1.08150, giving structure room to breathe.",
      takeProfits: [
        { level: 1.08750, label: "TP1", rationale: "Previous minor resistance, first liquidity zone." },
        { level: 1.09000, label: "TP2", rationale: "Major round number resistance, double rejection." },
        { level: 1.09350, label: "TP3", rationale: "Extension target, previous structure high." },
      ],
      riskRewardRatio: 2.4,
    },
    confidence: 71,
    confidenceFactors: [
      "Golden cross recently confirmed on this timeframe",
      "Price above both MAs with healthy separation",
      "RSI in bullish zone, no divergence",
      "Stochastic K > D crossover from neutral zone",
      "Clean HH/HL price structure",
    ],
    reasoning: "This chart presents a solid bullish confluence: golden cross, price above both moving averages, RSI at 62 with room to run, and stochastic confirming with a bullish crossover. The price structure shows consistent higher highs and higher lows. The setup offers a 2.4:1 risk-reward from the current zone to TP2, which meets the minimum threshold. The main risk is the proximity to the 1.09 round number resistance.",
    invalidationConditions: [
      "Close below 1.08150 (recent swing low) would invalidate the bullish structure",
      "Death cross on MA would reverse the setup bias",
      "RSI dropping below 45 would signal momentum loss",
    ],
    warnings: [
      "Mock data — connect a real OpenAI API key to analyze actual charts",
      "1.09000 is a strong double-rejection resistance; partial profit there is advised",
    ],
  };
}
