export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1D";
export type MarketBias = "bullish" | "bearish" | "neutral";
export type TradeType = "buy" | "sell" | "wait";
export type TrendDirection = "uptrend" | "downtrend" | "ranging";
export type TradeGrade = "A+" | "A" | "B" | "C" | "avoid";

export interface AnalysisResult {
  marketBias: MarketBias;
  structure: {
    trend: TrendDirection;
    higherHighs: boolean;
    lowerLows: boolean;
    keyLevel: number | null;
    description: string;
  };
  indicators: {
    movingAverages: {
      fastAboveSlow: boolean;
      priceAboveFast: boolean;
      priceAboveSlow: boolean;
      crossoverRecent: boolean;
      crossoverType: "golden" | "death" | "none";
      description: string;
    };
    rsi: {
      value: number;
      zone: "overbought" | "oversold" | "bullish" | "bearish" | "neutral";
      divergence: "bullish" | "bearish" | "none";
      description: string;
    };
    stochastic: {
      kValue: number;
      dValue: number;
      zone: "overbought" | "oversold" | "neutral";
      crossover: "bullish" | "bearish" | "none";
      divergence: "bullish" | "bearish" | "none";
      description: string;
    };
  };
  supportResistance: {
    nearestSupport: number | null;
    nearestResistance: number | null;
    keyLevels: number[];
    description: string;
  };
  momentum: {
    type: "continuation" | "reversal" | "unclear";
    strength: "strong" | "moderate" | "weak";
    description: string;
  };
  tradeSetup: {
    type: TradeType;
    rationale: string;
    entryZone: { low: number; high: number };
    stopLoss: number;
    stopLossRationale: string;
    takeProfits: Array<{ level: number; label: string; rationale: string }>;
    riskRewardRatio: number;
  };
  tradeGrade?: TradeGrade;
  confidence: number;
  confidenceFactors: string[];
  reasoning: string;
  invalidationConditions: string[];
  warnings: string[];
}

export interface AnalysisRecord {
  id: number;
  timeframe: Timeframe;
  instrument?: string | null;
  imageUrl: string | null;
  result: AnalysisResult | null;
  promptVersion: string;
  processingTimeMs?: number | null;
  createdAt: string;
}

export interface AnalysisStats {
  total: number;
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  byTimeframe: Array<{ timeframe: string; count: number }>;
}
