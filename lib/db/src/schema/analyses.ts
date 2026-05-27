import { pgTable, serial, text, integer, jsonb, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
  timeframe: text("timeframe").notNull(),
  instrument: text("instrument"),
  imageUrl: text("image_url").notNull(),
  promptVersion: text("prompt_version").notNull().default("1.0.0"),
  aiModel: text("ai_model").notNull().default("gpt-4o-mini"),
  processingTimeMs: integer("processing_time_ms"),
  result: jsonb("result"),
  errorMessage: text("error_message"),
  sessionId: text("session_id"),
  costUsd: doublePrecision("cost_usd").notNull().default(0),
  cacheHit: boolean("cache_hit").notNull().default(false),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
