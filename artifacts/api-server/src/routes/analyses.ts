import { Router } from "express";
import { db, analysesTable } from "@workspace/db";
import { desc, eq, count } from "drizzle-orm";
import { analyzeChart } from "../lib/ai.service.js";

const router = Router();

const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1D"];

// POST /api/analyses — run analysis
router.post("/", async (req, res) => {
  try {
    const { imageUrl, timeframe } = req.body as { imageUrl?: string; timeframe?: string };

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
    if (estimatedBytes > 10 * 1024 * 1024) {
      return res.status(413).json({ error: "Image exceeds 10MB limit" });
    }

    const { instrument } = req.body as { instrument?: string };

    const { result, processingTimeMs, promptVersion, model } = await analyzeChart({
      imageBase64,
      mimeType,
      timeframe: timeframe as "5m" | "15m" | "1h" | "4h" | "1D",
      instrument,
    });

    const [record] = await db.insert(analysesTable).values({
      status: "complete",
      timeframe,
      instrument: instrument ?? null,
      imageUrl,
      promptVersion,
      aiModel: model,
      processingTimeMs,
      result,
    }).returning();

    return res.status(201).json({
      id: record.id,
      timeframe: record.timeframe,
      imageUrl: record.imageUrl,
      result: record.result,
      promptVersion: record.promptVersion,
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Analysis failed");
    const message = err instanceof Error ? err.message : "Analysis failed";
    return res.status(500).json({ error: message });
  }
});

// GET /api/analyses — list with pagination
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
    const offset = (page - 1) * limit;

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt)).limit(limit).offset(offset),
      db.select({ value: count() }).from(analysesTable),
    ]);

    return res.json({
      analyses: rows.map(r => ({
        id: r.id,
        timeframe: r.timeframe,
        imageUrl: r.imageUrl,
        result: r.result,
        promptVersion: r.promptVersion,
        createdAt: r.createdAt.toISOString(),
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

// GET /api/analyses/stats
router.get("/stats", async (req, res) => {
  try {
    const rows = await db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt));

    let bullish = 0, bearish = 0, neutral = 0, totalConf = 0, confCount = 0;
    const byTimeframe: Record<string, number> = {};

    for (const r of rows) {
      const result = r.result as Record<string, unknown> | null;
      if (result) {
        const bias = result.marketBias as string;
        if (bias === "bullish") bullish++;
        else if (bias === "bearish") bearish++;
        else neutral++;
        if (typeof result.confidence === "number") { totalConf += result.confidence; confCount++; }
      }
      byTimeframe[r.timeframe] = (byTimeframe[r.timeframe] ?? 0) + 1;
    }

    return res.json({
      total: rows.length,
      bullish,
      bearish,
      neutral,
      avgConfidence: confCount > 0 ? Math.round(totalConf / confCount) : 0,
      byTimeframe: Object.entries(byTimeframe).map(([timeframe, cnt]) => ({ timeframe, count: cnt })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    return res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/analyses/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [row] = await db.select().from(analysesTable).where(eq(analysesTable.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "Not found" });

    return res.json({
      id: row.id,
      timeframe: row.timeframe,
      imageUrl: row.imageUrl,
      result: row.result,
      promptVersion: row.promptVersion,
      createdAt: row.createdAt.toISOString(),
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
