const TIMEFRAME_ORDER = ["5m", "15m", "1h", "4h", "1D"];

interface StatsData {
  total: number;
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  byTimeframe: { timeframe: string; count: number }[];
}

interface StatsPanelProps {
  stats: StatsData;
}

function BiasBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string; dimColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color, fontFamily: "var(--font-mono, monospace)" }}>
            {pct}%
          </span>
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono, monospace)" }}>
            ({count})
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, opacity: 0.85 }}
        />
      </div>
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 70 ? "var(--cm-bullish)" : value >= 50 ? "var(--cm-accent)" : "var(--cm-bearish)";
  const label = value >= 70 ? "High" : value >= 50 ? "Medium" : "Low";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          Avg Confidence
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black" style={{ color, fontFamily: "var(--font-mono, monospace)", lineHeight: 1 }}>
            {value}
          </span>
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>/ 100</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs self-end font-semibold" style={{ color }}>{label} conviction</span>
    </div>
  );
}

function TimeframeBar({ timeframe, count, max }: { timeframe: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold w-8 text-right" style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--muted-foreground))" }}>
        {timeframe}
      </span>
      <div className="flex-1 h-5 rounded overflow-hidden relative" style={{ background: "hsl(var(--border))" }}>
        <div
          className="h-full rounded transition-all duration-700"
          style={{ width: `${pct}%`, background: "var(--cm-accent)", opacity: 0.7 }}
        />
        <span className="absolute inset-0 flex items-center pl-2 text-xs font-bold"
          style={{ fontFamily: "var(--font-mono, monospace)", color: pct > 30 ? "#0a0a0f" : "hsl(var(--muted-foreground))" }}>
          {count}
        </span>
      </div>
    </div>
  );
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const timeframeSorted = TIMEFRAME_ORDER
    .map((tf) => stats.byTimeframe.find((b) => b.timeframe === tf))
    .filter(Boolean) as { timeframe: string; count: number }[];

  const maxTfCount = Math.max(...timeframeSorted.map((b) => b.count), 1);

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="text-3xl">📊</span>
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No data yet</p>
        <p className="text-xs text-center max-w-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Analyze your first chart to start seeing stats here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 cm-fade-in">

      {/* Total */}
      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            Total Analyses
          </span>
          <span className="text-4xl font-black" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-mono, monospace)", lineHeight: 1.1 }}>
            {stats.total}
          </span>
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "var(--cm-accent-dim)" }}>
          📈
        </div>
      </div>

      {/* Confidence meter */}
      <div className="rounded-xl p-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <ConfidenceMeter value={stats.avgConfidence} />
      </div>

      {/* Bias breakdown */}
      <div className="rounded-xl p-4 flex flex-col gap-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          Market Bias Breakdown
        </span>
        <BiasBar label="Bullish" count={stats.bullish} total={stats.total} color="var(--cm-bullish)" dimColor="var(--cm-bullish-dim)" />
        <BiasBar label="Bearish" count={stats.bearish} total={stats.total} color="var(--cm-bearish)" dimColor="var(--cm-bearish-dim)" />
        <BiasBar label="Neutral" count={stats.neutral} total={stats.total} color="var(--cm-neutral)" dimColor="var(--cm-neutral-dim)" />
      </div>

      {/* Timeframe breakdown */}
      {timeframeSorted.length > 0 && (
        <div className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            Analyses by Timeframe
          </span>
          <div className="flex flex-col gap-2">
            {timeframeSorted.map((b) => (
              <TimeframeBar key={b.timeframe} timeframe={b.timeframe} count={b.count} max={maxTfCount} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-center pb-2" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
        Stats update after each analysis
      </p>
    </div>
  );
}
