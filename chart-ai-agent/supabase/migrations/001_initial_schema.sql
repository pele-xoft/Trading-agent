-- ============================================================
-- CHART AI AGENT — DATABASE SCHEMA
-- Migration: 001_initial_schema
-- Created: 2026-05-26
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ANALYSES TABLE ──────────────────────────────────────────
-- Core table storing every chart analysis

CREATE TABLE analyses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status tracking
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'processing', 'complete', 'error')),

  -- Chart metadata
  timeframe           TEXT NOT NULL
                      CHECK (timeframe IN ('5m', '15m', '1h', '4h', '1D')),
  instrument          TEXT,

  -- Image storage
  image_url           TEXT NOT NULL,
  image_path          TEXT NOT NULL,

  -- AI metadata
  prompt_version      TEXT NOT NULL DEFAULT '1.0.0',
  ai_model            TEXT NOT NULL DEFAULT 'claude-opus-4-5',
  processing_time_ms  INTEGER,

  -- Results
  result              JSONB,
  error_message       TEXT,

  -- User feedback
  user_feedback       JSONB,

  -- Session tracking (for anonymous users pre-auth)
  session_id          TEXT,

  -- Future: user_id UUID REFERENCES auth.users(id)
  CONSTRAINT valid_confidence CHECK (
    result IS NULL OR
    (result->>'confidence')::int BETWEEN 0 AND 100
  )
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_session_id ON analyses(session_id);
CREATE INDEX idx_analyses_timeframe ON analyses(timeframe);

-- Full-text search on instrument (future)
CREATE INDEX idx_analyses_instrument ON analyses(instrument)
  WHERE instrument IS NOT NULL;

-- ─── STORAGE BUCKET ──────────────────────────────────────────
-- Run via Supabase dashboard or Storage API

-- Bucket: chart-uploads
-- Public: false (serve via signed URLs)
-- Max file size: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- ─── RLS POLICIES ────────────────────────────────────────────
-- Basic policies for anonymous access during MVP
-- Tighten when auth is added in Phase 4

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read of all analyses (MVP only — restrict by session_id later)
CREATE POLICY "allow_anonymous_read"
  ON analyses FOR SELECT
  USING (true);

-- Allow anonymous insert
CREATE POLICY "allow_anonymous_insert"
  ON analyses FOR INSERT
  WITH CHECK (true);

-- Allow anonymous update (for status updates from API)
CREATE POLICY "allow_anonymous_update"
  ON analyses FOR UPDATE
  USING (true);

-- ─── VIEWS ───────────────────────────────────────────────────

CREATE VIEW analysis_summary AS
SELECT
  id,
  created_at,
  status,
  timeframe,
  instrument,
  image_url,
  result->>'marketBias' AS market_bias,
  (result->>'confidence')::int AS confidence,
  result->'tradeSetup'->>'type' AS trade_type,
  prompt_version,
  ai_model,
  processing_time_ms
FROM analyses
ORDER BY created_at DESC;

-- ─── SEED DATA (Development only) ────────────────────────────

-- Uncomment to seed test data:
/*
INSERT INTO analyses (
  status, timeframe, instrument, image_url, image_path,
  result, prompt_version, ai_model, processing_time_ms
) VALUES (
  'complete', '1h', 'US500',
  'https://example.com/placeholder.jpg',
  'chart-uploads/test/placeholder.jpg',
  '{
    "marketBias": "bearish",
    "confidence": 72,
    "reasoning": "Seed data for development testing",
    "tradeSetup": {"type": "sell"}
  }',
  '1.0.0', 'claude-opus-4-5', 3200
);
*/
