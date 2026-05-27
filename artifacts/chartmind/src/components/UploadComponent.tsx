import { useCallback, useRef, useState } from "react";
import type { Timeframe } from "../types";

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1D", label: "1D" },
];

const MAX_PX = 1024;
const JPEG_QUALITY = 0.82;

function resizeImage(dataUrl: string): Promise<{ dataUrl: string; originalKB: number; resizedKB: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const originalKB = Math.round(dataUrl.length * 0.75 / 1024);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = w > h ? MAX_PX / w : MAX_PX / h;
      const newW = scale < 1 ? Math.round(w * scale) : w;
      const newH = scale < 1 ? Math.round(h * scale) : h;

      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, newW, newH);

      const resized = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const resizedKB = Math.round(resized.length * 0.75 / 1024);
      resolve({ dataUrl: resized, originalKB, resizedKB });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

interface UploadComponentProps {
  onAnalyze: (imageDataUrl: string, timeframe: Timeframe) => void;
  isAnalyzing: boolean;
}

export function UploadComponent({ onAnalyze, isAnalyzing }: UploadComponentProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h");
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeInfo, setSizeInfo] = useState<{ originalKB: number; resizedKB: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    setIsResizing(true);
    setSizeInfo(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target?.result as string;
      try {
        const { dataUrl, originalKB, resizedKB } = await resizeImage(raw);
        setPreview(dataUrl);
        setSizeInfo({ originalKB, resizedKB });
      } catch {
        setPreview(raw);
      } finally {
        setIsResizing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = () => {
    if (!preview) return;
    onAnalyze(preview, selectedTimeframe);
  };

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    setSizeInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const savings = sizeInfo ? Math.round((1 - sizeInfo.resizedKB / sizeInfo.originalKB) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !preview && !isResizing && fileInputRef.current?.click()}
        className="relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer"
        style={{
          borderColor: isDragging ? "var(--cm-accent)" : "hsl(var(--border))",
          backgroundColor: isDragging ? "var(--cm-accent-dim)" : "hsl(var(--card))",
          minHeight: preview ? "auto" : "180px",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {isResizing ? (
          <div className="flex flex-col items-center justify-center p-8 gap-3 select-none" style={{ minHeight: "180px" }}>
            <div className="cm-spin w-7 h-7 border-2 rounded-full"
              style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Optimising image...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Chart preview"
              className="w-full object-contain rounded-xl"
              style={{ maxHeight: "260px" }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(0,0,0,0.7)", color: "hsl(var(--foreground))" }}
            >
              ✕
            </button>
            {sizeInfo && savings > 0 && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                style={{ background: "rgba(0,0,0,0.75)", color: "var(--cm-bullish)" }}>
                <span>↓ {savings}% smaller</span>
                <span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.7 }}>
                  {sizeInfo.originalKB}KB → {sizeInfo.resizedKB}KB
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 gap-3 select-none">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "var(--cm-accent-dim)" }}>
              📈
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>
                Drop your chart here
              </p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                or tap to select • PNG, JPG, WebP
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeframe selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "hsl(var(--muted-foreground))" }}>
          Timeframe
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {TIMEFRAMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedTimeframe(value)}
              className="py-2 rounded-lg text-sm font-bold transition-all duration-150"
              style={{
                background: selectedTimeframe === value ? "var(--cm-accent)" : "hsl(var(--card))",
                color: selectedTimeframe === value ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                border: `1px solid ${selectedTimeframe === value ? "var(--cm-accent)" : "hsl(var(--border))"}`,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!preview || isAnalyzing || isResizing}
        className="relative w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 overflow-hidden"
        style={{
          background: !preview || isAnalyzing || isResizing
            ? "hsl(var(--muted))"
            : "var(--cm-accent)",
          color: !preview || isAnalyzing || isResizing
            ? "hsl(var(--muted-foreground))"
            : "#0a0a0f",
          cursor: !preview || isAnalyzing || isResizing ? "not-allowed" : "pointer",
          opacity: !preview ? 0.5 : 1,
        }}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="cm-spin inline-block w-4 h-4 border-2 rounded-full"
              style={{ borderColor: "hsl(var(--muted-foreground))", borderTopColor: "transparent" }} />
            Analyzing chart...
          </span>
        ) : (
          "Analyze Chart"
        )}
      </button>
    </div>
  );
}
