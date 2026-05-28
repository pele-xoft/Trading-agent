import OpenAI from "openai";
import { buildAnalysisPrompt, PROMPT_VERSION } from "./prompt-builder.js";
import { computeCompositeSignal, blendConfidence } from "./indicator-engine.js";
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
    const result = getMockAnalysis() as Record<string, unknown>;
    return { result, processingTimeMs: Date.now() - start, promptVersion: PROMPT_VERSION, model: "mock" };
  }

  const systemPrompt = buildAnalysisPrompt(params.timeframe);
  const instrumentText = params.instrument ? ` of ${params.instrument}` : "";
  const userText = `Analyse this ${params.timeframe} chart${instrumentText}.

Read carefully and precisely:
- Fast MA (yellow/orange) and Slow MA (blue/white) — position relative to price and each other
- RSI oscillator — exact value, zone, any divergence visible
- Stochastic — K and D values, zone, crossover direction
- Price structure — trend direction, swing highs/lows, key S/R levels

Return your complete analysis as a JSON object matching the exact schema in your instructions. If a price level is unclear, estimate conservatively and note it in warnings.`;

  let response;
  try {
    response = await openai!.chat.completions.create({
      model: AI_MODEL,
      // 1500 max tokens is sufficient for the structured JSON response
      // Original 2048 was wasteful — saves ~25% on output token costs
      max_tokens: 1500,
      temperature: 0.05, // Very low temperature for consistent, disciplined output
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
                // Keep "high" detail for precise indicator reading (RSI values, price levels)
                // Client already resizes to 1024px max — cost is controlled client-side
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
          : "OpenAI API key invalid — showing demo analysis"
      );
      return { result: mockResult, processingTimeMs: Date.now() - start, promptVersion: PROMPT_VERSION, model: "mock-fallback" };
    }
    throw err;
  }

  const processingTimeMs = Date.now() - start;
  const rawText = response.choices[0]?.message?.content ?? "";
  if (!rawText) throw new Error("OpenAI returned empty response");

  const result = parseAndValidate(rawText);

  // Blend AI confidence with rule-based composite signal (70/30 weighting)
  const composite = computeCompositeSignal(result as Parameters<typeof computeCompositeSignal>[0]);
  result.confidence = blendConfidence(result.confidence as number, composite.confidence);

  // Compute trade grade server-side as a safety override if AI missed it or inflated it
  if (!result.tradeGrade || result.tradeGrade === undefined) {
    result.tradeGrade = computeTradeGrade(result);
  } else {
    // Validate AI-assigned grade against our rules — downgrade if needed
    result.tradeGrade = validateTradeGrade(result.tradeGrade as string, result);
  }

  return { result, processingTimeMs, promptVersion: PROMPT_VERSION, model: AI_MODEL };
}

