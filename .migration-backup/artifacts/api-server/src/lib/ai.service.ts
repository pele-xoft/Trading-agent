import OpenAI from "openai";
import { buildAnalysisPrompt, PROMPT_VERSION } from "./prompt-builder.js";
import { computeCompositeSignal, blendConfidence } from "./indicator-engine.js";
import { getMockAnalysis } from "./mock-analysis.js";

const isMockMode =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true" ||
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
    // Simulate a realistic delay
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const result = getMockAnalysis() as Record<string, unknown>;
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

Return your complete technical analysis as a JSON object matching the exact structure in your instructions.

Read carefully:
- The two moving averages (fast = yellow, slow = blue)
- The RSI oscillator and its current value
- The Stochastic oscillator (K and D lines) and current values
- Price structure: trend direction, key swing highs/lows
- Support and resistance levels

Be precise with price levels. If a value is hard to read exactly, estimate conservatively and add a warning.`;

  const response = await openai!.chat.completions.create({
    model: AI_MODEL,
    max_tokens: 2048,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${params.mimeType};base64,${params.imageBase64}`, detail: "high" } },
          { type: "text", text: userText },
        ],
      },
    ],
  });

  const processingTimeMs = Date.now() - start;
  const rawText = response.choices[0]?.message?.content ?? "";

  if (!rawText) throw new Error("OpenAI returned empty response");

  const result = parseAndValidate(rawText);

  const composite = computeCompositeSignal(result as Parameters<typeof computeCompositeSignal>[0]);
  result.confidence = blendConfidence(result.confidence as number, composite.confidence);

  return { result, processingTimeMs, promptVersion: PROMPT_VERSION, model: AI_MODEL };
}

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

  return r;
}
