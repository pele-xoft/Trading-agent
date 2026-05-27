import { useEffect, useState } from "react";

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

function useCountUp(to: number, duration = 1000): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(to * ease));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);
  return val;
}

function StatChip({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl p-3 cm-stagger-1"
      style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-default)" }}>
      <span style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-display)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span className="text-2xl font-black leading-tight"
        style={{ fontFamily: "var(--cm-font-mono)", color: color ?? "var(--cm-text-primary)" }}>
        {value}
      </span>
      {sub && <span style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)", fontSize: "0.6rem" }}>{sub}</span>}
    </div>
  );
}

function SpendBar({ label, spent, limit, color }: { label: string; spent: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const danger = pct >= 80;
  const barColor = danger ? "var(--cm-bearish)" : color;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-display)", fontSize: "0.6rem", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-black text-xs" style={{ fontFamily: "var(--cm-font-mono)", color: barColor }}>
            ${spent.toFixed(4)}
          </span>
          <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-mono)" }}>
            / ${limit.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full cm-bar-scale"
          style={{ width: `${pct}%`, background: barColor, filter: `drop-shadow(0 0 4px ${barColor}50)` }} />
      </div>
      <p className="text-xs" style={{ color: danger ? "var(--cm-bearish)" : "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)", fontSize: "0.6rem" }}>
        {pct < 1 ? "No spend yet" : `${pct.toFixed(1)}% used`}{danger ? " — approaching limit" : ""}
      </p>
    </div>
  );
}

function BiasBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider" style={{ color, fontFamily: "var(--cm-font-display)", fontSize: "0.6rem" }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black" style={{ color, fontFamily: "var(--cm-font-mono)" }}>{pct}%</span>
          <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-mono)" }}>({count})</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full cm-bar-scale"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }} />
      </div>
    </div>
  );
}

function CacheBar({ hits, total }: { hits: number; total: number }) {
  const pct = total > 0 ? Math.round((hits / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-display)", fontSize: "0.6rem", letterSpacing: "0.06em" }}>
          CACHE HIT RATE
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-black text-xs" style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-cyan)" }}>{pct}%</span>
          <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>saves money</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full cm-bar-scale"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--cm-cyan)60, var(--cm-cyan))" }} />
      </div>
    </div>
  );
}

export function StatsPanel({ stats }: { stats: StatsData }) {
  const isMock = stats.isMockMode ?? true;
  const dailyLimit = stats.dailyLimitUsd ?? 2;
  const monthlyLimit = stats.monthlyLimitUsd ?? 10;
  const todaySpend = stats.todayCostUsd ?? 0;
  const monthSpend = stats.monthlyCostUsd ?? 0;
  const cacheHits = stats.cacheHits ?? 0;
  const avgCost = stats.avgCostPerAnalysis ?? 0;
  const totalDisplayed = useCountUp(stats.total);
  const confDisplayed = useCountUp(stats.avgConfidence);

  const timeframeSorted = TIMEFRAME_ORDER
    .map(tf => stats.byTimeframe.find(b => b.timeframe === tf))
    .filter(Boolean) as { timeframe: string; count: number }[];
  const maxTfCount = Math.max(...timeframeSorted.map(b => b.count), 1);

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-default)" }}>
          <span className="text-4xl">📊</span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)" }}>No data yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
            Analyse your first chart to see stats here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 cm-fade-in">

      {/* ── Mode badge ── */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
        style={{
          background: isMock ? "rgba(245,166,35,0.06)" : "rgba(0,230,118,0.06)",
          border: `1px solid ${isMock ? "rgba(245,166,35,0.2)" : "rgba(0,230,118,0.2)"}`,
        }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full cm-pulse-dot"
            style={{ background: isMock ? "var(--cm-amber)" : "var(--cm-bullish)" }} />
          <div className="flex flex-col">
            <span className="text-xs font-black" style={{ fontFamily: "var(--cm-font-display)", color: isMock ? "var(--cm-amber)" : "var(--cm-bullish)", fontSize: "0.7rem" }}>
              {isMock ? "DEMO MODE" : "LIVE MODE"}
            </span>
            <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)", fontSize: "0.6rem" }}>
              {isMock ? "Analyses are simulated — no API cost" : "Using GPT-4o mini vision · $0.001/analysis"}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md"
          style={{ background: "var(--cm-purple-dim)", color: "var(--cm-purple)", fontFamily: "var(--cm-font-mono)", fontSize: "0.6rem" }}>
          GPT-4o-mini
        </span>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-2">
        <StatChip label="This Month" value={`$${monthSpend.toFixed(3)}`} sub="API spend" color="var(--cm-purple)" />
        <StatChip label="Analyses" value={totalDisplayed} sub="total runs" />
        <StatChip
          label="Avg Confidence"
          value={`${confDisplayed}%`}
          color={stats.avgConfidence >= 70 ? "var(--cm-bullish)" : stats.avgConfidence >= 50 ? "var(--cm-amber)" : "var(--cm-bearish)"}
        />
        <StatChip
          label="Avg Cost"
          value={isMock ? "$0.000" : `$${avgCost.toFixed(4)}`}
          sub="per analysis"
          color="var(--cm-cyan)"
        />
      </div>

      {/* ── Budget bars ── */}
      {(!isMock || todaySpend > 0 || monthSpend > 0) && (
        <div className="rounded-xl p-4 flex flex-col gap-4"
          style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-default)" }}>
          <span className="text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
            API BUDGET
          </span>
          <SpendBar label="DAILY" spent={todaySpend} limit={dailyLimit} color="var(--cm-purple)" />
          <SpendBar label="MONTHLY" spent={monthSpend} limit={monthlyLimit} color="var(--cm-cyan)" />
          {stats.total > 0 && <CacheBar hits={cacheHits} total={stats.total} />}
        </div>
      )}

      {/* ── Bias breakdown ── */}
      <div className="rounded-xl p-4 flex flex-col gap-4"
        style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-default)" }}>
        <span className="text-xs font-black uppercase tracking-wider"
          style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
          MARKET BIAS BREAKDOWN
        </span>
        <BiasBar label="Bullish" count={stats.bullish} total={stats.total} color="var(--cm-bullish)" />
        <BiasBar label="Bearish" count={stats.bearish} total={stats.total} color="var(--cm-bearish)" />
        <BiasBar label="Neutral" count={stats.neutral} total={stats.total} color="var(--cm-neutral)" />
      </div>

      {/* ── Timeframe breakdown ── */}
      {timeframeSorted.length > 0 && (
        <div className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-default)" }}>
          <span className="text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
            BY TIMEFRAME
          </span>
          {timeframeSorted.map((b) => {
            const pct = Math.round((b.count / maxTfCount) * 100);
            return (
              <div key={b.timeframe} className="flex items-center gap-2.5">
                <span className="text-xs font-black w-8 text-right"
                  style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-text-secondary)", fontSize: "0.65rem" }}>
                  {b.timeframe}
                </span>
                <div className="flex-1 h-6 rounded-lg overflow-hidden relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-lg cm-bar-scale"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--cm-purple)60, var(--cm-purple))" }} />
                  <span className="absolute inset-0 flex items-center pl-2.5 text-xs font-black"
                    style={{ fontFamily: "var(--cm-font-mono)", color: pct > 35 ? "rgba(255,255,255,0.9)" : "var(--cm-text-secondary)", fontSize: "0.65rem" }}>
                    {b.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-center pb-2" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)", opacity: 0.4 }}>
        Stats update after each analysis
      </p>
    </div>
  );
}
