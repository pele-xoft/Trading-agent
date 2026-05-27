'use client'

import { useRef, useState, useCallback } from 'react'
import type { Timeframe, UploadState } from '@/types'

const TIMEFRAMES: { value: Timeframe; label: string; desc: string }[] = [
  { value: '5m',  label: '5m',  desc: 'Scalp' },
  { value: '15m', label: '15m', desc: 'Entry' },
  { value: '1h',  label: '1H',  desc: 'Trend' },
  { value: '4h',  label: '4H',  desc: 'Bias'  },
  { value: '1D',  label: '1D',  desc: 'Macro' },
]

interface UploadComponentProps {
  onAnalysisComplete: (analysisId: string, result: unknown) => void
}

export function UploadComponent({ onAnalysisComplete }: UploadComponentProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>({
    file: null,
    preview: null,
    timeframe: '15m',
    instrument: '',
    isUploading: false,
    uploadError: null,
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setState(s => ({ ...s, uploadError: 'Please upload an image file (JPG, PNG, WebP)' }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setState(s => ({ ...s, uploadError: 'Image must be under 10MB' }))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setState(s => ({
        ...s,
        file,
        preview: e.target?.result as string,
        uploadError: null,
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleAnalyze = async () => {
    if (!state.file || !state.preview) return

    setAnalysisState('analyzing')
    setState(s => ({ ...s, isUploading: true, uploadError: null }))

    try {
      // Extract base64 data
      const base64 = state.preview.split(',')[1]
      const mimeType = state.preview.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/webp'

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          timeframe: state.timeframe,
          instrument: state.instrument || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error ?? 'Analysis failed')
      }

      setAnalysisState('done')
      onAnalysisComplete(data.analysisId, data.result)
    } catch (error) {
      setAnalysisState('error')
      setState(s => ({
        ...s,
        uploadError: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
      }))
    } finally {
      setState(s => ({ ...s, isUploading: false }))
    }
  }

  const reset = () => {
    setState({
      file: null,
      preview: null,
      timeframe: '15m',
      instrument: '',
      isUploading: false,
      uploadError: null,
    })
    setAnalysisState('idle')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Image Drop Zone */}
      <div
        onClick={() => !state.preview && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          border: isDragOver
            ? '2px solid var(--accent)'
            : state.preview
            ? '2px solid var(--border-subtle)'
            : '2px dashed var(--border-default)',
          borderRadius: '16px',
          background: isDragOver ? 'var(--accent-dim)' : 'var(--bg-surface)',
          cursor: state.preview ? 'default' : 'pointer',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          minHeight: state.preview ? 'auto' : '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state.preview ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img
              src={state.preview}
              alt="Chart preview"
              style={{
                width: '100%',
                borderRadius: '14px',
                display: 'block',
                maxHeight: '320px',
                objectFit: 'contain',
                background: '#000',
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); reset() }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                backdropFilter: 'blur(8px)',
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              background: 'var(--accent-dim)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              📊
            </div>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '16px',
              color: 'var(--text-primary)',
              marginBottom: '6px',
            }}>
              Upload Chart Screenshot
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Tap to select or drag & drop
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              JPG · PNG · WebP · Max 10MB
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Timeframe Selector */}
      <div>
        <p className="section-label" style={{ marginBottom: '10px' }}>Timeframe</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setState(s => ({ ...s, timeframe: tf.value }))}
              style={{
                flex: 1,
                padding: '10px 4px',
                border: state.timeframe === tf.value
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border-subtle)',
                borderRadius: '10px',
                background: state.timeframe === tf.value
                  ? 'var(--accent-dim)'
                  : 'var(--bg-surface)',
                color: state.timeframe === tf.value
                  ? 'var(--accent)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '14px',
                lineHeight: 1.2,
              }}>{tf.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{tf.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Instrument (optional) */}
      <div>
        <p className="section-label" style={{ marginBottom: '10px' }}>
          Instrument <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>— optional</span>
        </p>
        <input
          type="text"
          placeholder="e.g. US500, XAUUSD, EURUSD"
          value={state.instrument}
          onChange={(e) => setState(s => ({ ...s, instrument: e.target.value }))}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* Error */}
      {state.uploadError && (
        <div style={{
          padding: '12px 14px',
          background: 'var(--bearish-dim)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '10px',
          color: 'var(--bearish)',
          fontSize: '13px',
        }}>
          {state.uploadError}
        </div>
      )}

      {/* Analyze Button */}
      <button
        className="btn-primary"
        onClick={handleAnalyze}
        disabled={!state.file || state.isUploading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {state.isUploading ? (
          <>
            <span style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid rgba(0,0,0,0.2)',
              borderTop: '2px solid #000',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            Analyzing Chart...
          </>
        ) : (
          <>Analyze Chart →</>
        )}
      </button>
    </div>
  )
}
