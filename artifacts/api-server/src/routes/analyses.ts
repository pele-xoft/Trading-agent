import { Router } from "express";
import { db, analysesTable } from "@workspace/db";
import { desc, eq, count, sum, gte, sql } from "drizzle-orm";
import { analyzeChart } from "../lib/ai.service.js";
import { hashImage, getCachedResult, cacheResult, getCacheHits } from "../lib/cache.js";
import { PROMPT_VERSION } from "../lib/prompt-builder.js";
import { analysisRateLimiter } from "../middleware/rate-limit.js";
import rateLimit from "express-rate-limit";

const router = Router();

const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1D"];

const DAILY_LIMIT_USD = 2.00;
const MONTHLY_LIMIT_USD = 10.00;
const COST_PER_LIVE_ANALYSIS = 0.001;

const IS_MOCK_MODE =
  process.env.MOCK_MODE === "true" ||
  process.env.OPENAI_API_KEY === "mock" ||
  !process.env.OPENAI_API_KEY;

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Rate limit: max 20 analysis requests per 10 minutes per IP
const analysisLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analysis requests. Please wait a few minutes before trying again." },
});

// Rate limit: max 100 read requests per minute per IP
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests." },
});

// Strip large base64 imageUrl from list responses to save bandwidth.
// Full imageUrl is only returned on single-record GET.
function stripImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl || imageUrl.startsWith("data:")) return null;
  return imageUrl;
}

// GET /api/analyses/config
router.get("/config", (_req, res) => {
  res.json({
    isMockMode: IS_MOCK_MODE,
    dailyLimitUsd: DAILY_LIMIT_USD,
    monthlyLimitUsd: MONTHLY_LIMIT_USD,
    costPerAnalysisUsd: IS_MOCK_MODE ? 0 : COST_PER_LIVE_ANALYSIS,
  });
});

// POST /api/analyses — run analysis
router.post("/", analysisRateLimiter, async (req, res) => {
  try {
    const { imageUrl, timeframe, instrument } = req.body as {
      imageUrl?: string;
      timeframe?: string;
      instrument?: string;
    };

    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl is required" });
    }
    if (!timeframe || !TIMEFRAMES.includes(timeframe)) {
      return res.status(400).json({ error: `timeframe must be one of: ${TIMEFRAMES.join(", ")}` });
    }

    const dataUrlMatch = imageUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      return res.status(400).json({ error: "imageUrl must be a base64 data URL (data:image/...;base64,...)" });
    }

    const mimeType = dataUrlMatch[1];
    const imageBase64 = dataUrlMatch[2];

    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: `Unsupported image type: ${mimeType}` });
    }

    const estimatedBytes = (imageBase64.length * 3) / 4;
    if (estimatedBytes > 8 * 1024 * 1024) {
      return res.status(413).json({
        error: "Image exceeds 8MB limit. Please compress or resize the image before uploading.",
      });
    }

    // Daily cost limit check (live mode only)
    if (!IS_MOCK_MODE) {
      const [{ value: todaySpend }] = await db
        .select({ value: sum(analysesTable.costUsd) })
        .from(analysesTable)
        .where(gte(analysesTable.createdAt, startOfDay()));
      if (Number(todaySpend ?? 0) >= DAILY_LIMIT_USD) {
        return res.status(429).json({
          error: `Daily analysis limit reached ($${DAILY_LIMIT_USD.toFixed(2)}). Resets at midnight.`,
          code: "DAILY_LIMIT_REACHED",
        });
      }
    }

    // Cache check
    const imageHash = hashImage(imageBase64);
    const cached = getCachedResult(imageHash);
    if (cached) {
      const [record] = await db.insert(analysesTable).values({
        status: "complete",
        timeframe,
        instrument: instrument ?? null,
        imageUrl,
        promptVersion: PROMPT_VERSION,
        aiModel: "cache",
        processingTimeMs: 0,
        result: cached as Record<string, unknown>,
        costUsd: 0,
        cacheHit: true,
      }).returning();

      return res.status(201).json({
        id: record.id,
        timeframe: record.timeframe,
        instrument: record.instrument,
        imageUrl: record.imageUrl,
        result: record.result,
        promptVersion: record.promptVersion,
        aiModel: record.aiModel,
        processingTimeMs: record.processingTimeMs,
        createdAt: record.createdAt.toISOString(),
        cached: true,
        costUsd: 0,
      });
    }

    const { result, processingTimeMs, promptVersion, model } = await analyzeChart({
      imageBase64,
      mimeType,
      timeframe: timeframe as "5m" | "15m" | "1h" | "4h" | "1D",
      instrument,
    });

    const isMockResult = model === "mock" || model === "mock-fallback";
    const costUsd = isMockResult ? 0 : COST_PER_LIVE_ANALYSIS;

    cacheResult(imageHash, result);

    const [record] = await db.insert(analysesTable).values({
      status: "complete",
      timeframe,
      instrument: instrument ?? null,
      imageUrl,
      promptVersion,
      aiModel: model,
      processingTimeMs,
      result,
      costUsd,
      cacheHit: false,
    }).returning();

    return res.status(201).json({
      id: record.id,
      timeframe: record.timeframe,
      instrument: record.instrument,
      imageUrl: record.imageUrl,
      result: record.result,
      promptVersion: record.promptVersion,
      aiModel: record.aiModel,
      processingTimeMs: record.processingTimeMs,
      createdAt: record.createdAt.toISOString(),
      cached: false,
      costUsd,
    });
  } catch (err) {
    req.log.error({ err }, "Analysis failed");
    const message = err instanceof Error ? err.message : "Analysis failed";
    return res.status(500).json({ error: message });
  }
});

