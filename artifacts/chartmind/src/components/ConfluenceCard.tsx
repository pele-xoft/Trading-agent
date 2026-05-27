import { useState } from "react";
import type { AnalysisResult } from "../types";

type Bias = "bullish" | "bearish" | "neutral" | "conflicted";
type Strength = "strong" | "moderate" | "weak" | "conflicted" | "perfect";
type TradeType = "buy" | "sell" | "wait";

interface TFSummary {
  timeframe: string;
  bias: Bias;
  confidence: number;
  trend: string;
  rsi: number;
  recommendation: string;
  aligned: boolean;
  isRetracement?: boolean;
  keyLevel?: number;
}

interface FinalSetup {
  type: TradeType;
  entryZone: { low: number; high: number };
  stopLoss: number;
  stopLossRationale: string;
  takeProfits: Array<{ level: number; label: string; rationale?: string }>;
  riskRewardRatio: number;
  entryTimeframe: string;
  rationale: string;
}

interface ConfluenceData {
  id?: number;
  instrument?: string;
  analyzedAt?: string;
  overallBias?: Bias;
  confluence: {
    alignmentScore: number;
    dominantBias: Bias;
    agreement: Strength;
    higherTimeframeBias: string;
    entryTimeframe: string;
    conflictingSignals: string[];
    summary: string;
  };
  finalSetup: FinalSetup;
  overallConfidence: number;
  reasoning: string;
  entryCondition: string;
  invalidationConditions: string[];
  warnings: string[];
  isMockMode: boolean;
  totalCostUsd: number;
  perTimeframe: TFSummary[];
  analyses: Array<{ timeframe: string; result: AnalysisResult }>;
}

const BIAS_CFG = {
  bullish:   { label: "BULLISH",   color: "var(--cm-bullish)",  bg: "var(--cm-bullish-dim)",  icon: "▲" },
  bearish:   { label: "BEARISH",   color: "var(--cm-bearish)",  bg: "var(--cm-bearish-dim)",  icon: "▼" },
  neutral:   { label: "NEUTRAL",   color: "var(--cm-neutral)",  bg: "var(--cm-neutral-dim)",  icon: "→" },
  conflicted:{ label: "CONFLICTED",color: "var(--cm-accent)",   bg: "var(--cm-accent-dim)",   icon: "⚡" },
};

const REC_CFG = {
  buy:  { label: "BUY",  color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)" },
  sell: { label: "SELL", color: "var(--cm-bearish)", bg: "var(--cm-bearish-dim)" },
  wait: { label: "WAIT", color: "var(--cm-neutral)", bg: "var(--cm-neutral-dim)" },
};

const STRENGTH_COLOR: Record<string, string> = {
  perfect:    "var(--cm-bullish)",
  strong:     "var(--cm-bullish)",
  moderate:   "var(--cm-accent)",
  weak:       "var(--cm-neutral)",
  conflicted: "var(--cm-bearish)",
};

const TF_ORDER = ["15m", "1h", "4h", "1D"];

function fmt(n: number | undefined | null) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 5 });
}

