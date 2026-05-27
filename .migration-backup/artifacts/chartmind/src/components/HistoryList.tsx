import type { AnalysisRecord, MarketBias, TradeType } from "../types";

interface HistoryListProps {
  analyses: AnalysisRecord[];
  onSelect: (analysis: AnalysisRecord) => void;
  selectedId: number | null;
}

function getBiasStyle(bias: MarketBias) {
  return {
    bullish: { color: "var(--cm-bullish)", bg: "var(--cm-bullish-dim)" },
    bearish: { color: "var(--cm-bearish)", bg: "var(--cm-bearish-dim)" },
    neutral: { color: "var(--cm-neutral)", bg: "var(--cm-neutral-dim)" },
  }[bias];
}

function getSetupStyle(type: TradeType) {
  return {
    buy: { color: "var(--cm-bullish)", label: "BUY" },
    sell: { color: "var(--cm-bearish)", label: "SELL" },
    wait: { color: "var(--cm-neutral)", label: "WAIT" },
  }[type];
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HistoryList({ analyses, onSelect, selectedId }: HistoryListProps) {
  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <span className="text-2xl">📋</span>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No analyses yet</p>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>Upload a chart to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {analyses.map((a) => {
        const r = a.result;
        const isSelected = selectedId === a.id;
        const biasStyle = r ? getBiasStyle(r.marketBias) : null;
        const setupStyle = r ? getSetupStyle(r.tradeSetup.type) : null;

        return (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className="text-left w-full rounded-xl p-3 transition-all duration-150 flex gap-3"
            style={{
              background: isSelected ? "hsl(var(--secondary))" : "hsl(var(--card))",
              border: `1px solid ${isSelected ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"}`,
            }}
          >
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background: "hsl(var(--muted))" }}>
              {a.imageUrl ? (
                <img src={a.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📈</div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {r && biasStyle && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: biasStyle.bg, color: biasStyle.color, fontFamily: "var(--font-mono, monospace)" }}>
                    {r.marketBias.toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-semibold"
                  style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--muted-foreground))" }}>
                  {a.timeframe}
                </span>
              </div>

              {r && (
                <p className="text-xs leading-tight line-clamp-2" style={{ color: "hsl(var(--foreground))" }}>
                  {r.reasoning?.slice(0, 80)}...
                </p>
              )}

              <div className="flex items-center justify-between">
                {r && setupStyle && (
                  <span className="text-xs font-bold" style={{ color: setupStyle.color, fontFamily: "var(--font-mono, monospace)" }}>
                    {setupStyle.label}
                  </span>
                )}
                {r && (
                  <span className="text-xs font-bold ml-auto" style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--cm-accent)" }}>
                    {r.confidence}%
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
