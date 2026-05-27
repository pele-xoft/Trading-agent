const TIMEFRAME_ORDER = ["5m", "15m", "1h", "4h", "1D"];

interface StatsData {
  total: number;
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  byTimeframe: { timeframe: string; count: number }[];
  todayCostUsd?: number;
  monthlyCostUsd?: number;
  totalCostUsd?: number;
  dailyLimitUsd?: number;
  monthlyLimitUsd?: number;
  avgCostPerAnalysis?: number;
  cacheHits?: number;
  isMockMode?: boolean;
}

interface StatsPanelProps {
  stats: StatsData;
}

function SpendBar({ label, spent, limit, color }: { label: string; spent: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const danger = pct >= 80;
  const barColor = danger ? "var(--cm-bearish)" : color;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono, monospace)", color: barColor }}>
            ${spent.toFixed(4)}
          </span>
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>
            / ${limit.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <p className="text-xs" style={{ color: danger ? "var(--cm-bearish)" : "hsl(var(--muted-foreground))", opacity: danger ? 1 : 0.6 }}>
        {pct < 1 ? "No spend yet" : `${pct.toFixed(1)}% of limit used`}
        {danger && " — approaching limit"}
      </p>
    </div>
  );
}

function BiasBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color, fontFamily: "var(--font-mono, monospace)" }}>{pct}%</span>
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono, monospace)" }}>({count})</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, opacity: 0.85 }} />
      </div>
    </div>
  );
}

function StatChip({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl p-3"
      style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
      <span className="text-lg font-black leading-tight"
        style={{ fontFamily: "var(--font-mono, monospace)", color: valueColor ?? "hsl(var(--foreground))" }}>
        {value}
      </span>
      {sub && <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>{sub}</span>}
    </div>
  );
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const timeframeSorted = TIMEFRAME_ORDER
    .map((tf) => stats.byTimeframe.find((b) => b.timeframe === tf))
    .filter(Boolean) as { timeframe: string; count: number }[];
  const maxTfCount = Math.max(...timeframeSorted.map((b) => b.count), 1);

  const isMock = stats.isMockMode ?? true;
  const dailyLimit = stats.dailyLimitUsd ?? 2;
  const monthlyLimit = stats.monthlyLimitUsd ?? 10;
  const todaySpend = stats.todayCostUsd ?? 0;
  const monthSpend = stats.monthlyCostUsd ?? 0;
  const cacheHits = stats.cacheHits ?? 0;
  const avgCost = stats.avgCostPerAnalysis ?? 0;

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <span className="text-3xl">📊</span>
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No data yet</p>
        <p className="text-xs text-center max-w-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Analyze your first chart to see stats here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 cm-fade-in">

      {/* Mode badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: isMock ? "rgba(245,166,35,0.08)" : "rgba(34,197,94,0.08)",
          border: `1px solid ${isMock ? "rgba(245,166,35,0.25)" : "rgba(34,197,94,0.25)"}`,
        }}>
        <span className="text-sm">{isMock ? "⚡" : "🟢"}</span>
        <div className="flex flex-col">
          <span className="text-xs font-bold" style={{ color: isMock ? "var(--cm-accent)" : "var(--cm-bullish)" }}>
            {isMock ? "Demo Mode" : "Live Mode"}
          </span>
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isMock ? "Analyses are simulated — no API cost" : "Using GPT-4o mini vision"}
          </span>
        </div>
      </div>

      {/* Cost spend bars (only show in live mode or if there's any spend) */}
      {(!isMock || todaySpend > 0 || monthSpend > 0) && (
        <div className="rounded-xl p-4 flex flex-col gap-4"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            API Spend
          </span>
          <SpendBar label="Today" spent={todaySpend} limit={dailyLimit} color="var(--cm-accent)" />
          <SpendBar label="This Month" spent={monthSpend} limit={monthlyLimit} color="var(--cm-neutral)" />
        </div>
      )}

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatChip label="Total Analyses" value={String(stats.total)} />
        <StatChip
          label="Avg Confidence"
          value={`${stats.avgConfidence}%`}
          valueColor={stats.avgConfidence >= 70 ? "var(--cm-bullish)" : stats.avgConfidence >= 50 ? "var(--cm-accent)" : "var(--cm-bearish)"}
        />
        <StatChip
          label="Cache Hits"
          value={String(cacheHits)}
          sub="Same image reused"
          valueColor={cacheHits > 0 ? "var(--cm-bullish)" : undefined}
        />
        <StatChip
          label="Avg Cost"
          value={isMock ? "$0.000" : `$${avgCost.toFixed(4)}`}
          sub="Per analysis"
          valueColor="var(--cm-accent)"
        />
      </div>

      {/* Bias breakdown */}
      <div className="rounded-xl p-4 flex flex-col gap-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          Market Bias
        </span>
        <BiasBar label="Bullish" count={stats.bullish} total={stats.total} color="var(--cm-bullish)" />
        <BiasBar label="Bearish" count={stats.bearish} total={stats.total} color="var(--cm-bearish)" />
        <BiasBar label="Neutral" count={stats.neutral} total={stats.total} color="var(--cm-neutral)" />
      </div>

      {/* Timeframe breakdown */}
      {timeframeSorted.length > 0 && (
        <div className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            By Timeframe
          </span>
          {timeframeSorted.map((b) => {
            const pct = Math.round((b.count / maxTfCount) * 100);
            return (
              <div key={b.timeframe} className="flex items-center gap-2">
                <span className="text-xs font-bold w-8 text-right"
                  style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--muted-foreground))" }}>
                  {b.timeframe}
                </span>
                <div className="flex-1 h-5 rounded overflow-hidden relative" style={{ background: "hsl(var(--border))" }}>
                  <div className="h-full rounded transition-all duration-700"
                    style={{ width: `${pct}%`, background: "var(--cm-accent)", opacity: 0.7 }} />
                  <span className="absolute inset-0 flex items-center pl-2 text-xs font-bold"
                    style={{ fontFamily: "var(--font-mono, monospace)", color: pct > 30 ? "#0a0a0f" : "hsl(var(--muted-foreground))" }}>
                    {b.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-center pb-2" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.4 }}>
        Stats update after each analysis
      </p>
    </div>
  );
}
