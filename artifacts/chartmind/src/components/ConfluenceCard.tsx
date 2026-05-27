import { useState } from "react";
import type { AnalysisResult } from "../types";

type Bias = "bullish" | "bearish" | "neutral";
type Strength = "perfect" | "strong" | "moderate" | "weak" | "divergent";

interface TFResult {
  timeframe: string;
  bias: Bias;
  confidence: number;
  trend: string;
  rsi: number;
  recommendation: string;
  aligned: boolean;
}

interface ConfluenceData {
  overallBias: Bias;
  alignmentScore: number;
  confluenceStrength: Strength;
  alignedCount: number;
  totalCount: number;
  recommendation: "buy" | "sell" | "wait";
  reasoning: string;
  entryCondition: string;
  perTimeframe: TFResult[];
  totalCostUsd: number;
  isMockMode: boolean;
}

interface ConfluenceAnalysis {
  confluence: ConfluenceData;
  analyses: Array<{ timeframe: string; result: AnalysisResult }>;
}

const BIAS_CONFIG = {
  bullish: { label: "BULLISH", color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)", border: "var(--cm-bullish)" },
  bearish: { label: "BEARISH", color: "var(--cm-bearish)", bg: "var(--cm-bearish-dim)", border: "var(--cm-bearish)" },
  neutral: { label: "NEUTRAL", color: "var(--cm-neutral)", bg: "var(--cm-neutral-dim)", border: "var(--cm-neutral)" },
};

const REC_CONFIG = {
  buy: { label: "BUY", color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)" },
  sell: { label: "SELL", color: "var(--cm-bearish)", bg: "var(--cm-bearish-dim)" },
  wait: { label: "WAIT", color: "var(--cm-neutral)", bg: "var(--cm-neutral-dim)" },
};

const STRENGTH_COLOR: Record<Strength, string> = {
  perfect: "var(--cm-bullish)",
  strong: "var(--cm-bullish)",
  moderate: "var(--cm-accent)",
  weak: "var(--cm-neutral)",
  divergent: "var(--cm-bearish)",
};

function AlignmentRing({ score, strength }: { score: number; strength: Strength }) {
  const color = STRENGTH_COLOR[strength];
  const r = 30, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
          <circle cx="38" cy="38" r={r} fill="none" strokeWidth="6" stroke="hsl(var(--border))" />
          <circle cx="38" cy="38" r={r} fill="none" strokeWidth="6" stroke={color}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black leading-none" style={{ fontFamily: "var(--font-mono, monospace)", color }}>{score}%</span>
        </div>
      </div>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color, fontFamily: "var(--font-mono, monospace)" }}>
        {strength}
      </span>
    </div>
  );
}

function TFRow({ tf }: { tf: TFResult }) {
  const bias = BIAS_CONFIG[tf.bias];
  const confColor = tf.confidence >= 70 ? "var(--cm-bullish)" : tf.confidence >= 50 ? "var(--cm-accent)" : "var(--cm-bearish)";
  const TF_ORDER = ["15m", "1h", "4h", "1D"];

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "hsl(var(--border))" }}>
      {/* Aligned indicator */}
      <div className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: tf.aligned ? bias.color : "hsl(var(--muted-foreground))", opacity: tf.aligned ? 1 : 0.4 }} />

      {/* TF label */}
      <span className="text-xs font-bold w-8 flex-shrink-0"
        style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--foreground))" }}>
        {tf.timeframe}
      </span>

      {/* Bias chip */}
      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: bias.bg, color: bias.color, fontFamily: "var(--font-mono, monospace)", fontSize: "0.6rem" }}>
        {bias.label}
      </span>

      {/* Trend */}
      <span className="text-xs flex-1 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
        {tf.trend ?? "—"}
      </span>

      {/* RSI */}
      <span className="text-xs flex-shrink-0" style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--muted-foreground))" }}>
        RSI {tf.rsi?.toFixed(0) ?? "—"}
      </span>

      {/* Confidence */}
      <span className="text-xs font-bold flex-shrink-0 w-8 text-right"
        style={{ fontFamily: "var(--font-mono, monospace)", color: confColor }}>
        {tf.confidence}%
      </span>
    </div>
  );
}

function ExpandedAnalysis({ timeframe, result }: { timeframe: string; result: AnalysisResult }) {
  const r = result;
  if (!r) return null;
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2"
      style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
        {timeframe} detail
      </p>
      <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{r.reasoning}</p>
      {r.tradeSetup?.type !== "wait" && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span style={{ color: "hsl(var(--muted-foreground))" }}>Entry </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)" }}>{r.tradeSetup?.entryZone?.low?.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
          </div>
          <div>
            <span style={{ color: "hsl(var(--muted-foreground))" }}>SL </span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-bearish)" }}>{r.tradeSetup?.stopLoss?.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ConfluenceCardProps {
  data: ConfluenceAnalysis;
}

export function ConfluenceCard({ data }: ConfluenceCardProps) {
  const [expandedTF, setExpandedTF] = useState<string | null>(null);
  const c = data.confluence;
  const bias = BIAS_CONFIG[c.overallBias];
  const rec = REC_CONFIG[c.recommendation];

  const TF_ORDER = ["15m", "1h", "4h", "1D"];
  const sortedTFs = [...c.perTimeframe].sort((a, b) => TF_ORDER.indexOf(a.timeframe) - TF_ORDER.indexOf(b.timeframe));

  return (
    <div className="cm-fade-in flex flex-col gap-4 rounded-2xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            Confluence Result
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
              style={{ background: bias.bg, color: bias.color, borderColor: bias.border, fontFamily: "var(--font-mono, monospace)" }}>
              {bias.label}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: rec.bg, color: rec.color, fontFamily: "var(--font-mono, monospace)" }}>
              {rec.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {c.alignedCount}/{c.totalCount} timeframes aligned
          </p>
        </div>

        <AlignmentRing score={c.alignmentScore} strength={c.confluenceStrength} />
      </div>

      {/* TF alignment strip */}
      <div className="flex flex-col gap-0">
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          Timeframe Breakdown
        </p>
        {sortedTFs.map(tf => (
          <div key={tf.timeframe}>
            <div className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setExpandedTF(expandedTF === tf.timeframe ? null : tf.timeframe)}>
              <TFRow tf={tf} />
            </div>
            {expandedTF === tf.timeframe && (() => {
              const fullAnalysis = data.analyses.find(a => a.timeframe === tf.timeframe);
              return fullAnalysis ? <ExpandedAnalysis timeframe={tf.timeframe} result={fullAnalysis.result as AnalysisResult} /> : null;
            })()}
          </div>
        ))}
      </div>

      {/* Confluence reasoning */}
      <div className="rounded-xl p-3 flex flex-col gap-2"
        style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          AI Assessment
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
          {c.reasoning}
        </p>
      </div>

      {/* Entry condition */}
      <div className="rounded-xl p-3 flex flex-col gap-1.5"
        style={{
          background: c.recommendation === "wait" ? "rgba(245,166,35,0.06)" : c.recommendation === "buy" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
          border: `1px solid ${c.recommendation === "wait" ? "rgba(245,166,35,0.2)" : c.recommendation === "buy" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: rec.color }}>
          Entry Condition
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
          {c.entryCondition}
        </p>
      </div>

      {/* Tap to expand hint */}
      <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
        Tap a timeframe row to see full detail
      </p>

      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
        AI-generated confluence analysis — not financial advice.
      </p>
    </div>
  );
}
