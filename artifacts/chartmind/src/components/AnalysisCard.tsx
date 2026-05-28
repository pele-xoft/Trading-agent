import { useEffect, useState } from "react";
import type { AnalysisRecord, MarketBias, MarketRegime, TradeGrade, TradeType } from "../types";

// ── Trade grade config ────────────────────────────────────────────────────────
const GRADE_CFG: Record<TradeGrade, { color: string; bg: string; border: string; glow: string }> = {
  "A+": { color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)", border: "rgba(0,230,118,0.4)", glow: "0 0 12px rgba(0,230,118,0.4)" },
  "A":  { color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)", border: "rgba(0,230,118,0.25)", glow: "none" },
  "B":  { color: "var(--cm-amber)",   bg: "var(--cm-amber-dim)",   border: "rgba(245,166,35,0.3)",  glow: "none" },
  "C":  { color: "var(--cm-neutral)", bg: "var(--cm-neutral-dim)", border: "rgba(148,163,184,0.3)", glow: "none" },
  "avoid": { color: "var(--cm-bearish)", bg: "var(--cm-bearish-dim)", border: "rgba(255,61,87,0.3)", glow: "none" },
  "WAIT":  { color: "var(--cm-amber)",   bg: "var(--cm-amber-dim)",   border: "rgba(245,166,35,0.25)", glow: "none" },
};

// ── Market regime config ──────────────────────────────────────────────────────
const REGIME_CFG: Record<string, { label: string; color: string; bg: string; icon: string; border: string }> = {
  trending: { label: "TRENDING",  color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)", icon: "↗", border: "rgba(0,230,118,0.25)" },
  ranging:  { label: "RANGING",   color: "var(--cm-cyan)",    bg: "rgba(0,212,255,0.08)", icon: "↔", border: "rgba(0,212,255,0.25)" },
  volatile: { label: "VOLATILE",  color: "var(--cm-bearish)", bg: "var(--cm-bearish-dim)", icon: "⚡", border: "rgba(255,61,87,0.3)" },
  choppy:   { label: "CHOPPY",    color: "var(--cm-amber)",   bg: "var(--cm-amber-dim)",   icon: "〜", border: "rgba(245,166,35,0.3)" },
};

function TradeGradeBadge({ grade }: { grade: TradeGrade }) {
  const cfg = GRADE_CFG[grade] ?? GRADE_CFG["B"];
  const icon = grade === "A+" ? "★" : grade === "avoid" ? "✕" : grade === "WAIT" ? "⏸" : "◆";
  const label = grade === "avoid" ? "AVOID" : grade;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-black px-2.5 py-1.5 rounded-xl border text-sm"
        style={{ fontFamily: "var(--cm-font-mono)", color: cfg.color, background: cfg.bg, borderColor: cfg.border, boxShadow: cfg.glow, letterSpacing: "0.05em" }}>
        {icon} {label}
      </span>
      <span className="text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.5rem" }}>
        GRADE
      </span>
    </div>
  );
}

function MarketRegimeBadge({ regime }: { regime: string }) {
  const cfg = REGIME_CFG[regime] ?? REGIME_CFG.ranging;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: "var(--cm-font-mono)", fontSize: "0.6rem", letterSpacing: "0.04em", border: `1px solid ${cfg.border}` }}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(to: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 4);
      setVal(Math.round(to * ease));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);
  return val;
}

// ── Confidence ring ───────────────────────────────────────────────────────────
function ConfidenceRing({ value }: { value: number }) {
  const size = 88;
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 70 ? "var(--cm-bullish)" : value >= 50 ? "var(--cm-amber)" : "var(--cm-bearish)";
  const label = value >= 70 ? "HIGH" : value >= 50 ? "MODERATE" : "LOW";
  const displayed = useCountUp(value);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6} stroke="rgba(255,255,255,0.05)" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6} stroke={color}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black leading-none" style={{ fontFamily: "var(--cm-font-mono)", color, fontSize: "1.25rem" }}>
            {displayed}
          </span>
          <span style={{ color, fontSize: "0.5rem", fontFamily: "var(--cm-font-display)", letterSpacing: "0.08em", fontWeight: 700 }}>
            CONF
          </span>
        </div>
      </div>
      <span className="text-xs font-bold" style={{ fontFamily: "var(--cm-font-display)", color, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
        {label} CONVICTION
      </span>
    </div>
  );
}