// ─── Visual TF alignment bars ────────────────────────────────────────────────
function TFBar({ tf }: { tf: TFSummary }) {
  const bias = BIAS_CFG[tf.bias] ?? BIAS_CFG.neutral;
  const barWidth = `${tf.confidence}%`;
  const confColor = tf.confidence >= 70 ? bias.color : tf.confidence >= 50 ? "var(--cm-accent)" : "hsl(var(--muted-foreground))";

  return (
    <div className="flex items-center gap-2 py-1">
      {/* TF label */}
      <span className="text-xs font-bold w-8 flex-shrink-0 text-right"
        style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--muted-foreground))" }}>
        {tf.timeframe}
      </span>

      {/* Bias + direction icon */}
      <div className="flex items-center gap-1 w-24 flex-shrink-0">
        <span className="text-xs font-black" style={{ color: bias.color }}>{bias.icon}</span>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ background: bias.bg, color: bias.color, fontFamily: "var(--font-mono, monospace)", fontSize: "0.6rem" }}>
          {bias.label}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="flex-1 flex items-center gap-1.5">
        <div className="flex-1 h-3 rounded overflow-hidden relative" style={{ background: "hsl(var(--border))" }}>
          <div className="h-full rounded transition-all duration-700"
            style={{ width: barWidth, background: bias.color, opacity: tf.aligned ? 0.85 : 0.35 }} />
        </div>
        <span className="text-xs font-bold w-8 text-right flex-shrink-0"
          style={{ fontFamily: "var(--font-mono, monospace)", color: confColor }}>
          {tf.confidence}%
        </span>
      </div>

      {/* Aligned indicator */}
      <div className="w-4 flex-shrink-0 flex justify-center">
        {tf.isRetracement ? (
          <span className="text-xs" style={{ color: "var(--cm-accent)" }} title="Retracement — HTF trend dominates">↩</span>
        ) : tf.aligned ? (
          <span className="text-xs" style={{ color: "var(--cm-bullish)" }}>✓</span>
        ) : (
          <span className="text-xs" style={{ color: "var(--cm-bearish)" }}>✗</span>
        )}
      </div>
    </div>
  );
}

// ─── Alignment score ring ─────────────────────────────────────────────────────
function AlignmentRing({ score, strength }: { score: number; strength: string }) {
  const color = STRENGTH_COLOR[strength] ?? "var(--cm-neutral)";
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="5" stroke="hsl(var(--border))" />
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="5" stroke={color}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-black leading-none" style={{ fontFamily: "var(--font-mono, monospace)", color }}>{score}%</span>
        </div>
      </div>
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color, fontFamily: "var(--font-mono, monospace)" }}>
        {strength}
      </span>
    </div>
  );
}

