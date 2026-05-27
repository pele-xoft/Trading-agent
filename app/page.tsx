'use client'

import { useState } from 'react'
import { UploadComponent } from '@/components/chart/UploadComponent'
import { AnalysisCard } from '@/components/analysis/AnalysisCard'
import { HistoryList } from '@/components/analysis/HistoryList'
import type { AnalysisResult, AnalysisRecord } from '@/types'

type Tab = 'analyze' | 'history'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('analyze')
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    analysisId: string
    result: AnalysisResult
    timeframe: string
    instrument?: string
  } | null>(null)

  function handleAnalysisComplete(analysisId: string, result: unknown) {
    setCurrentAnalysis({
      analysisId,
      result: result as AnalysisResult,
      timeframe: '—',
    })
  }

  function handleHistorySelect(record: AnalysisRecord) {
    if (record.result) {
      setCurrentAnalysis({
        analysisId: record.id,
        result: record.result,
        timeframe: record.timeframe,
        instrument: record.instrument ?? undefined,
      })
      setActiveTab('analyze')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
    }}>

      {/* Header */}
      <header style={{
        padding: '20px 20px 0',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-base)',
        zIndex: 10,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '22px',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}>
              Chart<span style={{ color: 'var(--accent)' }}>Mind</span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              marginTop: '3px',
            }}>
              AI · TECHNICAL ANALYSIS
            </p>
          </div>

          {/* Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '999px',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--bullish)',
              boxShadow: '0 0 6px var(--bullish)',
            }} />
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              Live
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          padding: '4px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          marginBottom: '1px',
        }}>
          {(['analyze', 'history'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px',
                border: 'none',
                borderRadius: '9px',
                background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '0.02em',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'analyze' ? '◈ Analyze' : '◉ History'}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '16px 20px 100px' }}>
        {activeTab === 'analyze' && (
          <div>
            {!currentAnalysis ? (
              <UploadComponent onAnalysisComplete={handleAnalysisComplete} />
            ) : (
              <div>
                {/* Back + new analysis */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}>
                  <button
                    onClick={() => setCurrentAnalysis(null)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ← New Analysis
                  </button>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}>
                    ID: {currentAnalysis.analysisId.slice(0, 8)}
                  </span>
                </div>

                <AnalysisCard
                  result={currentAnalysis.result}
                  timeframe={currentAnalysis.timeframe}
                  instrument={currentAnalysis.instrument}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '16px',
              }}>
                Analysis History
              </h2>
            </div>
            <HistoryList onSelect={handleHistorySelect} />
          </div>
        )}
      </main>

      {/* Bottom safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  )
}