// ── Grade computation ─────────────────────────────────────────────────────────
function computeTradeGrade(result: Record<string, unknown>): string {
  const setup = result.tradeSetup as Record<string, unknown> | undefined;
  if (!setup || setup.type === "wait") return "WAIT";

  const rrRatio = (setup.riskRewardRatio as number) ?? 0;
  const rsi = (result.indicators as Record<string, unknown>)?.rsi as Record<string, unknown> | undefined;
  const ma = (result.indicators as Record<string, unknown>)?.movingAverages as Record<string, unknown> | undefined;
  const structure = result.structure as Record<string, unknown> | undefined;

  const rsiVal = (rsi?.value as number) ?? 50;
  const rsiZone = rsi?.zone as string ?? "neutral";
  const type = setup.type as string;

  // Hard safety rules — prevent bad grades
  if (rrRatio < 1.5) return "Avoid";
  if (type === "buy" && (rsiZone === "overbought" || rsiVal > 75)) {
    return rrRatio >= 2 ? "B" : "Avoid";
  }
  if (type === "sell" && (rsiZone === "oversold" || rsiVal < 25)) {
    return rrRatio >= 2 ? "B" : "Avoid";
  }

  // Count aligned signals
  const isBuy = type === "buy";
  let aligned = 0;
  let total = 0;

  if (ma) {
    total += 3;
    if (isBuy) {
      if (ma.fastAboveSlow) aligned++;
      if (ma.priceAboveFast) aligned++;
      if (ma.crossoverType === "golden") aligned++;
    } else {
      if (!ma.fastAboveSlow) aligned++;
      if (!ma.priceAboveFast) aligned++;
      if (ma.crossoverType === "death") aligned++;
    }
  }
  if (rsi) {
    total++;
    if (isBuy && (rsiZone === "bullish" || rsiZone === "oversold")) aligned++;
    if (!isBuy && (rsiZone === "bearish" || rsiZone === "overbought")) aligned++;
  }

  const alignmentRatio = total > 0 ? aligned / total : 0;
  const trendOk = isBuy
    ? structure?.trend === "uptrend" && structure?.higherHighs === true
    : structure?.trend === "downtrend" && structure?.lowerLows === true;

  if (rrRatio >= 3 && alignmentRatio >= 0.85 && trendOk) return "A+";
  if (rrRatio >= 2 && alignmentRatio >= 0.65 && trendOk) return "A";
  if (rrRatio >= 1.5 && alignmentRatio >= 0.45) return "B";
  return "Avoid";
}

function validateTradeGrade(aiGrade: string, result: Record<string, unknown>): string {
  const setup = result.tradeSetup as Record<string, unknown> | undefined;
  if (!setup || setup.type === "wait") return "WAIT";

  const rsi = (result.indicators as Record<string, unknown>)?.rsi as Record<string, unknown> | undefined;
  const rsiVal = (rsi?.value as number) ?? 50;
  const rsiZone = rsi?.zone as string ?? "neutral";
  const type = setup.type as string;
  const rrRatio = (setup.riskRewardRatio as number) ?? 0;

  // Hard downgrade rules
  if (rrRatio < 1.5) return "Avoid";
  if (type === "buy" && (rsiZone === "overbought" || rsiVal > 75) && (aiGrade === "A+" || aiGrade === "A")) return "B";
  if (type === "sell" && (rsiZone === "oversold" || rsiVal < 25) && (aiGrade === "A+" || aiGrade === "A")) return "B";

  const validGrades = ["A+", "A", "B", "Avoid", "WAIT"];
  return validGrades.includes(aiGrade) ? aiGrade : computeTradeGrade(result);
}

// ── JSON parse & validate ─────────────────────────────────────────────────────
function parseAndValidate(rawText: string): Record<string, unknown> {
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No valid JSON in AI response");
    parsed = JSON.parse(match[0]);
  }

  if (typeof parsed !== "object" || parsed === null) throw new Error("Analysis result is not an object");
  const r = parsed as Record<string, unknown>;

  for (const field of ["marketBias", "structure", "indicators", "tradeSetup", "confidence", "reasoning"]) {
    if (!(field in r)) throw new Error(`Missing required field: ${field}`);
  }

  if (typeof r.confidence === "number") r.confidence = Math.max(0, Math.min(100, r.confidence));
  if (!Array.isArray(r.warnings)) r.warnings = [];
  if (!Array.isArray(r.invalidationConditions)) r.invalidationConditions = [];
  if (!Array.isArray(r.confidenceFactors)) r.confidenceFactors = [];

  // Normalise trend field — AI occasionally outputs variants
  const structure = r.structure as Record<string, unknown> | undefined;
  if (structure && typeof structure.trend === "string") {
    const t = structure.trend.toLowerCase();
    if (t === "sideways" || t === "ranging" || t === "range" || t === "consolidation" || t === "choppy") {
      structure.trend = "ranging";
    } else if (t === "uptrend" || t === "up" || t === "bullish") {
      structure.trend = "uptrend";
    } else if (t === "downtrend" || t === "down" || t === "bearish") {
      structure.trend = "downtrend";
    }
  }

  return r;
}
