import { useEffect, useState } from "react";
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
  bullish:    { label: "BULLISH",    color: "var(--cm-bullish)",  bg: "var(--cm-bullish-dim)",  border: "rgba(0,230,118,0.25)",  icon: "▲" },
  bearish:    { label: "BEARISH",    color: "var(--cm-bearish)",  bg: "var(--cm-bearish-dim)",  border: "rgba(255,61,87,0.25)",  icon: "▼" },
  neutral:    { label: "NEUTRAL",    color: "var(--cm-neutral)",  bg: "var(--cm-neutral-dim)",  border: "rgba(128,128,170,0.25)", icon: "→" },
  conflicted: { label: "CONFLICTED", color: "var(--cm-amber)",    bg: "var(--cm-amber-dim)",    border: "rgba(245,166,35,0.25)", icon: "⚡" },
};

const REC_CFG = {
  buy:  { label: "BUY",  color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)" },
  sell: { label: "SELL", color: "var(--cm-bearish)", bg: "var(--cm-bearish-dim)" },
  wait: { label: "WAIT", color: "var(--cm-amber)",   bg: "var(--cm-amber-dim)"  },
};

const STRENGTH_COLOR: Record<string, string> = {
  perfect:    "var(--cm-bullish)",
  strong:     "var(--cm-bullish)",
  moderate:   "var(--cm-amber)",
  weak:       "var(--cm-neutral)",
  conflicted: "var(--cm-bearish)",
};

const TF_ORDER = ["1D", "4h", "1h", "15m"];

function fmt(n: number | undefined | null) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 5 });
}

// ── Alignment score ring ─────────────────────────────────────────────────────
function AlignmentRing({ score, strength }: { score: number; strength: string }) {
  const color = STRENGTH_COLOR[strength] ?? "var(--cm-neutral)";
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 72, height: 72 }}>
        <svg width={72} height={72} viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth={5} stroke="rgba(255,255,255,0.05)" />
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth={5} stroke={color}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black leading-none" style={{ fontFamily: "var(--cm-font-mono)", color, fontSize: "1.1rem" }}>{score}%</span>
        </div>
      </div>
      <span className="text-xs font-black uppercase tracking-wider"
        style={{ color, fontFamily: "var(--cm-font-display)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>
        {strength}
      </span>
    </div>
  );
}

// ── TF bar row ───────────────────────────────────────────────────────────────
function TFBar({ tf, index, expanded, onToggle }: {
  tf: TFSummary; index: number; expanded: boolean; onToggle: () => void;
}) {
  const bias = BIAS_CFG[tf.bias] ?? BIAS_CFG.neutral;

  return (
    <div className={`cm-tf-row-${Math.min(index, 3)}`}>
      <button className="w-full flex items-center gap-2 py-1.5 px-1 rounded-lg transition-colors duration-150 hover:bg-white/5"
        onClick={onToggle}>
        {/* TF label */}
        <span className="text-xs font-black w-8 text-right flex-shrink-0"
          style={{ fontFamily: "var(--cm-font-mono)", color: tf.aligned ? bias.color : "var(--cm-text-muted)" }}>
          {tf.timeframe}
        </span>

        {/* Bias badge */}
        <div className="flex items-center gap-1 w-20 flex-shrink-0">
          <span className="text-xs font-black" style={{ color: bias.color }}>{bias.icon}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: bias.bg, color: bias.color, fontFamily: "var(--cm-font-mono)", fontSize: "0.55rem", letterSpacing: "0.04em" }}>
            {bias.label}
          </span>
        </div>

        {/* Confidence bar */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full cm-bar-scale"
              style={{
                width: `${tf.confidence}%`,
                background: tf.aligned
                  ? `linear-gradient(90deg, ${bias.color}80, ${bias.color})`
                  : "rgba(128,128,170,0.3)",
                animationDelay: `${index * 100 + 200}ms`,
              }} />
          </div>
          <span className="text-xs font-bold w-7 text-right flex-shrink-0"
            style={{ fontFamily: "var(--cm-font-mono)", color: tf.aligned ? bias.color : "var(--cm-text-muted)", fontSize: "0.65rem" }}>
            {tf.confidence}%
          </span>
        </div>

        {/* Status icon */}
        <div className="w-5 flex-shrink-0 flex justify-center">
          {tf.isRetracement ? (
            <span className="text-xs" style={{ color: "var(--cm-amber)" }} title="Retracement">↩</span>
          ) : tf.aligned ? (
            <span style={{ color: "var(--cm-bullish)", fontSize: "0.7rem" }}>✓</span>
          ) : (
            <span style={{ color: "var(--cm-bearish)", fontSize: "0.7rem" }}>✗</span>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (() => {
        return null; // expanded detail rendered outside via analyses prop
      })()}
    </div>
  );
}

