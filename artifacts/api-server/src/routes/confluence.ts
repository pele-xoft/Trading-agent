import { Router } from "express";
import { analyzeChart } from "../lib/ai.service.js";
import { getMockTimeframeAnalysis, computeMockConfluence } from "../lib/mock-analysis.js";
import { hashImage, getCachedResult, cacheResult } from "../lib/cache.js";
import { db, analysesTable, mtfAnalysesTable } from "@workspace/db";
import { PROMPT_VERSION } from "../lib/prompt-builder.js";
import { confluenceRateLimiter } from "../middleware/rate-limit.js";

const router = Router();

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1D"] as const;
type Timeframe = typeof TIMEFRAMES[number];

const TF_WEIGHTS: Record<string, number> = { "1D": 0.35, "4h": 0.25, "1h": 0.25, "15m": 0.15 };
const HTF = ["1D", "4h"];
const LTF = ["1h", "15m"];
const COST_PER_LIVE_ANALYSIS = 0.001;

const IS_MOCK_MODE =
  process.env.MOCK_MODE === "true" ||
  process.env.OPENAI_API_KEY === "mock" ||
  !process.env.OPENAI_API_KEY;

function biasToScore(b: string): number {
  return b === "bullish" ? 1 : b === "bearish" ? -1 : 0;
}

function weightedAvg(entries: Array<{ bias: string; weight: number }>): number {
  if (entries.length === 0) return 0;
  const totalW = entries.reduce((s, e) => s + e.weight, 0);
  return entries.reduce((s, e) => s + biasToScore(e.bias) * e.weight, 0) / totalW;
}

function scoreConfluence(perTF: Array<{ timeframe: string; bias: string; confidence: number }>) {
  const entries = perTF.map(r => ({ ...r, weight: TF_WEIGHTS[r.timeframe] ?? 0.2 }));
  const htfEntries = entries.filter(e => HTF.includes(e.timeframe));
  const ltfEntries = entries.filter(e => LTF.includes(e.timeframe));

  const htfScore = weightedAvg(htfEntries.map(e => ({ bias: e.bias, weight: e.weight })));
  const ltfScore = weightedAvg(ltfEntries.map(e => ({ bias: e.bias, weight: e.weight })));
  const hasHtf = htfEntries.length > 0;
  const hasLtf = ltfEntries.length > 0;

  const htfDominates = hasHtf && hasLtf &&
    Math.abs(htfScore) >= 0.3 &&
    Math.sign(htfScore) !== Math.sign(ltfScore) &&
    ltfScore !== 0;

  const finalScore = htfDominates
    ? htfScore
    : (hasHtf && hasLtf ? htfScore * 0.6 + ltfScore * 0.4 : weightedAvg(entries.map(e => ({ bias: e.bias, weight: e.weight }))));

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

  const agreeCount = entries.filter(e => e.bias === overallBias).length;
  const allAgree = agreeCount === entries.length;

  const baseConf = Math.round(entries.reduce((s, e) => s + e.confidence, 0) / entries.length);
  const confBoost = allAgree ? 20 : agreeCount >= 3 ? 10 : overallBias === "conflicted" ? -10 : 0;
  const overallConfidence = Math.max(0, Math.min(100, baseConf + confBoost));

  const higherTimeframeBias = htfEntries.length > 0
    ? (htfScore > 0 ? "bullish" : htfScore < 0 ? "bearish" : "neutral")
    : overallBias;

  const entryTFPreference = ["1h", "15m", "4h", "1D"];
  const entryTimeframe = entryTFPreference.find(tf => perTF.some(r => r.timeframe === tf)) ?? perTF[0]?.timeframe;

  const recommendation = overallBias === "bullish" ? (htfDominates ? "wait" : "buy") :
    overallBias === "bearish" ? (htfDominates ? "wait" : "sell") : "wait";

  const conflictingSignals: string[] = [];
  if (htfDominates) {
    const ltfBiasLabel = ltfScore > 0 ? "bullish" : "bearish";
    conflictingSignals.push(`Lower timeframes show ${ltfBiasLabel} — this is a retracement within the higher-timeframe ${higherTimeframeBias} trend`);
  }
  entries.filter(e => e.bias !== overallBias && overallBias !== "conflicted").forEach(e => {
    conflictingSignals.push(`${e.timeframe} diverges — showing ${e.bias} vs consensus ${overallBias}`);
  });

  const agreeList = entries.filter(e => e.bias === overallBias).map(e => e.timeframe).join(", ");
  let reasoning = overallBias === "conflicted"
    ? "Timeframes are genuinely split — no clear directional consensus. Do not trade until alignment improves."
    : `${agreeCount}/${entries.length} timeframes confirm ${overallBias} bias (${agreeList}).`;
  if (htfDominates) reasoning += ` Higher-timeframe trend ${higherTimeframeBias} dominates — lower-TF counter-move is a retracement. Wait for ${entryTimeframe} to confirm before entering.`;
  else if (allAgree) reasoning += " Full alignment — this is a high-conviction setup.";

  let entryCondition: string;
  if (overallBias === "conflicted") {
    entryCondition = "No trade — timeframes are split. Wait for directional clarity before risking capital.";
  } else if (htfDominates) {
    entryCondition = `${entryTimeframe} is currently counter-trend (retracement). Wait for ${entryTimeframe} to confirm ${higherTimeframeBias} direction — stochastic exit from oversold/overbought + price reclaim of fast MA is the trigger.`;
  } else if (allAgree) {
    entryCondition = `All timeframes aligned ${overallBias}. Enter ${overallBias === "bullish" ? "long" : "short"} at the nearest ${entryTimeframe} support retest.`;
  } else {
    const waitFor = entries.filter(e => e.bias !== overallBias).map(e => e.timeframe).join(", ");
    entryCondition = `Wait for ${waitFor} to confirm ${overallBias} before entering.`;
  }

  const perTimeframeScored = entries.map(e => ({
    timeframe: e.timeframe,
    bias: e.bias,
    confidence: e.confidence,
    aligned: e.bias === overallBias,
    isRetracement: htfDominates && LTF.includes(e.timeframe) && e.bias !== overallBias,
  }));

  return {
    overallBias, alignmentScore, confluenceStrength, alignedCount: agreeCount,
    totalCount: entries.length, higherTimeframeBias, entryTimeframe,
    recommendation, reasoning, entryCondition, conflictingSignals,
    overallConfidence, perTimeframeScored,
  };
}

