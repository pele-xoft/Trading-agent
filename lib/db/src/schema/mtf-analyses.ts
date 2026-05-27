import { pgTable, serial, text, integer, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const mtfAnalysesTable = pgTable("mtf_analyses", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  instrument: text("instrument"),
  timeframeResults: jsonb("timeframe_results"),
  confluence: jsonb("confluence"),
  finalSetup: jsonb("final_setup"),
  overallConfidence: integer("overall_confidence"),
  aiModel: text("ai_model").notNull().default("gpt-4o-mini"),
  processingTimeMs: integer("processing_time_ms"),
  status: text("status").notNull().default("complete"),
  costUsd: doublePrecision("cost_usd").notNull().default(0),
});

export type MtfAnalysis = typeof mtfAnalysesTable.$inferSelect;
