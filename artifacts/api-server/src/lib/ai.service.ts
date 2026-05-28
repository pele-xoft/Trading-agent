import OpenAI from "openai";
import { buildAnalysisPrompt, PROMPT_VERSION } from "./prompt-builder.js";
import {
  type AnalysisInput,
  computeCompositeSignal,
  blendConfidence,
  detectMarketRegime,
  computeAlignmentScore,
  detectContradictions,
  computeTradeGrade,
  countAlignedIndicators,
} from "./indicator-engine.js";
import { getMockAnalysis } from "./mock-analysis.js";

const isMockMode =
  process.env.MOCK_MODE === "true" ||
  process.env.OPENAI_API_KEY === "mock" ||
  !process.env.OPENAI_API_KEY;

const openai = isMockMode
  ? null
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const AI_MODEL = "gpt-4o-mini";

type Timeframe = "5m" | "15m" | "1h" | "4h" | "1D";

export async function analyzeChart(params: {
  imageBase64: string;
  mimeType: string;
  timeframe: Timeframe;
  instrument?: string;
}): Promise<{ result: Record<string, unknown>; processingTimeMs: number; promptVersion: string; model: string }> {
  const start = Date.now();

  if (isMockMode) {
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const result = postProcess(getMockAnalysis() as Record<string, unknown>);
    return {
      result,
      processingTimeMs: Date.now() - start,
      promptVersion: PROMPT_VERSION,
      model: "mock",
    };
  }

  const systemPrompt = buildAnalysisPrompt(params.timeframe);
  const instrumentText = params.instrument ? ` of ${params.instrument}` : "";
  const userText = `Analyze this ${params.timeframe} chart${instrumentText}.

Return ONLY a valid JSON object matching the structure in your instructions.

Read carefully and precisely from the chart:
- Fast MA (yellow/orange) and Slow MA (blue/white): position relative to price and each other, crossovers
- RSI oscillator: exact value, zone, any divergence visible
- Stochastic K and D lines: values, zone, crossover direction
- Price structure: trend direction, swing highs/lows, HH/HL or LH/LL pattern, key S/R levels
- Market regime: trending, ranging, volatile, or choppy?

Price levels: be precise. If a value is unclear, estimate conservatively and note it in warnings.`;

  let response;
  try {
    response = await openai!.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1800,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${params.mimeType};base64,${params.imageBase64}`,
                detail: "high",
              },
            },
            { type: "text", text: userText },
          ],
        },
      ],
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 429 || status === 401) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      const mockResult = getMockAnalysis() as Record<string, unknown>;
      const warnings = mockResult.warnings as string[];
      warnings.push(
        status === 429
          ? "OpenAI quota exceeded — showing demo analysis"
          : "OpenAI API key invalid — showing demo analysis",
      );
      return {
        result: postProcess(mockResult),
        processingTimeMs: Date.now() - start,
        promptVersion: PROMPT_VERSION,
        model: "mock-fallback",
      };
    }
    throw err;
  }

  const processingTimeMs = Date.now() - start;
  const rawText = response.choices[0]?.message?.content ?? "";
  if (!rawText) throw new Error("OpenAI returned empty response");

  const result = postProcess(parseAndValidate(rawText));

  // ── Regime-aware grade capping ─────────────────────────────────────────────
  const regime = result.marketRegime as string;
  const grade = result.tradeGrade as string;
  if (regime === "choppy" && (grade === "A+" || grade === "A")) {
    result.tradeGrade = "B";
    (result.warnings as string[]).push("Grade reduced to B — choppy market conditions limit setup quality");
  } else if (regime === "volatile" && grade === "A+") {
    result.tradeGrade = "A";
    (result.warnings as string[]).push("Grade capped at A — volatile conditions, elevated reversal risk");
  }

  // ── Surface contradictions as warnings ────────────────────────────────────
  const contradictions = result.contradictions as string[];
  if (contradictions?.length > 0) {
    const warnings = result.warnings as string[];
    for (const c of contradictions) {
      if (!warnings.some(w => w.includes(c.slice(0, 30)))) {
        warnings.push(c);
      }
    }
  }

  return { result, processingTimeMs, promptVersion: PROMPT_VERSION, model: AI_MODEL };
}

// ── Post-processing pipeline ───────────────────────────────────────────────────
function postProcess(result: Record<string, unknown>): Record<string, unknown> {
  const analysisInput = result as unknown as AnalysisInput;

  // 1. Blend AI confidence with rule-based composite (65% AI / 35% rules)
  const composite = computeCompositeSignal(analysisInput);
  result.confidence = blendConfidence(result.confidence as number, composite.confidence);

  // 2. Market intelligence layer
  const setup = result.tradeSetup as { type?: string; riskRewardRatio?: number } | undefined;
  const tradeType = (setup?.type as "buy" | "sell" | "wait") ?? "wait";

  if (!result.marketRegime) {
    result.marketRegime = detectMarketRegime(analysisInput);
  }
  result.alignmentScore = computeAlignmentScore(analysisInput, tradeType);
  result.contradictions = detectContradictions(analysisInput);

  // 3. Key reasoning
  if (!Array.isArray(result.keyReasoning) || (result.keyReasoning as string[]).length === 0) {
    result.keyReasoning = generateKeyReasoning(result);
  }

  // 4. Deterministic trade grade (overrides AI-assigned value)
  const momentum = result.momentum as { strength?: string } | undefined;
  const alignedCount = countAlignedIndicators(analysisInput);
  result.tradeGrade = computeTradeGrade(
    result.confidence as number,
    setup?.type ?? "wait",
    setup?.riskRewardRatio ?? 0,
    momentum?.strength ?? "weak",
    alignedCount,
  );

  return result;
}

// ── Key reasoning generator ───────────────────────────────────────────────────
function generateKeyReasoning(result: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const indicators = result.indicators as Record<string, unknown> | undefined;
  const ma = indicators?.movingAverages as Record<string, unknown> | undefined;
  const rsi = indicators?.rsi as Record<string, unknown> | undefined;
  const sto = indicators?.stochastic as Record<string, unknown> | undefined;
  const structure = result.structure as Record<string, unknown> | undefined;
  const setup = result.tradeSetup as Record<string, unknown> | undefined;

  const trend = structure?.trend as string ?? "ranging";
  const rsiVal = (rsi?.value as number) ?? 50;
  const rsiZone = rsi?.zone as string ?? "neutral";
  const rsiDiv = rsi?.divergence as string ?? "none";
  const stoZone = sto?.zone as string ?? "neutral";
  const stoCross = sto?.crossover as string ?? "none";
  const kVal = (sto?.kValue as number) ?? 50;

  if (trend === "uptrend") reasons.push("Higher highs / higher lows — clean uptrend structure intact");
  else if (trend === "downtrend") reasons.push("Lower highs / lower lows — established downtrend structure");
  else reasons.push("Price consolidating in a range — no clear directional trend on this timeframe");

  if (ma) {
    const ct = ma.crossoverType as string ?? "none";
    const fa = ma.fastAboveSlow as boolean;
    const paf = ma.priceAboveFast as boolean;
    if (ct === "golden") reasons.push("Golden cross confirmed — fast MA above slow MA, bullish structural alignment");
    else if (ct === "death") reasons.push("Death cross confirmed — fast MA below slow MA, bearish structural alignment");
    else if (fa && paf) reasons.push("Price above both MAs, MAs stacked bullish — trend support intact");
    else if (!fa && !paf) reasons.push("Price below both MAs, MAs stacked bearish — trend resistance overhead");
    else reasons.push("Moving averages converging without clear direction — trend pause");
  }

  if (rsiDiv !== "none") {
    reasons.push(`RSI ${rsiVal.toFixed(1)} with ${rsiDiv} divergence — momentum contradicts price action`);
  } else if (rsiZone === "bullish") {
    reasons.push(`RSI ${rsiVal.toFixed(1)} mid-bullish zone — not overbought, momentum supports continuation`);
  } else if (rsiZone === "bearish") {
    reasons.push(`RSI ${rsiVal.toFixed(1)} mid-bearish zone — not oversold, momentum supports decline`);
  } else if (rsiZone === "overbought") {
    reasons.push(`RSI ${rsiVal.toFixed(1)} overbought — long entries carry elevated reversal risk`);
  } else if (rsiZone === "oversold") {
    reasons.push(`RSI ${rsiVal.toFixed(1)} oversold — short entries carry elevated bounce risk`);
  } else {
    reasons.push(`RSI ${rsiVal.toFixed(1)} — neutral zone, no momentum bias`);
  }

  if (stoCross === "bullish") {
    reasons.push(`Stochastic bullish K/D cross at ${kVal.toFixed(0)} — short-term momentum shifting upward`);
  } else if (stoCross === "bearish") {
    reasons.push(`Stochastic bearish K/D cross at ${kVal.toFixed(0)} — short-term momentum shifting downward`);
  } else if (stoZone === "oversold") {
    reasons.push(`Stochastic ${kVal.toFixed(0)} oversold — selling exhaustion, watch for bounce`);
  } else if (stoZone === "overbought") {
    reasons.push(`Stochastic ${kVal.toFixed(0)} overbought — buying exhaustion, watch for pullback`);
  } else {
    reasons.push(`Stochastic ${kVal.toFixed(0)} mid-range — oscillator neutral, no extreme`);
  }

  if (setup && setup.type !== "wait") {
    const rr = (setup.riskRewardRatio as number) ?? 0;
    const type = setup.type as string;
    const label = rr >= 2.5 ? "excellent" : rr >= 2.0 ? "good" : "acceptable";
    reasons.push(`${type === "buy" ? "Long" : "Short"} setup: ${rr.toFixed(1)}:1 R:R — ${label} risk management`);
  } else {
    reasons.push("Awaiting entry trigger — setup forming but conditions not yet met for entry");
  }

  return reasons.slice(0, 5);
}

// ── JSON parse & validate ─────────────────────────────────────────────────────
function parseAndValidate(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No valid JSON in AI response");
    parsed = JSON.parse(match[0]);
  }

  if (typeof parsed !== "object" || parsed === null)
    throw new Error("Analysis result is not an object");

  const r = parsed as Record<string, unknown>;

  for (const field of ["marketBias", "structure", "indicators", "tradeSetup", "confidence", "reasoning"]) {
    if (!(field in r)) throw new Error(`Missing required field: ${field}`);
  }

  if (typeof r.confidence === "number") {
    r.confidence = Math.max(0, Math.min(85, r.confidence));
  }

  if (!Array.isArray(r.warnings)) r.warnings = [];
  if (!Array.isArray(r.invalidationConditions)) r.invalidationConditions = [];
  if (!Array.isArray(r.confidenceFactors)) r.confidenceFactors = [];

  const structure = r.structure as Record<string, unknown> | undefined;
  if (structure && typeof structure.trend === "string") {
    const t = structure.trend.toLowerCase();
    if (["sideways", "ranging", "range", "consolidation", "choppy"].includes(t)) {
      structure.trend = "ranging";
    } else if (["uptrend", "up", "bullish"].includes(t)) {
      structure.trend = "uptrend";
    } else if (["downtrend", "down", "bearish"].includes(t)) {
      structure.trend = "downtrend";
    }
  }

  // Normalise marketRegime — invalid values get re-computed server-side
  if (r.marketRegime && typeof r.marketRegime === "string") {
    if (!["trending", "ranging", "volatile", "choppy"].includes(r.marketRegime.toLowerCase())) {
      delete r.marketRegime;
    }
  }

  return r;
}