// POST /api/confluence
router.post("/", confluenceRateLimiter, async (req, res) => {
  const startTime = Date.now();
  try {
    const { charts, instrument } = req.body as {
      charts?: Array<{ imageUrl: string; timeframe: string }>;
      instrument?: string;
    };

    if (!Array.isArray(charts) || charts.length < 2) {
      return res.status(400).json({ error: "Provide at least 2 charts for confluence analysis" });
    }
    if (charts.length > 5) {
      return res.status(400).json({ error: "Maximum 5 charts per confluence analysis" });
    }
    for (const c of charts) {
      if (!TIMEFRAMES.includes(c.timeframe as Timeframe)) {
        return res.status(400).json({ error: `Invalid timeframe: ${c.timeframe}` });
      }
    }

    const timeframes = charts.map(c => c.timeframe);

    // Run all TF analyses in parallel
    const perTimeframe = await Promise.all(
      charts.map(async (chart) => {
        const match = chart.imageUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!match) throw new Error(`Invalid image URL for ${chart.timeframe}`);
        const [, mimeType, imageBase64] = match;
        const tf = chart.timeframe as Timeframe;

        const hash = hashImage(imageBase64);
        const cached = getCachedResult(hash);

        let result: Record<string, unknown>;
        let fromCache = false;

        if (cached) {
          result = cached as Record<string, unknown>;
          fromCache = true;
        } else if (IS_MOCK_MODE) {
          await new Promise(r => setTimeout(r, 300 + Math.random() * 300));
          result = getMockTimeframeAnalysis(tf) as Record<string, unknown>;
          cacheResult(hash, result);
        } else {
          const analysis = await analyzeChart({ imageBase64, mimeType, timeframe: tf, instrument });
          result = analysis.result;
          cacheResult(hash, result);
        }

        // Persist individual analysis record
        await db.insert(analysesTable).values({
          status: "complete",
          timeframe: tf,
          imageUrl: chart.imageUrl,
          promptVersion: PROMPT_VERSION,
          aiModel: fromCache ? "cache" : IS_MOCK_MODE ? "mock" : "gpt-4o-mini",
          processingTimeMs: 0,
          result,
          costUsd: fromCache || IS_MOCK_MODE ? 0 : COST_PER_LIVE_ANALYSIS,
          cacheHit: fromCache,
        });

        return {
          timeframe: tf,
          result,
          fromCache,
          bias: result.marketBias as string,
          confidence: result.confidence as number,
          trend: (result.structure as Record<string, unknown>)?.trend as string,
          rsi: ((result.indicators as Record<string, unknown>)?.rsi as Record<string, unknown>)?.value as number,
          keyLevel: (result.structure as Record<string, unknown>)?.keyLevel as number,
          entrySignal: (result.tradeSetup as Record<string, unknown>)?.type as string,
          costUsd: fromCache || IS_MOCK_MODE ? 0 : COST_PER_LIVE_ANALYSIS,
        };
      })
    );

    // Compute weighted confluence
    let confluenceData: ReturnType<typeof computeMockConfluence>;

    if (IS_MOCK_MODE) {
      confluenceData = computeMockConfluence(timeframes);
    } else {
      const scored = scoreConfluence(perTimeframe.map(r => ({
        timeframe: r.timeframe,
        bias: r.bias,
        confidence: r.confidence,
      })));

      // Build finalSetup from entry TF
      const entryTF = perTimeframe.find(r => r.timeframe === scored.entryTimeframe);
      const entryTFSetup = entryTF?.result?.tradeSetup as Record<string, unknown> | undefined;
      const finalSetup = {
        type: scored.recommendation,
        entryZone: entryTFSetup?.entryZone ?? { low: 0, high: 0 },
        stopLoss: entryTFSetup?.stopLoss ?? 0,
        stopLossRationale: entryTFSetup?.stopLossRationale ?? "Derived from entry timeframe analysis",
        takeProfits: entryTFSetup?.takeProfits ?? [],
        riskRewardRatio: entryTFSetup?.riskRewardRatio ?? 0,
        entryTimeframe: scored.entryTimeframe,
        rationale: scored.recommendation === "wait"
          ? `Wait for ${scored.entryTimeframe} confirmation. ${scored.entryCondition}`
          : `Enter ${scored.recommendation === "buy" ? "long" : "short"} at ${scored.entryTimeframe} entry zone.`,
      };

      confluenceData = {
        ...scored,
        finalSetup,
        perTimeframe: perTimeframe.map(r => ({
          timeframe: r.timeframe,
          bias: r.bias,
          confidence: r.confidence,
          trend: r.trend,
          rsi: r.rsi,
          recommendation: r.entrySignal,
          aligned: r.bias === scored.overallBias,
          isRetracement: scored.perTimeframeScored.find(s => s.timeframe === r.timeframe)?.isRetracement ?? false,
          keyLevel: r.keyLevel,
        })),
      } as unknown as ReturnType<typeof computeMockConfluence>;
    }

    const totalCostUsd = perTimeframe.reduce((s, r) => s + r.costUsd, 0);
    const processingTimeMs = Date.now() - startTime;

    // Store MTF result
    const [mtfRecord] = await db.insert(mtfAnalysesTable).values({
      instrument: instrument ?? null,
      timeframeResults: perTimeframe.reduce((acc, r) => ({
        ...acc,
        [r.timeframe]: { bias: r.bias, confidence: r.confidence, trend: r.trend, rsi: r.rsi, keyLevel: r.keyLevel },
      }), {} as Record<string, unknown>),
      confluence: {
        alignmentScore: confluenceData.alignmentScore,
        dominantBias: confluenceData.overallBias,
        agreement: confluenceData.confluenceStrength,
        higherTimeframeBias: confluenceData.higherTimeframeBias,
        entryTimeframe: confluenceData.entryTimeframe,
        conflictingSignals: confluenceData.conflictingSignals,
        summary: confluenceData.reasoning,
      },
      finalSetup: confluenceData.finalSetup,
      overallConfidence: confluenceData.overallConfidence,
      aiModel: IS_MOCK_MODE ? "mock" : "gpt-4o-mini",
      processingTimeMs,
      costUsd: totalCostUsd,
    }).returning();

    return res.status(200).json({
      id: mtfRecord.id,
      instrument: instrument ?? null,
      analyzedAt: mtfRecord.createdAt.toISOString(),
      timeframes: perTimeframe.reduce((acc, r) => ({
        ...acc,
        [r.timeframe]: {
          bias: r.bias,
          confidence: r.confidence,
          keyLevel: r.keyLevel,
          trend: r.trend,
          rsi: r.rsi,
          entrySignal: r.entrySignal,
        },
      }), {} as Record<string, unknown>),
      confluence: {
        alignmentScore: confluenceData.alignmentScore,
        dominantBias: confluenceData.overallBias,
        agreement: confluenceData.confluenceStrength,
        higherTimeframeBias: confluenceData.higherTimeframeBias,
        entryTimeframe: confluenceData.entryTimeframe,
        conflictingSignals: confluenceData.conflictingSignals,
        summary: confluenceData.reasoning,
      },
      finalSetup: confluenceData.finalSetup,
      overallConfidence: confluenceData.overallConfidence,
      reasoning: confluenceData.reasoning,
      entryCondition: confluenceData.entryCondition,
      invalidationConditions: perTimeframe.flatMap(r =>
        ((r.result as Record<string, unknown>).invalidationConditions as string[] ?? []).slice(0, 1).map((c: string) => `[${r.timeframe}] ${c}`)
      ).slice(0, 4),
      warnings: IS_MOCK_MODE ? ["Demo mode — analyses are simulated"] : [],
      isMockMode: IS_MOCK_MODE,
      totalCostUsd,
      // Enriched per-TF for UI bars
      perTimeframe: confluenceData.perTimeframe,
      analyses: perTimeframe.map(r => ({ timeframe: r.timeframe, result: r.result, fromCache: r.fromCache })),
    });
  } catch (err) {
    req.log.error({ err }, "Confluence analysis failed");
    return res.status(500).json({ error: err instanceof Error ? err.message : "Confluence analysis failed" });
  }
});

export default router;
