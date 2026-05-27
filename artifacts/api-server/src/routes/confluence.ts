import { Router } from "express";
import { analyzeChart } from "../lib/ai.service.js";
import { getMockTimeframeAnalysis, computeMockConfluence } from "../lib/mock-analysis.js";
import { hashImage, getCachedResult, cacheResult } from "../lib/cache.js";
import { db, analysesTable } from "@workspace/db";

const router = Router();

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1D"] as const;
type Timeframe = typeof TIMEFRAMES[number];

const IS_MOCK_MODE =
  process.env.MOCK_MODE === "true" ||
  process.env.OPENAI_API_KEY === "mock" ||
  !process.env.OPENAI_API_KEY;

const COST_PER_LIVE_ANALYSIS = 0.001;

// POST /api/confluence
router.post("/", async (req, res) => {
  try {
    const { charts } = req.body as {
      charts?: Array<{ imageUrl: string; timeframe: string }>;
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
      if (!c.imageUrl?.match(/^data:image\/[a-z]+;base64,/)) {
        return res.status(400).json({ error: "Each chart must be a base64 data URL" });
      }
    }

    const timeframes = charts.map(c => c.timeframe);

    // --- Run individual analyses in parallel (with cache) ---
    const perTimeframe = await Promise.all(
      charts.map(async (chart) => {
        const dataUrlMatch = chart.imageUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!dataUrlMatch) throw new Error("Invalid image URL");
        const mimeType = dataUrlMatch[1];
        const imageBase64 = dataUrlMatch[2];
        const tf = chart.timeframe as Timeframe;

        // Check cache first
        const hash = hashImage(imageBase64);
        const cached = getCachedResult(hash);
        if (cached) {
          return {
            timeframe: tf,
            result: cached as Record<string, unknown>,
            fromCache: true,
            costUsd: 0,
          };
        }

        let result: Record<string, unknown>;
        let costUsd = 0;

        if (IS_MOCK_MODE) {
          await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
          result = getMockTimeframeAnalysis(tf) as Record<string, unknown>;
        } else {
          const analysis = await analyzeChart({ imageBase64, mimeType, timeframe: tf });
          result = analysis.result;
          costUsd = COST_PER_LIVE_ANALYSIS;
        }

        cacheResult(hash, result);

        // Persist individual record
        await db.insert(analysesTable).values({
          status: "complete",
          timeframe: tf,
          imageUrl: chart.imageUrl,
          promptVersion: "1.0.0",
          aiModel: IS_MOCK_MODE ? "mock" : "gpt-4o-mini",
          processingTimeMs: 0,
          result,
          costUsd,
          cacheHit: false,
        });

        return { timeframe: tf, result, fromCache: false, costUsd };
      })
    );

    // --- Compute confluence ---
    let confluenceSummary: Record<string, unknown>;

    if (IS_MOCK_MODE) {
      confluenceSummary = computeMockConfluence(timeframes) as Record<string, unknown>;
    } else {
      confluenceSummary = computeConfluenceFromResults(perTimeframe) as Record<string, unknown>;
    }

    const totalCostUsd = perTimeframe.reduce((s, r) => s + r.costUsd, 0);

    return res.status(200).json({
      confluence: {
        ...confluenceSummary,
        perTimeframe: perTimeframe.map(r => ({
          timeframe: r.timeframe,
          bias: (r.result as Record<string, unknown>).marketBias,
          confidence: (r.result as Record<string, unknown>).confidence,
          trend: ((r.result as Record<string, unknown>).structure as Record<string, unknown>)?.trend,
          rsi: (((r.result as Record<string, unknown>).indicators as Record<string, unknown>)?.rsi as Record<string, unknown>)?.value,
          recommendation: (((r.result as Record<string, unknown>).tradeSetup as Record<string, unknown>)?.type) ?? "wait",
          fromCache: r.fromCache,
          aligned: (r.result as Record<string, unknown>).marketBias === confluenceSummary.overallBias,
        })),
        totalCostUsd,
        isMockMode: IS_MOCK_MODE,
      },
      // Full individual results for expandable detail
      analyses: perTimeframe.map(r => ({
        timeframe: r.timeframe,
        result: r.result,
        fromCache: r.fromCache,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Confluence analysis failed");
    const message = err instanceof Error ? err.message : "Confluence analysis failed";
    return res.status(500).json({ error: message });
  }
});

function computeConfluenceFromResults(perTF: Array<{ timeframe: string; result: Record<string, unknown>; fromCache: boolean; costUsd: number }>) {
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  for (const { result } of perTF) {
    const bias = result.marketBias as string;
    if (bias in counts) counts[bias as keyof typeof counts]++;
  }

  const total = perTF.length;
  const dominant = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as string;
  const alignedCount = counts[dominant as keyof typeof counts];
  const alignmentScore = Math.round((alignedCount / total) * 100);

  let confluenceStrength = "weak";
  if (alignmentScore >= 100) confluenceStrength = "perfect";
  else if (alignmentScore >= 75) confluenceStrength = "strong";
  else if (alignmentScore >= 50) confluenceStrength = "moderate";
  else confluenceStrength = "divergent";

  const isAllAligned = alignedCount === total;
  const recommendation = dominant === "bullish" ? (isAllAligned ? "buy" : "wait") :
    dominant === "bearish" ? (isAllAligned ? "sell" : "wait") : "wait";

  const divergentTFs = perTF.filter(r => r.result.marketBias !== dominant).map(r => r.timeframe);
  let reasoning = `${alignedCount}/${total} timeframes show ${dominant} bias.`;
  if (divergentTFs.length > 0) reasoning += ` ${divergentTFs.join(", ")} diverge — monitor for alignment.`;

  const entryCondition = isAllAligned
    ? `All timeframes aligned ${dominant}. Enter on next pullback confirmation.`
    : `Wait for ${divergentTFs.join(", ")} to confirm ${dominant} direction before entering.`;

  return { overallBias: dominant, alignmentScore, confluenceStrength, alignedCount, totalCount: total, recommendation, reasoning, entryCondition };
}

export default router;
