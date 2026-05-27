import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadComponent } from "../components/UploadComponent";
import { AnalysisCard } from "../components/AnalysisCard";
import { HistoryList } from "../components/HistoryList";
import { StatsPanel } from "../components/StatsPanel";
import { MultiChartUpload, CONFLUENCE_TIMEFRAMES, type ConfluenceTimeframe, type ChartSlot } from "../components/MultiChartUpload";
import { ConfluenceCard } from "../components/ConfluenceCard";
import type { AnalysisRecord, Timeframe } from "../types";

const API_BASE = `${import.meta.env.BASE_URL}api`;

async function fetchConfig() {
  const res = await fetch(`${API_BASE}/analyses/config`);
  if (!res.ok) return { isMockMode: true, dailyLimitUsd: 2, monthlyLimitUsd: 10 };
  return res.json();
}
async function fetchAnalyses(): Promise<AnalysisRecord[]> {
  const res = await fetch(`${API_BASE}/analyses?limit=30`);
  if (!res.ok) throw new Error("Failed to load history");
  return (await res.json()).analyses ?? [];
}
async function fetchStats() {
  const res = await fetch(`${API_BASE}/analyses/stats`);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}
async function runAnalysis(payload: { imageUrl: string; timeframe: Timeframe }): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/analyses`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Analysis failed" })); throw new Error(e.error ?? "Analysis failed"); }
  return res.json();
}
async function runConfluence(charts: Array<{ imageUrl: string; timeframe: string }>) {
  const res = await fetch(`${API_BASE}/confluence`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ charts }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Confluence failed" })); throw new Error(e.error ?? "Confluence analysis failed"); }
  return res.json();
}

type Tab = "full" | "quick" | "history" | "stats";

function initSlots(): ChartSlot[] {
  return CONFLUENCE_TIMEFRAMES.map(tf => ({ timeframe: tf, imageDataUrl: null, kb: null }));
}

// ── Loading overlay progress steps ──────────────────────────────────────────
const MTF_STEPS = [
  "Images compressed",
  "Uploading to AI...",
  "Analysing timeframes...",
  "Scoring confluence...",
  "Generating trade setup",
];
const QUICK_STEPS = ["Image compressed", "Uploading to AI...", "Reading chart...", "Generating analysis"];

function LoadingOverlay({ isMulti, filledCount }: { isMulti: boolean; filledCount: number }) {
  const [step, setStep] = useState(0);
  const steps = isMulti ? MTF_STEPS : QUICK_STEPS;
  const delays = isMulti ? [0, 800, 2500, 5000, 8500] : [0, 600, 2000, 5000];

  useEffect(() => {
    setStep(0);
    const timers = delays.map((d, i) => setTimeout(() => setStep(i), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(8,8,16,0.92)", backdropFilter: "blur(20px)" }}>
      {/* Animated logo */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="relative">
          <div className="cm-pulse-ring w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--cm-purple), var(--cm-cyan))" }}>
            <HexIcon size={28} color="#fff" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)" }}>
            {isMulti ? `Analysing ${filledCount} Timeframes` : "Analysing Chart"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--cm-text-secondary)" }}>
            {isMulti ? "HTF/LTF weighted confluence scoring" : "GPT-4o vision analysis"}
          </p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex flex-col gap-3 w-64">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: i < step ? "var(--cm-bullish-dim)" : i === step ? "var(--cm-purple-dim)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${i < step ? "var(--cm-bullish)" : i === step ? "var(--cm-purple)" : "rgba(255,255,255,0.08)"}`,
                transition: "all 0.3s ease",
              }}>
              {i < step ? (
                <span style={{ color: "var(--cm-bullish)", fontSize: "0.6rem" }}>✓</span>
              ) : i === step ? (
                <div className="cm-spin w-2.5 h-2.5 border rounded-full"
                  style={{ borderColor: "var(--cm-purple-dim)", borderTopColor: "var(--cm-purple)" }} />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
              )}
            </div>
            <span className="text-xs transition-colors duration-300"
              style={{
                fontFamily: "var(--cm-font-body)",
                color: i < step ? "var(--cm-bullish)" : i === step ? "var(--cm-text-primary)" : "var(--cm-text-muted)",
              }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {isMulti && (
        <p className="text-xs mt-8 text-center" style={{ color: "var(--cm-text-muted)" }}>
          Running in parallel · typically 15–30s
        </p>
      )}
    </div>
  );
}

// ── Hexagon icon ─────────────────────────────────────────────────────────────
function HexIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 21.2,7 21.2,17 12,22 2.8,17 2.8,7" fill={color} />
      <polygon points="12,6 17.5,9.2 17.5,14.8 12,18 6.5,14.8 6.5,9.2" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "full",    label: "Full MTF", icon: "⊞" },
  { id: "quick",   label: "Analyze",  icon: "⚡" },
  { id: "history", label: "History",  icon: "◷" },
  { id: "stats",   label: "Stats",    icon: "▦" },
];