// ── Expanded analysis detail ─────────────────────────────────────────────────
function ExpandedDetail({ result }: { result: AnalysisResult }) {
  if (!result) return null;
  return (
    <div className="ml-10 mr-1 mb-2 rounded-xl p-3 cm-fade-in"
      style={{ background: "var(--cm-bg-base)", border: "1px solid var(--cm-border-subtle)" }}>
      <p className="text-xs leading-relaxed" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
        {result.reasoning}
      </p>
      {result.tradeSetup?.type !== "wait" && (
        <div className="flex gap-4 mt-2 text-xs">
          <span style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>
            Entry <span style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-text-primary)" }}>
              {fmt(result.tradeSetup?.entryZone?.low)}
            </span>
          </span>
          <span style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>
            SL <span style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-bearish)" }}>
              {fmt(result.tradeSetup?.stopLoss)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Final setup section ──────────────────────────────────────────────────────
function SetupSection({ setup }: { setup: FinalSetup }) {
  const rec = REC_CFG[setup.type];
  const recBorder = {
    buy:  "rgba(0,230,118,0.25)",
    sell: "rgba(255,61,87,0.25)",
    wait: "rgba(245,166,35,0.2)",
  }[setup.type];
  const recBg = {
    buy:  "rgba(0,230,118,0.04)",
    sell: "rgba(255,61,87,0.04)",
    wait: "rgba(245,166,35,0.04)",
  }[setup.type];

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${recBorder}`, borderLeft: `3px solid ${rec.color}`, background: recBg }}>
      <div className="px-3 pt-3 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider"
              style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
              FINAL SETUP
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: rec.bg, color: rec.color, fontFamily: "var(--cm-font-display)", fontSize: "0.65rem" }}>
              {rec.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: "var(--cm-purple-dim)", color: "var(--cm-purple)", fontFamily: "var(--cm-font-mono)", fontSize: "0.6rem" }}>
              {setup.entryTimeframe}
            </span>
            {setup.riskRewardRatio > 0 && (
              <span className="text-sm font-black" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-purple)" }}>
                {setup.riskRewardRatio.toFixed(1)}R
              </span>
            )}
          </div>
        </div>

        {setup.type !== "wait" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.55rem" }}>ENTRY ZONE</span>
                <p className="text-xs font-black mt-0.5" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-text-primary)" }}>
                  {fmt(setup.entryZone.low)} – {fmt(setup.entryZone.high)}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.55rem" }}>STOP LOSS</span>
                <p className="text-xs font-black mt-0.5" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-bearish)" }}>
                  {fmt(setup.stopLoss)}
                </p>
              </div>
            </div>
            {setup.takeProfits.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {setup.takeProfits.slice(0, 3).map((tp, i) => (
                  <div key={i}>
                    <span className="text-xs uppercase tracking-wider" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.5rem" }}>{tp.label}</span>
                    <p className="text-xs font-black mt-0.5" style={{ fontFamily: "var(--cm-font-mono)", color: `hsl(${142 + i * 10}, 100%, ${45 + i * 5}%)` }}>
                      {fmt(tp.level)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>
              SL: {setup.stopLossRationale}
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed" style={{ color: "var(--cm-text-primary)", fontFamily: "var(--cm-font-body)" }}>
            {setup.rationale}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function ConfluenceCard({ data }: { data: ConfluenceData }) {
  const [expandedTF, setExpandedTF] = useState<string | null>(null);

  const c = data.confluence;
  const bias = BIAS_CFG[c.dominantBias] ?? BIAS_CFG.neutral;
  const rec = REC_CFG[data.finalSetup?.type ?? "wait"];
  const sortedTFs = [...(data.perTimeframe ?? [])].sort((a, b) => TF_ORDER.indexOf(a.timeframe) - TF_ORDER.indexOf(b.timeframe));
  const alignedCount = data.perTimeframe?.filter(t => t.aligned).length ?? 0;
  const totalCount = data.perTimeframe?.length ?? 0;

  return (
    <div className="cm-fade-in flex flex-col gap-4 rounded-2xl overflow-hidden"
      style={{ background: "var(--cm-bg-surface)", border: "1px solid var(--cm-border-default)", borderTop: `2px solid ${bias.color}` }}>

      {/* ── Header ── */}
      <div className="px-4 pt-4 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
            CONFLUENCE RESULT
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black px-2.5 py-1 rounded-full border"
              style={{ background: bias.bg, color: bias.color, borderColor: bias.border, fontFamily: "var(--cm-font-display)", fontSize: "0.7rem", letterSpacing: "0.06em" }}>
              {bias.icon} {bias.label}
            </span>
            <span className="font-black px-2.5 py-1 rounded-full"
              style={{ background: rec.bg, color: rec.color, fontFamily: "var(--cm-font-display)", fontSize: "0.7rem", letterSpacing: "0.06em" }}>
              {rec.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>
            {alignedCount}/{totalCount} timeframes aligned
          </p>
        </div>
        <AlignmentRing score={c.alignmentScore} strength={c.agreement} />
      </div>

      {/* ── TF alignment panel ── */}
      <div className="mx-4 rounded-xl px-3 py-3 flex flex-col gap-0"
        style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-default)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
            TIMEFRAME ALIGNMENT
          </span>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: "var(--cm-text-muted)", fontSize: "0.55rem" }}>
            <span>✓ aligned</span>
            <span>✗ diverging</span>
            <span>↩ retrace</span>
          </div>
        </div>

        {sortedTFs.map((tf, i) => (
          <div key={tf.timeframe}>
            <TFBar
              tf={tf}
              index={i}
              expanded={expandedTF === tf.timeframe}
              onToggle={() => setExpandedTF(expandedTF === tf.timeframe ? null : tf.timeframe)}
            />
            {expandedTF === tf.timeframe && (() => {
              const full = data.analyses?.find(a => a.timeframe === tf.timeframe);
              return full ? <ExpandedDetail result={full.result as AnalysisResult} /> : null;
            })()}
          </div>
        ))}
        <p className="text-xs mt-2 text-center" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)", fontSize: "0.6rem", opacity: 0.5 }}>
          Tap a row to see full detail
        </p>
      </div>

      {/* ── Conflict signals ── */}
      {c.conflictingSignals?.length > 0 && (
        <div className="mx-4 rounded-xl px-3 py-2.5 flex flex-col gap-1.5 cm-stagger-2"
          style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.18)" }}>
          <span className="text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-amber)", fontSize: "0.6rem" }}>
            ⚡ CONFLICTS DETECTED
          </span>
          {c.conflictingSignals.map((s, i) => (
            <p key={i} className="text-xs leading-relaxed"
              style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>• {s}</p>
          ))}
        </div>
      )}

      {/* ── AI assessment ── */}
      <div className="mx-4 rounded-xl px-3 py-2.5 cm-stagger-3"
        style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-subtle)" }}>
        <span className="text-xs font-black uppercase tracking-wider block mb-1.5"
          style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
          AI ASSESSMENT
        </span>
        <p className="text-sm leading-relaxed" style={{ color: "var(--cm-text-primary)", fontFamily: "var(--cm-font-body)" }}>
          {c.summary}
        </p>
      </div>

      {/* ── Entry condition ── */}
      <div className="mx-4 rounded-xl px-3 py-2.5 cm-stagger-4"
        style={{
          background: data.finalSetup?.type === "buy"
            ? "rgba(0,230,118,0.04)"
            : data.finalSetup?.type === "sell"
            ? "rgba(255,61,87,0.04)"
            : "rgba(245,166,35,0.04)",
          border: `1px solid ${data.finalSetup?.type === "buy" ? "rgba(0,230,118,0.2)" : data.finalSetup?.type === "sell" ? "rgba(255,61,87,0.2)" : "rgba(245,166,35,0.18)"}`,
        }}>
        <span className="text-xs font-black uppercase tracking-wider block mb-1.5"
          style={{ fontFamily: "var(--cm-font-display)", color: rec.color, fontSize: "0.6rem" }}>
          ENTRY CONDITION
        </span>
        <p className="text-xs leading-relaxed" style={{ color: "var(--cm-text-primary)", fontFamily: "var(--cm-font-body)" }}>
          {data.entryCondition}
        </p>
      </div>

      {/* ── Final trade setup ── */}
      {data.finalSetup && (
        <div className="mx-4 cm-stagger-5">
          <SetupSection setup={data.finalSetup} />
        </div>
      )}

      {/* ── Invalidation ── */}
      {data.invalidationConditions?.length > 0 && (
        <div className="px-4 flex flex-col gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
            INVALIDATION
          </span>
          {data.invalidationConditions.map((c, i) => (
            <p key={i} className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>• {c}</p>
          ))}
        </div>
      )}

      {/* ── Warnings ── */}
      {data.warnings?.length > 0 && (
        <div className="mx-4 rounded-xl px-3 py-2"
          style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.12)" }}>
          {data.warnings.map((w, i) => (
            <p key={i} className="text-xs" style={{ color: "var(--cm-amber)", fontFamily: "var(--cm-font-body)" }}>⚡ {w}</p>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <p className="pb-4 text-xs text-center" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)", opacity: 0.5 }}>
        AI-generated confluence — not financial advice
        {data.totalCostUsd > 0 && <span> · Cost: ${data.totalCostUsd.toFixed(4)}</span>}
      </p>
    </div>
  );
}
