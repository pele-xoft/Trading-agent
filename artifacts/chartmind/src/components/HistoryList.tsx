import type { AnalysisRecord, MarketBias, TradeType } from "../types";

interface HistoryListProps {
  analyses: AnalysisRecord[];
  onSelect: (analysis: AnalysisRecord) => void;
  selectedId: number | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const BIAS_COLOR: Record<MarketBias, string> = {
  bullish: "var(--cm-bullish)",
  bearish: "var(--cm-bearish)",
  neutral: "var(--cm-neutral)",
};
const BIAS_BG: Record<MarketBias, string> = {
  bullish: "var(--cm-bullish-dim)",
  bearish: "var(--cm-bearish-dim)",
  neutral: "var(--cm-neutral-dim)",
};
const BIAS_ICON: Record<MarketBias, string> = { bullish: "▲", bearish: "▼", neutral: "→" };
const SETUP_COLOR: Record<TradeType, string> = {
  buy:  "var(--cm-bullish)",
  sell: "var(--cm-bearish)",
  wait: "var(--cm-neutral)",
};
const SETUP_LABEL: Record<TradeType, string> = { buy: "BUY", sell: "SELL", wait: "WAIT" };

export function HistoryList({ analyses, onSelect, selectedId }: HistoryListProps) {
  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        {/* Illustrated empty state */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--cm-bg-elevated)", border: "1px solid var(--cm-border-default)" }}>
          <span className="text-4xl" style={{ filter: "grayscale(0.3)" }}>🕯</span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)" }}>
            No analyses yet
          </p>
          <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
            Upload your first chart to get started. Use Full MTF for a proper confluence decision.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-black uppercase tracking-wider"
          style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>
          RECENT ANALYSES
        </span>
        <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-mono)", fontSize: "0.6rem" }}>
          {analyses.length} total
        </span>
      </div>

      {analyses.map((a, idx) => {
        const r = a.result;
        const isSelected = selectedId === a.id;
        const biasColor = r ? BIAS_COLOR[r.marketBias] : "var(--cm-neutral)";
        const biasBg = r ? BIAS_BG[r.marketBias] : "var(--cm-neutral-dim)";
        const biasIcon = r ? BIAS_ICON[r.marketBias] : "→";
        const setupColor = r ? SETUP_COLOR[r.tradeSetup.type] : "var(--cm-neutral)";
        const setupLabel = r ? SETUP_LABEL[r.tradeSetup.type] : "—";
        const confColor = r
          ? r.confidence >= 70 ? "var(--cm-bullish)" : r.confidence >= 50 ? "var(--cm-amber)" : "var(--cm-bearish)"
          : "var(--cm-neutral)";

        return (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className="text-left w-full rounded-xl overflow-hidden transition-all duration-150 flex gap-0"
            style={{
              background: isSelected ? "var(--cm-bg-elevated)" : "var(--cm-bg-surface)",
              border: `1px solid ${isSelected ? "var(--cm-border-strong)" : "var(--cm-border-default)"}`,
              boxShadow: isSelected ? "0 0 0 1px var(--cm-purple-dim)" : "none",
              animation: `cm-fade-up 0.35s ease ${Math.min(idx, 8) * 30}ms both`,
            }}
          >
            {/* Left accent bar */}
            <div className="w-0.5 flex-shrink-0"
              style={{ background: r ? biasColor : "var(--cm-border-default)", opacity: 0.6 }} />

            {/* Thumbnail */}
            <div className="w-14 h-14 flex-shrink-0 overflow-hidden m-2.5 rounded-lg"
              style={{ background: "var(--cm-bg-elevated)" }}>
              {a.imageUrl ? (
                <img src={a.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📈</div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-2.5 pr-3 flex flex-col justify-between">
              {/* Top row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {r && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: biasBg, color: biasColor, fontFamily: "var(--cm-font-display)", fontSize: "0.6rem" }}>
                    {biasIcon} {r.marketBias.toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-bold"
                  style={{ fontFamily: "var(--cm-font-mono)", color: "var(--cm-purple)", fontSize: "0.65rem" }}>
                  {a.timeframe}
                </span>
                {a.aiModel === "mock" && (
                  <span className="text-xs px-1 rounded"
                    style={{ background: "var(--cm-amber-dim)", color: "var(--cm-amber)", fontSize: "0.5rem", fontFamily: "var(--cm-font-display)" }}>
                    DEMO
                  </span>
                )}
              </div>

              {/* Reasoning snippet */}
              {r && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)", lineHeight: 1.4 }}>
                  {r.reasoning?.slice(0, 72)}{r.reasoning?.length > 72 ? "…" : ""}
                </p>
              )}

              {/* Bottom row */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  {r && (
                    <span className="text-xs font-black"
                      style={{ color: setupColor, fontFamily: "var(--cm-font-display)", fontSize: "0.6rem", letterSpacing: "0.06em" }}>
                      {setupLabel}
                    </span>
                  )}
                  {a.createdAt && (
                    <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)", fontSize: "0.6rem" }}>
                      {timeAgo(typeof a.createdAt === "string" ? a.createdAt : new Date(a.createdAt).toISOString())}
                    </span>
                  )}
                </div>
                {r && (
                  <span className="text-xs font-black"
                    style={{ fontFamily: "var(--cm-font-mono)", color: confColor, fontSize: "0.7rem" }}>
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
