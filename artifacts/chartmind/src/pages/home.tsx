import { useState, useCallback } from "react";
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
  if (!res.ok) return { isMockMode: true, dailyLimitUsd: 2, monthlyLimitUsd: 10, costPerAnalysisUsd: 0 };
  return res.json();
}

async function fetchAnalyses(): Promise<AnalysisRecord[]> {
  const res = await fetch(`${API_BASE}/analyses?limit=30`);
  if (!res.ok) throw new Error("Failed to load history");
  const data = await res.json();
  return data.analyses ?? [];
}

async function fetchStats() {
  const res = await fetch(`${API_BASE}/analyses/stats`);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

async function runAnalysis(payload: { imageUrl: string; timeframe: Timeframe }): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(err.error ?? "Analysis failed");
  }
  return res.json();
}

async function runConfluence(charts: Array<{ imageUrl: string; timeframe: string }>) {
  const res = await fetch(`${API_BASE}/confluence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ charts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Confluence failed" }));
    throw new Error(err.error ?? "Confluence analysis failed");
  }
  return res.json();
}

type Tab = "analyze" | "history" | "stats";
type AnalyzeMode = "single" | "multi";

const TABS: { id: Tab; label: string }[] = [
  { id: "analyze", label: "Analyze" },
  { id: "history", label: "History" },
  { id: "stats", label: "Stats" },
];

function initSlots(): ChartSlot[] {
  return CONFLUENCE_TIMEFRAMES.map(tf => ({ timeframe: tf, imageDataUrl: null, kb: null }));
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [analyzeMode, setAnalyzeMode] = useState<AnalyzeMode>("single");
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);
  const [confluenceResult, setConfluenceResult] = useState<unknown>(null);
  const [slots, setSlots] = useState<ChartSlot[]>(initSlots);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const configQuery = useQuery({ queryKey: ["config"], queryFn: fetchConfig, staleTime: Infinity });
  const isMockMode: boolean = configQuery.data?.isMockMode ?? true;

  const historyQuery = useQuery({ queryKey: ["analyses"], queryFn: fetchAnalyses });
  const statsQuery = useQuery({ queryKey: ["analyses-stats"], queryFn: fetchStats });

  const analyzeMutation = useMutation({
    mutationFn: runAnalysis,
    onSuccess: (data) => {
      setCurrentAnalysis(data);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analyses-stats"] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : "Analysis failed"),
  });

  const confluenceMutation = useMutation({
    mutationFn: runConfluence,
    onSuccess: (data) => {
      setConfluenceResult(data);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analyses-stats"] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : "Confluence failed"),
  });

  const handleAnalyze = useCallback((imageDataUrl: string, timeframe: Timeframe) => {
    setErrorMsg(null);
    analyzeMutation.mutate({ imageUrl: imageDataUrl, timeframe });
  }, [analyzeMutation]);

  const handleConfluenceAnalyze = useCallback(() => {
    const filled = slots.filter(s => s.imageDataUrl !== null);
    if (filled.length < 2) return;
    setErrorMsg(null);
    setConfluenceResult(null);
    const charts = filled.map(s => ({ imageUrl: s.imageDataUrl!, timeframe: s.timeframe }));
    confluenceMutation.mutate(charts);
  }, [slots, confluenceMutation]);

  const handleSlotUpload = useCallback((tf: ConfluenceTimeframe, dataUrl: string, kb: number) => {
    setSlots(prev => prev.map(s => s.timeframe === tf ? { ...s, imageDataUrl: dataUrl, kb } : s));
    setConfluenceResult(null);
  }, []);

  const handleSlotClear = useCallback((tf: ConfluenceTimeframe) => {
    setSlots(prev => prev.map(s => s.timeframe === tf ? { ...s, imageDataUrl: null, kb: null } : s));
    setConfluenceResult(null);
  }, []);

  const handleModeSwitch = (mode: AnalyzeMode) => {
    setAnalyzeMode(mode);
    setErrorMsg(null);
  };

  const handleSelectHistory = useCallback((a: AnalysisRecord) => {
    setSelectedId(a.id);
    setCurrentAnalysis(a);
    setActiveTab("analyze");
    setAnalyzeMode("single");
  }, []);

  const isAnalyzing = analyzeMutation.isPending || confluenceMutation.isPending;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "hsl(var(--background))", maxWidth: "480px", margin: "0 auto" }}>

      {/* Mock mode banner */}
      {isMockMode && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold"
          style={{ background: "rgba(245, 166, 35, 0.12)", borderBottom: "1px solid rgba(245, 166, 35, 0.25)", color: "var(--cm-accent)" }}>
          <span>⚡</span>
          <span>Demo Mode — analyses are simulated, no API cost</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: "var(--cm-accent)", color: "#0a0a0f" }}>CM</div>
          <span className="font-bold text-base tracking-tight" style={{ color: "hsl(var(--foreground))" }}>ChartMind</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: "var(--cm-accent-dim)", color: "var(--cm-accent)" }}>
          {isMockMode ? "Demo Mode" : "GPT-4o Vision"}
        </span>
      </header>

      {/* Tabs */}
      <div className="flex border-b px-4" style={{ borderColor: "hsl(var(--border))" }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="py-3 px-1 mr-5 text-sm font-semibold relative transition-colors"
            style={{ color: activeTab === id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
          >
            {label}
            {id === "history" && (historyQuery.data?.length ?? 0) > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--cm-accent-dim)", color: "var(--cm-accent)" }}>
                {historyQuery.data!.length}
              </span>
            )}
            {id === "stats" && (statsQuery.data?.total ?? 0) > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--cm-neutral-dim)", color: "var(--cm-neutral)" }}>
                {statsQuery.data!.total}
              </span>
            )}
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: "var(--cm-accent)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* ANALYZE TAB */}
        {activeTab === "analyze" && (
          <>
            {/* Mode toggle */}
            <div className="flex rounded-xl p-1 gap-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              {(["single", "multi"] as AnalyzeMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => handleModeSwitch(mode)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150"
                  style={{
                    background: analyzeMode === mode ? "var(--cm-accent)" : "transparent",
                    color: analyzeMode === mode ? "#0a0a0f" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {mode === "single" ? "Single Chart" : "Multi-TF Confluence"}
                </button>
              ))}
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="rounded-xl px-4 py-3 text-sm cm-fade-in"
                style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)", border: "1px solid var(--cm-bearish)" }}>
                {errorMsg}
              </div>
            )}

            {/* SINGLE MODE */}
            {analyzeMode === "single" && (
              <>
                <UploadComponent
                  onAnalyze={handleAnalyze}
                  isAnalyzing={analyzeMutation.isPending}
                  isMockMode={isMockMode}
                />

                {analyzeMutation.isPending && (
                  <div className="flex flex-col items-center gap-3 py-8 cm-fade-in">
                    <div className="cm-spin w-8 h-8 border-2 rounded-full"
                      style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
                    <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>AI is reading your chart...</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>
                      {isMockMode ? "Simulating analysis..." : "This takes 5–15 seconds"}
                    </p>
                  </div>
                )}

                {currentAnalysis && !analyzeMutation.isPending && (
                  <AnalysisCard analysis={currentAnalysis} />
                )}

                {!currentAnalysis && !analyzeMutation.isPending && !errorMsg && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="text-3xl">🧠</div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>AI-powered chart analysis</p>
                    <p className="text-xs leading-relaxed max-w-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Upload a chart screenshot and get instant technical analysis — RSI, Stochastic, MAs, structure, and trade setups.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* MULTI-TF CONFLUENCE MODE */}
            {analyzeMode === "multi" && (
              <>
                <MultiChartUpload
                  slots={slots}
                  onUpload={handleSlotUpload}
                  onClear={handleSlotClear}
                  onAnalyze={handleConfluenceAnalyze}
                  isAnalyzing={confluenceMutation.isPending}
                  isMockMode={isMockMode}
                />

                {confluenceMutation.isPending && (
                  <div className="flex flex-col items-center gap-3 py-8 cm-fade-in">
                    <div className="cm-spin w-8 h-8 border-2 rounded-full"
                      style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
                    <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Analysing {slots.filter(s => s.imageDataUrl).length} timeframes in parallel...
                    </p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>
                      {isMockMode ? "Simulating confluence..." : "This may take 15–30 seconds"}
                    </p>
                  </div>
                )}

                {confluenceResult && !confluenceMutation.isPending && (
                  <ConfluenceCard data={confluenceResult as Parameters<typeof ConfluenceCard>[0]["data"]} />
                )}

                {!confluenceResult && !confluenceMutation.isPending && !errorMsg && slots.every(s => !s.imageDataUrl) && (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="text-3xl">📊</div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Top-down alignment check</p>
                    <p className="text-xs leading-relaxed max-w-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Upload your 15m, 1h, 4h and 1D charts. ChartMind checks whether all timeframes agree on direction before you place a trade.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <>
            {historyQuery.isLoading && (
              <div className="flex justify-center py-8">
                <div className="cm-spin w-6 h-6 border-2 rounded-full"
                  style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
              </div>
            )}
            {historyQuery.data && (
              <HistoryList analyses={historyQuery.data} onSelect={handleSelectHistory} selectedId={selectedId} />
            )}
          </>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <>
            {statsQuery.isLoading && (
              <div className="flex justify-center py-8">
                <div className="cm-spin w-6 h-6 border-2 rounded-full"
                  style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
              </div>
            )}
            {statsQuery.isError && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)" }}>
                Failed to load stats
              </div>
            )}
            {statsQuery.data && <StatsPanel stats={statsQuery.data} />}
          </>
        )}
      </main>
    </div>
  );
}
