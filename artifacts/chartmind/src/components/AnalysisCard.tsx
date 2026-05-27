import type { AnalysisRecord, MarketBias, TradeType } from "../types";

interface AnalysisCardProps {
  analysis: AnalysisRecord;
}

function BiasChip({ bias }: { bias: MarketBias }) {
  const config = {
    bullish: { label: "BULLISH", bg: "var(--cm-bullish-dim)", color: "var(--cm-bullish)", border: "var(--cm-bullish)" },
    bearish: { label: "BEARISH", bg: "var(--cm-bearish-dim)", color: "var(--cm-bearish)", border: "var(--cm-bearish)" },
    neutral: { label: "NEUTRAL", bg: "var(--cm-neutral-dim)", color: "var(--cm-neutral)", border: "var(--cm-neutral)" },
  }[bias];

  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
      style={{ background: config.bg, color: config.color, borderColor: config.border, fontFamily: "var(--font-mono, monospace)" }}>
      {config.label}
    </span>
  );
}

function SetupChip({ type }: { type: TradeType }) {
  const config = {
    buy: { label: "BUY", bg: "var(--cm-bullish-dim)", color: "var(--cm-bullish)" },
    sell: { label: "SELL", bg: "var(--cm-bearish-dim)", color: "var(--cm-bearish)" },
    wait: { label: "WAIT", bg: "var(--cm-neutral-dim)", color: "var(--cm-neutral)" },
  }[type];

  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: config.bg, color: config.color, fontFamily: "var(--font-mono, monospace)" }}>
      {config.label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "var(--cm-bullish)" : value >= 50 ? "var(--cm-accent)" : "var(--cm-bearish)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color, fontFamily: "var(--font-mono, monospace)", minWidth: "2rem", textAlign: "right" }}>
        {value}%
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
      <span className="text-xs font-semibold" style={valueStyle ?? { color: "hsl(var(--foreground))", fontFamily: "var(--font-mono, monospace)" }}>
        {value}
      </span>
    </div>
  );
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 5 });
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const r = analysis.result;
  if (!r) return null;

  const setup = r.tradeSetup;
  const rsi = r.indicators.rsi;
  const stoch = r.indicators.stochastic;
  const ma = r.indicators.movingAverages;

  return (
    <div className="cm-fade-in flex flex-col gap-5 rounded-2xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BiasChip bias={r.marketBias} />
          <span className="text-xs font-bold px-2 py-0.5 rounded-md"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono, monospace)" }}>
            {analysis.timeframe}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Confidence</span>
          <div style={{ width: "120px" }}>
            <ConfidenceBar value={r.confidence} />
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
        {r.reasoning}
      </p>

      {/* Indicators */}
      <Section title="Indicators">
        <Row label="RSI" value={`${rsi.value.toFixed(1)} — ${rsi.zone}`}
          valueStyle={{
            fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem",
            color: rsi.zone === "overbought" ? "var(--cm-bearish)" : rsi.zone === "oversold" ? "var(--cm-bullish)" :
              rsi.zone === "bullish" ? "var(--cm-bullish)" : rsi.zone === "bearish" ? "var(--cm-bearish)" : "hsl(var(--muted-foreground))",
          }} />
        <Row label="Stochastic K/D" value={`${stoch.kValue.toFixed(0)} / ${stoch.dValue.toFixed(0)} — ${stoch.zone}`}
          valueStyle={{
            fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem",
            color: stoch.zone === "overbought" ? "var(--cm-bearish)" : stoch.zone === "oversold" ? "var(--cm-bullish)" : "hsl(var(--muted-foreground))",
          }} />
        <Row label="MA Crossover" value={ma.crossoverType === "none" ? "None" : ma.crossoverType === "golden" ? "Golden Cross" : "Death Cross"}
          valueStyle={{
            fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem",
            color: ma.crossoverType === "golden" ? "var(--cm-bullish)" : ma.crossoverType === "death" ? "var(--cm-bearish)" : "hsl(var(--muted-foreground))",
          }} />
        <Row label="Price vs MAs" value={`${ma.priceAboveFast ? "↑" : "↓"} Fast  ${ma.priceAboveSlow ? "↑" : "↓"} Slow`}
          valueStyle={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "hsl(var(--foreground))" }} />
      </Section>

      {/* Structure */}
      <Section title="Market Structure">
        <Row label="Trend" value={r.structure.trend}
          valueStyle={{
            fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem",
            color: r.structure.trend === "uptrend" ? "var(--cm-bullish)" : r.structure.trend === "downtrend" ? "var(--cm-bearish)" : "hsl(var(--muted-foreground))",
          }} />
        <Row label="Momentum" value={`${r.momentum.strength} ${r.momentum.type}`}
          valueStyle={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "hsl(var(--foreground))" }} />
        <Row label="Support" value={formatPrice(r.supportResistance.nearestSupport)} />
        <Row label="Resistance" value={formatPrice(r.supportResistance.nearestResistance)} />
      </Section>

      {/* Trade Setup */}
      <Section title="Trade Setup">
        <div className="rounded-xl p-3 flex flex-col gap-2.5"
          style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between">
            <SetupChip type={setup.type} />
            {setup.riskRewardRatio > 0 && (
              <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-accent)" }}>
                R:R {setup.riskRewardRatio.toFixed(1)}
              </span>
            )}
          </div>

          {setup.type !== "wait" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Entry Zone</span>
                  <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--foreground))" }}>
                    {formatPrice(setup.entryZone.low)} – {formatPrice(setup.entryZone.high)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Stop Loss</span>
                  <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-bearish)" }}>
                    {formatPrice(setup.stopLoss)}
                  </span>
                </div>
              </div>

              {setup.takeProfits.length > 0 && (
                <div className="flex flex-col gap-1">
                  {setup.takeProfits.map((tp, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{tp.label}</span>
                      <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-bullish)" }}>
                        {formatPrice(tp.level)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            {setup.rationale}
          </p>
        </div>
      </Section>

      {/* Confidence Factors */}
      {r.confidenceFactors.length > 0 && (
        <Section title="Confidence Factors">
          <div className="flex flex-col gap-1">
            {r.confidenceFactors.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ color: "var(--cm-accent)", marginTop: "2px", fontSize: "0.6rem" }}>◆</span>
                <span className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{f}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Warnings */}
      {r.warnings.length > 0 && (
        <div className="rounded-lg p-3 flex flex-col gap-1.5"
          style={{ background: "rgba(245, 166, 35, 0.06)", border: "1px solid rgba(245, 166, 35, 0.2)" }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--cm-accent)" }}>Warnings</span>
          {r.warnings.map((w, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>• {w}</p>
          ))}
        </div>
      )}

      {/* Invalidation */}
      {r.invalidationConditions.length > 0 && (
        <Section title="Invalidation">
          {r.invalidationConditions.map((c, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>• {c}</p>
          ))}
        </Section>
      )}

      {/* Footer */}
      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
        This is AI-generated analysis, not financial advice. Always do your own research.
      </p>
    </div>
  );
}