// GET /api/analyses — paginated list (imageUrl stripped to save bandwidth)
router.get("/", readLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
    const offset = (page - 1) * limit;

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt)).limit(limit).offset(offset),
      db.select({ value: count() }).from(analysesTable),
    ]);

    return res.json({
      analyses: rows.map((r) => ({
        id: r.id,
        timeframe: r.timeframe,
        instrument: r.instrument,
        imageUrl: stripImageUrl(r.imageUrl),
        result: r.result,
        promptVersion: r.promptVersion,
        aiModel: r.aiModel,
        processingTimeMs: r.processingTimeMs,
        createdAt: r.createdAt.toISOString(),
        cached: r.cacheHit,
        costUsd: r.costUsd,
      })),
      total: Number(total),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list analyses");
    return res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// GET /api/analyses/stats — SQL-aggregated (no full table scan in memory)
router.get("/stats", readLimiter, async (req, res) => {
  try {
    const [aggregates, byTimeframeRows, todaySpendRows, monthSpendRows] = await Promise.all([
      db
        .select({
          total: count(),
          bullish: sql<number>`COUNT(CASE WHEN result->>'marketBias' = 'bullish' THEN 1 END)`.mapWith(Number),
          bearish: sql<number>`COUNT(CASE WHEN result->>'marketBias' = 'bearish' THEN 1 END)`.mapWith(Number),
          neutral: sql<number>`COUNT(CASE WHEN result->>'marketBias' = 'neutral' THEN 1 END)`.mapWith(Number),
          avgConfidence: sql<number>`ROUND(AVG(NULLIF((result->>'confidence')::numeric, 0)))`.mapWith(Number),
          totalCostUsd: sum(analysesTable.costUsd),
          liveCount: sql<number>`COUNT(CASE WHEN NOT cache_hit AND cost_usd > 0 THEN 1 END)`.mapWith(Number),
        })
        .from(analysesTable),
      db
        .select({ timeframe: analysesTable.timeframe, count: count() })
        .from(analysesTable)
        .groupBy(analysesTable.timeframe)
        .orderBy(analysesTable.timeframe),
      db.select({ value: sum(analysesTable.costUsd) })
        .from(analysesTable)
        .where(gte(analysesTable.createdAt, startOfDay())),
      db.select({ value: sum(analysesTable.costUsd) })
        .from(analysesTable)
        .where(gte(analysesTable.createdAt, startOfMonth())),
    ]);

    const agg = aggregates[0];
    const totalCost = Number(agg?.totalCostUsd ?? 0);
    const liveCount = Number(agg?.liveCount ?? 0);
    const todayCostUsd = Number(todaySpendRows[0]?.value ?? 0);
    const monthlyCostUsd = Number(monthSpendRows[0]?.value ?? 0);

    return res.json({
      total: Number(agg?.total ?? 0),
      bullish: Number(agg?.bullish ?? 0),
      bearish: Number(agg?.bearish ?? 0),
      neutral: Number(agg?.neutral ?? 0),
      avgConfidence: agg?.avgConfidence ?? 0,
      byTimeframe: byTimeframeRows.map((r) => ({ timeframe: r.timeframe, count: Number(r.count) })),
      todayCostUsd: Math.round(todayCostUsd * 100000) / 100000,
      monthlyCostUsd: Math.round(monthlyCostUsd * 100000) / 100000,
      totalCostUsd: Math.round(totalCost * 100000) / 100000,
      dailyLimitUsd: DAILY_LIMIT_USD,
      monthlyLimitUsd: MONTHLY_LIMIT_USD,
      avgCostPerAnalysis: liveCount > 0 ? Math.round((totalCost / liveCount) * 100000) / 100000 : 0,
      cacheHits: getCacheHits(),
      isMockMode: IS_MOCK_MODE,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    return res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/analyses/:id — single record with full imageUrl
router.get("/:id", readLimiter, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [row] = await db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.id, id))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Not found" });

    return res.json({
      id: row.id,
      timeframe: row.timeframe,
      instrument: row.instrument,
      imageUrl: row.imageUrl,
      result: row.result,
      promptVersion: row.promptVersion,
      aiModel: row.aiModel,
      processingTimeMs: row.processingTimeMs,
      createdAt: row.createdAt.toISOString(),
      cached: row.cacheHit,
      costUsd: row.costUsd,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get analysis");
    return res.status(500).json({ error: "Failed to get analysis" });
  }
});

// DELETE /api/analyses/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await db.delete(analysesTable).where(eq(analysesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete analysis");
    return res.status(500).json({ error: "Failed to delete analysis" });
  }
});

export default router;