// ── Indicator pills ───────────────────────────────────────────────────────────
interface PillData { label: string; value: string; color: string; bg: string }

function IndicatorPill({ pill, idx }: { pill: PillData; idx: number }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
      style={{
        background: "var(--cm-bg-elevated)",
        border: `1px solid var(--cm-border-subtle)`,
        animation: `cm-fade-up 0.35s ease ${idx * 40}ms both`,
      }}>
      <span className="text-xs font-bold" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
        {pill.label}
      </span>
      <span className="text-xs font-black" style={{ fontFamily: "var(--cm-font-mono)", color: pill.color, fontSize: "0.65rem" }}>
        {pill.value}
      </span>
    </div>
  );
}

// ── Key reasoning panel ───────────────────────────────────────────────────────
function KeyReasoningPanel({ reasons, noTradeReason }: { reasons: string[]; noTradeReason?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const hasReasons = reasons && reasons.length > 0;
  const hasNoTradeReason = noTradeReason && noTradeReason.trim().length > 0;
  if (!hasReasons && !hasNoTradeReason) return null;

  const shown = expanded ? reasons : (reasons ?? []).slice(0, 3);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(108,99,255,0.2)", background: "rgba(108,99,255,0.04)" }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5"
        style={{ fontFamily: "var(--cm-font-display)" }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--cm-purple)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
          ◆ WHY THIS SETUP
        </span>
        <span style={{ color: "var(--cm-text-muted)", fontSize: "0.65rem" }}>{expanded ? "▲" : "▼"}</span>
      </button>
      <div className="px-3 pb-3 flex flex-col gap-2">
        {shown.map((reason, i) => (
          <div key={i} className="flex items-start gap-2">
            <span style={{ color: "var(--cm-cyan)", fontSize: "0.55rem", marginTop: "3px", flexShrink: 0, fontFamily: "var(--cm-font-mono)", fontWeight: 700 }}>{i + 1}.</span>
            <span className="text-xs leading-relaxed" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>{reason}</span>
          </div>
        ))}
        {!expanded && (reasons ?? []).length > 3 && (
          <button onClick={() => setExpanded(true)} className="text-xs text-left" style={{ color: "var(--cm-purple)", fontFamily: "var(--cm-font-body)", opacity: 0.8 }}>
            + {reasons.length - 3} more reasons →
          </button>
        )}
        {hasNoTradeReason && (
          <div className="mt-1 pt-2 flex items-start gap-2" style={{ borderTop: "1px solid rgba(245,166,35,0.15)" }}>
            <span style={{ color: "var(--cm-amber)", fontSize: "0.55rem", marginTop: "3px", flexShrink: 0, fontFamily: "var(--cm-font-mono)", fontWeight: 700 }}>⏸</span>
            <span className="text-xs leading-relaxed" style={{ color: "var(--cm-amber)", fontFamily: "var(--cm-font-body)", opacity: 0.9 }}>
              {noTradeReason}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trade setup card ──────────────────────────────────────────────────────────
function TradeSetupCard({ setup, bias }: { setup: NonNullable<AnalysisRecord["result"]>["tradeSetup"]; bias: MarketBias }) {
  const recColor = { buy: "var(--cm-bullish)", sell: "var(--cm-bearish)", wait: "var(--cm-neutral)" }[setup.type];
  const recBg = { buy: "var(--cm-bullish-dim)", sell: "var(--cm-bearish-dim)", wait: "var(--cm-neutral-dim)" }[setup.type];

  function fmt(n: number | null | undefined) {
    if (n == null) return "—";
    return n.toLocaleString(undefined, { maximumFractionDigits: 5 });
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--cm-border-default)", borderLeft: `3px solid ${recColor}` }}>
      <div className="px-3 py-3 flex flex-col gap-3" style={{ background: "var(--cm-bg-elevated)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider"
              style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
              TRADE SETUP
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: recBg, color: recColor, fontFamily: "var(--cm-font-display)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
              ▸ {setup.type.toUpperCase()}
            </span>
          </div>
          {setup.riskRewardRatio > 0 && (
            <span className="text-sm font-black" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-purple)" }}>
              {setup.riskRewardRatio.toFixed(1)}R
            </span>
          )}
        </div>

        {setup.type !== "wait" ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.55rem" }}>ENTRY ZONE</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-text-primary)" }}>{fmt(setup.entryZone.low)}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${recColor}40, ${recColor})` }} />
                <span className="font-black text-sm" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-text-primary)" }}>{fmt(setup.entryZone.high)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 border-t" style={{ borderColor: "var(--cm-border-subtle)" }}>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.55rem" }}>STOP LOSS</span>
                <p className="text-xs mt-0.5" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>{setup.stopLossRationale}</p>
              </div>
              <span className="font-black text-sm ml-3 flex-shrink-0" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-bearish)" }}>{fmt(setup.stopLoss)}</span>
            </div>

            {setup.takeProfits.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-0.5">
                {setup.takeProfits.slice(0, 3).map((tp, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ fontFamily: "var(--cm-font-display)", background: "var(--cm-bullish-dim)", color: "var(--cm-bullish)", fontSize: "0.6rem" }}>
                        {tp.label}
                      </span>
                      {tp.rationale && (
                        <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>{tp.rationale}</span>
                      )}
                    </div>
                    <span className="font-bold text-sm" style={{ fontFamily: "var(--cm-font-mono)", color: `hsl(${142 + i * 10}, 100%, ${45 + i * 5}%)` }}>
                      {fmt(tp.level)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs leading-relaxed" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
            {setup.rationale}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────
export function AnalysisCard({ analysis }: { analysis: AnalysisRecord }) {
  const r = analysis.result;
  if (!r) return null;

  const setup = r.tradeSetup;
  const rsi = r.indicators.rsi;
  const stoch = r.indicators.stochastic;
  const ma = r.indicators.movingAverages;

  const biasColor = {
    bullish: "var(--cm-bullish)", bearish: "var(--cm-bearish)", neutral: "var(--cm-neutral)",
  }[r.marketBias] ?? "var(--cm-neutral)";
  const biasBg = {
    bullish: "var(--cm-bullish-dim)", bearish: "var(--cm-bearish-dim)", neutral: "var(--cm-neutral-dim)",
  }[r.marketBias] ?? "var(--cm-neutral-dim)";
  const biasIcon = { bullish: "▲", bearish: "▼", neutral: "→" }[r.marketBias] ?? "→";

  const pills: PillData[] = [
    {
      label: "RSI",
      value: `${rsi.value.toFixed(1)} ${rsi.zone === "bullish" || rsi.zone === "oversold" ? "▲" : rsi.zone === "bearish" || rsi.zone === "overbought" ? "▼" : "→"}`,
      color: rsi.zone === "bullish" || rsi.zone === "oversold" ? "var(--cm-bullish)" : rsi.zone === "bearish" || rsi.zone === "overbought" ? "var(--cm-bearish)" : "var(--cm-neutral)",
      bg: rsi.zone === "bullish" || rsi.zone === "oversold" ? "var(--cm-bullish-dim)" : rsi.zone === "bearish" || rsi.zone === "overbought" ? "var(--cm-bearish-dim)" : "var(--cm-neutral-dim)",
    },
    {
      label: "STOCH",
      value: `${stoch.kValue.toFixed(0)}/${stoch.dValue.toFixed(0)} ${stoch.zone === "oversold" ? "▲" : stoch.zone === "overbought" ? "▼" : "→"}`,
      color: stoch.zone === "oversold" ? "var(--cm-bullish)" : stoch.zone === "overbought" ? "var(--cm-bearish)" : "var(--cm-neutral)",
      bg: stoch.zone === "oversold" ? "var(--cm-bullish-dim)" : stoch.zone === "overbought" ? "var(--cm-bearish-dim)" : "var(--cm-neutral-dim)",
    },
    {
      label: "MA",
      value: ma.crossoverType === "golden" ? "GOLDEN ✕" : ma.crossoverType === "death" ? "DEATH ✕" : "NO CROSS",
      color: ma.crossoverType === "golden" ? "var(--cm-bullish)" : ma.crossoverType === "death" ? "var(--cm-bearish)" : "var(--cm-neutral)",
      bg: ma.crossoverType === "golden" ? "var(--cm-bullish-dim)" : ma.crossoverType === "death" ? "var(--cm-bearish-dim)" : "var(--cm-neutral-dim)",
    },
    {
      label: "TREND",
      value: r.structure.trend === "uptrend" ? "UP ▲▲" : r.structure.trend === "downtrend" ? "DOWN ▼▼" : "SIDE →",
      color: r.structure.trend === "uptrend" ? "var(--cm-bullish)" : r.structure.trend === "downtrend" ? "var(--cm-bearish)" : "var(--cm-neutral)",
      bg: r.structure.trend === "uptrend" ? "var(--cm-bullish-dim)" : r.structure.trend === "downtrend" ? "var(--cm-bearish-dim)" : "var(--cm-neutral-dim)",
    },
  ];

  return (
    <div className="cm-fade-in flex flex-col gap-4 rounded-2xl overflow-hidden"
      style={{ background: "var(--cm-bg-surface)", border: "1px solid var(--cm-border-default)", borderTop: `2px solid ${biasColor}` }}>

      {/* ── Header ── */}
      <div className="px-4 pt-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black px-2.5 py-1 rounded-full border"
              style={{ background: biasBg, color: biasColor, borderColor: biasColor + "40", fontFamily: "var(--cm-font-display)", fontSize: "0.7rem", letterSpacing: "0.06em" }}>
              {biasIcon} {r.marketBias.toUpperCase()}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: "var(--cm-bg-elevated)", color: "var(--cm-purple)", fontFamily: "var(--cm-font-mono)", border: "1px solid var(--cm-border-default)" }}>
              {analysis.timeframe}
            </span>
            {r.marketRegime && <MarketRegimeBadge regime={r.marketRegime} />}
          </div>
          <p className="text-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
            {["mock", "cache", "mock-fallback"].includes(analysis.aiModel ?? "") ? "Demo analysis" : "GPT-4o vision"}
            {r.alignmentScore != null && r.alignmentScore > 0 && (
              <span style={{ color: "var(--cm-text-muted)" }}> · {r.alignmentScore}% signal alignment</span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {r.tradeGrade && <TradeGradeBadge grade={r.tradeGrade} />}
          <ConfidenceRing value={r.confidence} />
        </div>
      </div>

      {/* ── Indicator pills ── */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {pills.map((p, i) => <IndicatorPill key={p.label} pill={p} idx={i} />)}
      </div>

      {/* ── Reasoning ── */}
      <div className="px-4">
        <p className="text-sm leading-relaxed" style={{ color: "var(--cm-text-primary)", fontFamily: "var(--cm-font-body)" }}>
          {r.reasoning}
        </p>
      </div>

      {/* ── Key reasoning / explainability panel ── */}
      {(r.keyReasoning && r.keyReasoning.length > 0) || r.noTradeReason ? (
        <div className="px-4">
          <KeyReasoningPanel reasons={r.keyReasoning ?? []} noTradeReason={r.noTradeReason} />
        </div>
      ) : null}

      {/* ── Key levels ── */}
      <div className="px-4 grid grid-cols-3 gap-2">
        {[
          { label: "KEY LEVEL",   value: r.structure.keyLevel },
          { label: "SUPPORT",     value: r.supportResistance.nearestSupport },
          { label: "RESISTANCE",  value: r.supportResistance.nearestResistance },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-xl p-2.5"
            style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-subtle)" }}>
            <span style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.5rem", letterSpacing: "0.08em", fontWeight: 700 }}>
              {label}
            </span>
            <span className="text-xs font-black" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-text-primary)" }}>
              {value?.toLocaleString(undefined, { maximumFractionDigits: 5 }) ?? "—"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Trade setup ── */}
      <div className="px-4">
        <TradeSetupCard setup={setup} bias={r.marketBias} />
      </div>

      {/* ── Confidence factors ── */}
      {r.confidenceFactors.length > 0 && (
        <div className="px-4 flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-display)", fontSize: "0.6rem" }}>
            Signals
          </span>
          <div className="flex flex-col gap-1">
            {r.confidenceFactors.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ color: "var(--cm-purple)", fontSize: "0.55rem", marginTop: "3px", flexShrink: 0 }}>◆</span>
                <span className="text-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Warnings ── */}
      {r.warnings.length > 0 && (
        <div className="mx-4 rounded-xl px-3 py-2.5 flex flex-col gap-1"
          style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)" }}>
          {r.warnings.map((w, i) => (
            <p key={i} className="text-xs" style={{ color: "var(--cm-amber)", fontFamily: "var(--cm-font-body)" }}>⚡ {w}</p>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-4 pb-4">
        <p className="text-xs text-center" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>
          AI-generated analysis — not financial advice
        </p>
      </div>
    </div>
  );
}
