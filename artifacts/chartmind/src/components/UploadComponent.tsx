import { useCallback, useRef, useState } from "react";
import type { Timeframe } from "../types";

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "5m",  label: "5m"  },
  { value: "15m", label: "15m" },
  { value: "1h",  label: "1h"  },
  { value: "4h",  label: "4h"  },
  { value: "1D",  label: "1D"  },
];

const MAX_PX = 1024;
const JPEG_QUALITY = 0.82;
const COST_PER_ANALYSIS = 0.001;

function resizeImage(dataUrl: string): Promise<{ dataUrl: string; originalKB: number; resizedKB: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const originalKB = Math.round(dataUrl.length * 0.75 / 1024);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_PX / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const resized = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve({ dataUrl: resized, originalKB, resizedKB: Math.round(resized.length * 0.75 / 1024) });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

interface UploadComponentProps {
  onAnalyze: (imageDataUrl: string, timeframe: Timeframe) => void;
  isAnalyzing: boolean;
  isMockMode: boolean;
}

export function UploadComponent({ onAnalyze, isAnalyzing, isMockMode }: UploadComponentProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h");
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<{ originalKB: number; resizedKB: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsResizing(true); setSizeInfo(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { dataUrl, originalKB, resizedKB } = await resizeImage(e.target?.result as string);
        setPreview(dataUrl); setSizeInfo({ originalKB, resizedKB });
      } catch {
        setPreview(e.target?.result as string);
      } finally { setIsResizing(false); }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, [handleFile]);

  const handleClear = () => { setPreview(null); setSizeInfo(null); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const savings = sizeInfo ? Math.round((1 - sizeInfo.resizedKB / sizeInfo.originalKB) * 100) : 0;
  const canAnalyze = !!preview && !isAnalyzing && !isResizing;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-black" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)", letterSpacing: "0.02em" }}>
          QUICK ANALYSIS
        </h2>
        <p className="text-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
          Single chart · instant RSI, MA, structure &amp; trade setup
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !preview && !isResizing && fileInputRef.current?.click()}
        className="relative rounded-xl border-2 overflow-hidden transition-all duration-200"
        style={{
          borderStyle: preview ? "solid" : "dashed",
          borderColor: isDragging ? "var(--cm-cyan)" : preview ? "var(--cm-border-strong)" : "var(--cm-border-default)",
          background: isDragging ? "rgba(0,212,255,0.04)" : preview ? "var(--cm-bg-elevated)" : "rgba(108,99,255,0.02)",
          minHeight: preview ? "auto" : "180px",
          cursor: preview ? "default" : "pointer",
          boxShadow: isDragging ? "0 0 24px rgba(0,212,255,0.15), inset 0 0 24px rgba(0,212,255,0.04)" : "none",
        }}
      >
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

        {isResizing ? (
          <div className="flex flex-col items-center justify-center p-10 gap-3">
            <div className="cm-spin w-8 h-8 border-2 rounded-full"
              style={{ borderColor: "var(--cm-border-default)", borderTopColor: "var(--cm-purple)" }} />
            <p className="text-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>Compressing image...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img src={preview} alt="Chart preview" className="w-full object-contain rounded-xl" style={{ maxHeight: "240px" }} />
            <button onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-opacity"
              style={{ background: "rgba(8,8,16,0.85)", color: "var(--cm-text-primary)", border: "1px solid var(--cm-border-default)" }}>
              ✕
            </button>
            {sizeInfo && savings > 0 && (
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                style={{ background: "rgba(8,8,16,0.85)", border: "1px solid var(--cm-border-subtle)" }}>
                <span style={{ color: "var(--cm-bullish)", fontFamily: "var(--cm-font-mono)" }}>↓ {savings}%</span>
                <span style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-mono)" }}>
                  {sizeInfo.originalKB}→{sizeInfo.resizedKB}KB
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 gap-3 select-none">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--cm-purple-dim)", border: "1px solid var(--cm-border-default)" }}>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-sm" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)" }}>
                Drop your chart here
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
                or tap to select · PNG, JPG, WebP
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeframe selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-display)" }}>
          Timeframe
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {TIMEFRAMES.map(({ value, label }) => (
            <button key={value} onClick={() => setSelectedTimeframe(value)}
              className="py-2.5 rounded-xl text-xs font-bold transition-all duration-150"
              style={{
                background: selectedTimeframe === value
                  ? "linear-gradient(135deg, var(--cm-purple), rgba(108,99,255,0.7))"
                  : "var(--cm-bg-elevated)",
                color: selectedTimeframe === value ? "#fff" : "var(--cm-text-secondary)",
                border: `1px solid ${selectedTimeframe === value ? "var(--cm-purple)" : "var(--cm-border-subtle)"}`,
                fontFamily: "var(--cm-font-mono)",
                boxShadow: selectedTimeframe === value ? "0 0 12px var(--cm-purple-glow)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Analyze button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => preview && onAnalyze(preview, selectedTimeframe)}
          disabled={!canAnalyze}
          className="cm-btn-gradient w-full rounded-xl transition-all duration-200"
          style={{ height: "56px", fontSize: "0.8rem", opacity: canAnalyze ? 1 : 0.4, cursor: canAnalyze ? "pointer" : "not-allowed" }}
        >
          ANALYZE CHART →
        </button>

        {preview && !isAnalyzing && (
          <p className="text-center text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>
            {isMockMode
              ? "Demo mode — no API cost"
              : <span>Est. cost: <span style={{ color: "var(--cm-purple)", fontFamily: "var(--cm-font-mono)" }}>~${COST_PER_ANALYSIS.toFixed(3)}</span></span>}
          </p>
        )}
      </div>
    </div>
  );
}