function TabBar({ active, onChange, historyCount }: { active: Tab; onChange: (t: Tab) => void; historyCount: number }) {
  const activeIndex = TABS.findIndex(t => t.id === active);
  const itemWidth = 100 / TABS.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(15,15,26,0.9)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--cm-border-default)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        maxWidth: "480px",
        margin: "0 auto",
      }}>
      <div className="relative flex" style={{ height: "56px" }}>
        {/* Sliding indicator */}
        <div className="absolute top-0 left-0 h-0.5 rounded-b-full transition-all duration-300"
          style={{
            width: `${itemWidth}%`,
            left: `${activeIndex * itemWidth}%`,
            background: "linear-gradient(90deg, var(--cm-purple), var(--cm-cyan))",
            boxShadow: "0 0 12px var(--cm-purple-glow)",
          }} />

        {TABS.map(({ id, label, icon }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative"
              style={{ minHeight: "48px" }}>
              <span className="text-base transition-all duration-200"
                style={{
                  filter: isActive ? `drop-shadow(0 0 6px var(--cm-purple))` : "none",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  color: isActive ? "var(--cm-purple)" : "var(--cm-text-muted)",
                }}>
                {icon}
              </span>
              <span className="text-xs font-semibold transition-colors duration-200"
                style={{
                  fontFamily: "var(--cm-font-display)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.06em",
                  color: isActive ? "var(--cm-purple)" : "var(--cm-text-muted)",
                }}>
                {label}
                {id === "history" && historyCount > 0 && (
                  <span className="ml-1 px-1 rounded-full text-xs"
                    style={{ background: "var(--cm-purple-dim)", color: "var(--cm-purple)", fontSize: "0.5rem" }}>
                    {historyCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("full");
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);
  const [confluenceResult, setConfluenceResult] = useState<unknown>(null);
  const [slots, setSlots] = useState<ChartSlot[]>(initSlots);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const configQuery = useQuery({ queryKey: ["config"], queryFn: fetchConfig, staleTime: Infinity });
  const isMockMode: boolean = configQuery.data?.isMockMode ?? true;
  const historyQuery = useQuery({ queryKey: ["analyses"], queryFn: fetchAnalyses });
  const statsQuery = useQuery({ queryKey: ["analyses-stats"], queryFn: fetchStats });

  const analyzeMutation = useMutation({
    mutationFn: runAnalysis,
    onSuccess: (data) => {
      setCurrentAnalysis(data); setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analyses-stats"] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : "Analysis failed"),
  });

  const confluenceMutation = useMutation({
    mutationFn: runConfluence,
    onSuccess: (data) => {
      setConfluenceResult(data); setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analyses-stats"] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : "Confluence failed"),
  });

  const handleAnalyze = useCallback((imageDataUrl: string, timeframe: Timeframe) => {
    setErrorMsg(null); analyzeMutation.mutate({ imageUrl: imageDataUrl, timeframe });
  }, [analyzeMutation]);

  const handleConfluenceAnalyze = useCallback(() => {
    const filled = slots.filter(s => s.imageDataUrl !== null);
    if (filled.length < 2) return;
    setErrorMsg(null); setConfluenceResult(null);
    confluenceMutation.mutate(filled.map(s => ({ imageUrl: s.imageDataUrl!, timeframe: s.timeframe })));
  }, [slots, confluenceMutation]);

  const handleSlotUpload = useCallback((tf: ConfluenceTimeframe, dataUrl: string, kb: number) => {
    setSlots(prev => prev.map(s => s.timeframe === tf ? { ...s, imageDataUrl: dataUrl, kb } : s));
    setConfluenceResult(null);
  }, []);
  const handleSlotClear = useCallback((tf: ConfluenceTimeframe) => {
    setSlots(prev => prev.map(s => s.timeframe === tf ? { ...s, imageDataUrl: null, kb: null } : s));
    setConfluenceResult(null);
  }, []);

  const handleSelectHistory = useCallback((a: AnalysisRecord) => {
    setSelectedId(a.id); setCurrentAnalysis(a); setActiveTab("quick");
  }, []);

  const handleTabChange = (t: Tab) => {
    setActiveTab(t); setErrorMsg(null);
    contentRef.current?.scrollTo(0, 0);
  };

  const filledCount = slots.filter(s => s.imageDataUrl !== null).length;
  const isAnalyzingFull = confluenceMutation.isPending;
  const isAnalyzingQuick = analyzeMutation.isPending;

  return (
    <>
      {/* Gradient mesh background */}
      <div className="cm-mesh-bg" />

      {/* Loading overlay */}
      {(isAnalyzingFull || isAnalyzingQuick) && (
        <LoadingOverlay isMulti={isAnalyzingFull} filledCount={filledCount} />
      )}

      <div className="relative z-10 flex flex-col min-h-dvh" style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{
            background: "rgba(8,8,16,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--cm-border-subtle)",
            boxShadow: "0 1px 0 var(--cm-border-default)",
          }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--cm-purple), var(--cm-cyan))", boxShadow: "0 0 16px var(--cm-purple-glow)" }}>
              <HexIcon size={18} color="#fff" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-black text-base tracking-tight"
                style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)" }}>
                ChartMind
              </span>
              <span className="text-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)", fontSize: "0.6rem" }}>
                AI Market Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: isMockMode ? "rgba(245,166,35,0.10)" : "rgba(0,230,118,0.10)",
                border: `1px solid ${isMockMode ? "rgba(245,166,35,0.3)" : "rgba(0,230,118,0.3)"}`,
              }}>
              <div className="w-1.5 h-1.5 rounded-full cm-pulse-dot"
                style={{ background: isMockMode ? "var(--cm-amber)" : "var(--cm-bullish)" }} />
              <span className="text-xs font-bold"
                style={{ fontFamily: "var(--cm-font-display)", color: isMockMode ? "var(--cm-amber)" : "var(--cm-bullish)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                {isMockMode ? "DEMO" : "LIVE"}
              </span>
            </div>
          </div>
        </header>

        {/* ── Demo banner ── */}
        {isMockMode && !demoBannerDismissed && (
          <div className="flex items-center justify-between px-4 py-2 cm-fade-in"
            style={{ background: "rgba(245,166,35,0.08)", borderBottom: "1px solid rgba(245,166,35,0.15)" }}>
            <p className="text-xs" style={{ color: "var(--cm-amber)", fontFamily: "var(--cm-font-body)" }}>
              ◈ Demo Mode — simulated analysis · no API cost · add OpenAI key to go live
            </p>
            <button onClick={() => setDemoBannerDismissed(true)}
              className="ml-2 text-xs flex-shrink-0" style={{ color: "var(--cm-amber)", opacity: 0.6 }}>✕</button>
          </div>
        )}

        {/* ── Content ── */}
        <main ref={contentRef} className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">

          {/* Error */}
          {errorMsg && (
            <div className="rounded-xl px-4 py-3 text-sm cm-fade-in flex items-start gap-2"
              style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)", border: "1px solid rgba(255,61,87,0.25)" }}>
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span style={{ fontFamily: "var(--cm-font-body)" }}>{errorMsg}</span>
            </div>
          )}

          {/* ── FULL ANALYSIS TAB ── */}
          {activeTab === "full" && (
            <div className="flex flex-col gap-4 cm-fade-in">
              <MultiChartUpload
                slots={slots}
                onUpload={handleSlotUpload}
                onClear={handleSlotClear}
                onAnalyze={handleConfluenceAnalyze}
                isAnalyzing={isAnalyzingFull}
                isMockMode={isMockMode}
              />
              {confluenceResult && !isAnalyzingFull && (
                <ConfluenceCard data={confluenceResult as Parameters<typeof ConfluenceCard>[0]["data"]} />
              )}
              {!confluenceResult && !isAnalyzingFull && !errorMsg && slots.every(s => !s.imageDataUrl) && (
                <div className="flex flex-col items-center gap-3 py-6 text-center cm-stagger-3">
                  <div className="text-3xl" style={{ filter: "grayscale(0.3)" }}>📊</div>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)" }}>
                    Multi-Timeframe Confluence
                  </p>
                  <p className="text-xs leading-relaxed max-w-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
                    Upload 15m, 1h, 4h and 1D charts. ChartMind scores weighted HTF/LTF confluence and generates one final trade decision.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── QUICK ANALYSIS TAB ── */}
          {activeTab === "quick" && (
            <div className="flex flex-col gap-4 cm-fade-in">
              <UploadComponent onAnalyze={handleAnalyze} isAnalyzing={isAnalyzingQuick} isMockMode={isMockMode} />
              {currentAnalysis && !isAnalyzingQuick && (
                <AnalysisCard analysis={currentAnalysis} />
              )}
              {!currentAnalysis && !isAnalyzingQuick && !errorMsg && (
                <div className="flex flex-col items-center gap-3 py-8 text-center cm-stagger-3">
                  <div className="text-3xl">⚡</div>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)" }}>
                    Quick single-chart analysis
                  </p>
                  <p className="text-xs leading-relaxed max-w-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
                    Upload any chart for instant RSI, Stochastic, MA structure and trade setup read. Use Full MTF for a proper entry decision.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            <div className="cm-fade-in">
              {historyQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="cm-spin w-7 h-7 border-2 rounded-full"
                    style={{ borderColor: "var(--cm-border-default)", borderTopColor: "var(--cm-purple)" }} />
                </div>
              ) : (
                <HistoryList analyses={historyQuery.data ?? []} onSelect={handleSelectHistory} selectedId={selectedId} />
              )}
            </div>
          )}

          {/* ── STATS TAB ── */}
          {activeTab === "stats" && (
            <div className="cm-fade-in">
              {statsQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="cm-spin w-7 h-7 border-2 rounded-full"
                    style={{ borderColor: "var(--cm-border-default)", borderTopColor: "var(--cm-purple)" }} />
                </div>
              ) : statsQuery.isError ? (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)" }}>
                  Failed to load stats
                </div>
              ) : statsQuery.data ? (
                <StatsPanel stats={statsQuery.data} />
              ) : null}
            </div>
          )}
        </main>

        {/* ── Bottom tab bar ── */}
        <TabBar
          active={activeTab}
          onChange={handleTabChange}
          historyCount={historyQuery.data?.length ?? 0}
        />
      </div>
    </>
  );
}