// ─── Final trade setup section ────────────────────────────────────────────────
function SetupSection({ setup }: { setup: FinalSetup }) {
  const rec = REC_CFG[setup.type];

  return (
    <div className="rounded-xl p-3.5 flex flex-col gap-3"
      style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            Final Setup
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: rec.bg, color: rec.color, fontFamily: "var(--font-mono, monospace)" }}>
            {rec.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Entry TF:</span>
          <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-accent)" }}>
            {setup.entryTimeframe}
          </span>
          {setup.riskRewardRatio > 0 && (
            <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-accent)" }}>
              R:R {setup.riskRewardRatio.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {setup.type !== "wait" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Entry Zone</span>
              <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--foreground))" }}>
                {fmt(setup.entryZone.low)} – {fmt(setup.entryZone.high)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Stop Loss</span>
              <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-bearish)" }}>
                {fmt(setup.stopLoss)}
              </span>
            </div>
          </div>

          {setup.takeProfits.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {setup.takeProfits.slice(0, 3).map((tp, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{tp.label}</span>
                  <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-bullish)" }}>
                    {fmt(tp.level)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            SL rationale: {setup.stopLossRationale}
          </p>
        </>
      ) : (
        <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
          {setup.rationale}
        </p>
      )}
    </div>
  );
}

// ─── Expanded TF detail ───────────────────────────────────────────────────────
function ExpandedDetail({ timeframe, result }: { timeframe: string; result: AnalysisResult }) {
  if (!result) return null;
  return (
    <div className="mx-2 mb-2 rounded-xl p-3 flex flex-col gap-2 cm-fade-in"
      style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
      <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{result.reasoning}</p>
      {result.tradeSetup?.type !== "wait" && (
        <div className="flex gap-4 text-xs">
          <span style={{ color: "hsl(var(--muted-foreground))" }}>Entry <span style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--foreground))" }}>{fmt(result.tradeSetup?.entryZone?.low)}</span></span>
          <span style={{ color: "hsl(var(--muted-foreground))" }}>SL <span style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-bearish)" }}>{fmt(result.tradeSetup?.stopLoss)}</span></span>
        </div>
      )}
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export function ConfluenceCard({ data }: { data: ConfluenceData }) {
  const [expandedTF, setExpandedTF] = useState<string | null>(null);

  const c = data.confluence;
  const bias = BIAS_CFG[c.dominantBias] ?? BIAS_CFG.neutral;
  const rec = REC_CFG[data.finalSetup?.type ?? "wait"];
  const sortedTFs = [...(data.perTimeframe ?? [])].sort((a, b) => TF_ORDER.indexOf(a.timeframe) - TF_ORDER.indexOf(b.timeframe));

  return (
    <div className="cm-fade-in flex flex-col gap-4 rounded-2xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

      {/* ── Header: Bias + Score ── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            Confluence Result
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
              style={{ background: bias.bg, color: bias.color, borderColor: bias.color, fontFamily: "var(--font-mono, monospace)" }}>
              {bias.icon} {bias.label}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: rec.bg, color: rec.color, fontFamily: "var(--font-mono, monospace)" }}>
              {rec.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {c.alignedCount ?? data.perTimeframe?.filter(t => t.aligned).length ?? "?"}/{c.totalCount ?? data.perTimeframe?.length ?? "?"} timeframes aligned
          </p>
        </div>
        <AlignmentRing score={c.alignmentScore} strength={c.agreement} />
      </div>

      {/* ── Visual TF Bars ── */}
      <div className="flex flex-col gap-0"
        style={{ background: "hsl(var(--secondary))", borderRadius: "0.75rem", padding: "0.75rem", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            Timeframe Alignment
          </span>
          <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.7 }}>
            <span>✓ aligned</span>
            <span>✗ diverging</span>
            <span>↩ retracement</span>
          </div>
        </div>
        {sortedTFs.map(tf => (
          <div key={tf.timeframe}>
            <div className="cursor-pointer hover:opacity-80 transition-opacity rounded-lg"
              onClick={() => setExpandedTF(expandedTF === tf.timeframe ? null : tf.timeframe)}
              style={{ padding: "0.125rem 0.25rem" }}>
              <TFBar tf={tf} />
            </div>
            {expandedTF === tf.timeframe && (() => {
              const full = data.analyses?.find(a => a.timeframe === tf.timeframe);
              return full ? <ExpandedDetail timeframe={tf.timeframe} result={full.result as AnalysisResult} /> : null;
            })()}
          </div>
        ))}
        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
          Tap a row to see full detail
        </p>
      </div>

      {/* ── Conflicting signals ── */}
      {c.conflictingSignals?.length > 0 && (
        <div className="rounded-xl p-3 flex flex-col gap-1.5"
          style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)" }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--cm-accent)" }}>
            ⚡ Conflicts Detected
          </span>
          {c.conflictingSignals.map((s, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>• {s}</p>
          ))}
        </div>
      )}

      {/* ── AI Assessment ── */}
      <div className="rounded-xl p-3 flex flex-col gap-1.5"
        style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          AI Assessment
        </span>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{c.summary}</p>
      </div>

      {/* ── Entry condition ── */}
      <div className="rounded-xl p-3 flex flex-col gap-1.5"
        style={{
          background: data.finalSetup?.type === "wait" ? "rgba(245,166,35,0.06)" : data.finalSetup?.type === "buy" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
          border: `1px solid ${data.finalSetup?.type === "wait" ? "rgba(245,166,35,0.2)" : data.finalSetup?.type === "buy" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: rec.color }}>
          Entry Condition
        </span>
        <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{data.entryCondition}</p>
      </div>

      {/* ── Final trade setup ── */}
      {data.finalSetup && <SetupSection setup={data.finalSetup} />}

      {/* ── Invalidation ── */}
      {data.invalidationConditions?.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            Invalidation
          </span>
          {data.invalidationConditions.map((c, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>• {c}</p>
          ))}
        </div>
      )}

      {/* ── Warnings ── */}
      {data.warnings?.length > 0 && (
        <div className="rounded-lg p-2.5 flex flex-col gap-1"
          style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
          {data.warnings.map((w, i) => (
            <p key={i} className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>⚡ {w}</p>
          ))}
        </div>
      )}

      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.4 }}>
        AI-generated confluence — not financial advice. {data.totalCostUsd > 0 ? `Cost: $${data.totalCostUsd.toFixed(4)}` : ""}
      </p>
    </div>
  );
}
