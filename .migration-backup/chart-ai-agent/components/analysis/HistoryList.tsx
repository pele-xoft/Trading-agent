'use client'

import { useEffect, useState } from 'react'
import type { AnalysisRecord } from '@/types'

interface HistoryListProps {
  onSelect: (record: AnalysisRecord) => void
}

export function HistoryList({ onSelect }: HistoryListProps) {
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/history?pageSize=20')
        const data = await res.json()
        setRecords(data.analyses ?? [])
      } catch {
        setError('Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: '80px' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--bearish)',
        fontSize: '14px',
      }}>
        {error}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '16px',
          marginBottom: '6px',
        }}>
          No analyses yet
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Upload a chart to get started
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {records.map((record, i) => (
        <HistoryItem key={record.id} record={record} index={i} onSelect={onSelect} />
      ))}
    </div>
  )
}

function HistoryItem({
  record,
  index,
  onSelect,
}: {
  record: AnalysisRecord
  index: number
  onSelect: (r: AnalysisRecord) => void
}) {
  const bias = record.result?.marketBias
  const confidence = record.result?.confidence
  const tradeType = record.result?.tradeSetup?.type

  const biasColor = bias === 'bullish' ? 'var(--bullish)'
    : bias === 'bearish' ? 'var(--bearish)'
    : 'var(--neutral)'

  const timeAgo = formatTimeAgo(record.created_at)

  return (
    <button
      onClick={() => onSelect(record)}
      className="animate-fade-up"
      style={{
        display: 'flex',
        gap: '14px',
        alignItems: 'center',
        padding: '14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.15s ease',
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'both',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
    >
      {/* Chart Thumbnail */}
      <div style={{
        width: '52px',
        height: '40px',
        borderRadius: '8px',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'var(--bg-elevated)',
      }}>
        {record.image_url && (
          <img
            src={record.image_url}
            alt="Chart"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '13px',
            color: biasColor,
            textTransform: 'uppercase',
          }}>
            {bias ?? 'pending'}
          </span>
          {record.instrument && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              · {record.instrument}
            </span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'var(--bg-elevated)',
            padding: '1px 6px',
            borderRadius: '4px',
          }}>
            {record.timeframe}
          </span>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {timeAgo}
        </p>
      </div>

      {/* Confidence */}
      {confidence !== undefined && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '16px',
            color: confidence >= 65 ? 'var(--bullish)' : confidence >= 50 ? 'var(--accent)' : 'var(--text-muted)',
          }}>
            {confidence}
          </p>
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CONF
          </p>
        </div>
      )}
    </button>
  )
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = Date.now()
  const diff = now - date.getTime()

  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
