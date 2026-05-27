'use client'

import type { AnalysisResult, MarketBias, TradeType } from '@/types'

interface AnalysisCardProps {
  result: AnalysisResult
  timeframe: string
  instrument?: string
  analyzedAt?: string
}

export function AnalysisCard({ result, timeframe, instrument, analyzedAt }: AnalysisCardProps) {
  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header: Bias + Confidence */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <p className="section-label" style={{ marginBottom: '6px' }}>Market Bias</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BiasPill bias={result.marketBias} />
              {instrument && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}>
                  {instrument} · {timeframe}
                </span>
              )}
            </div>
          </div>
          <ConfidenceRing confidence={result.confidence} />
        </div>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          {result.reasoning}
        </p>
      </div>

      {/* Trade Setup */}
      <TradeSetupCard setup={result.tradeSetup} bias={result.marketBias} />

      {/* Indicators Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <IndicatorCard
          label="RSI"
          value={result.indicators.rsi.value.toFixed(1)}
          zone={result.indicators.rsi.zone}
          desc={result.indicators.rsi.description}
        />
        <IndicatorCard
          label="Stochastic"
          value={`${result.indicators.stochastic.kValue.toFixed(0)}/${result.indicators.stochastic.dValue.toFixed(0)}`}
          zone={result.indicators.stochastic.zone}
          desc={result.indicators.stochastic.description}
        />
      </div>

      {/* MA Structure */}
      <MACard ma={result.indicators.movingAverages} />

      {/* Structure */}
      <div className="card" style={{ padding: '16px' }}>
        <p className="section-label" style={{ marginBottom: '10px' }}>Market Structure</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Tag label={result.structure.trend} />
          {result.structure.higherHighs && <Tag label="Higher Highs" color="bullish" />}
          {result.structure.lowerLows && <Tag label="Lower Lows" color="bearish" />}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {result.structure.description}
        </p>
      </div>

      {/* Invalidation */}
      {result.invalidationConditions.length > 0 && (
        <div className="card" style={{
          padding: '16px',
          borderColor: 'rgba(239, 68, 68, 0.15)',
        }}>
          <p className="section-label" style={{ marginBottom: '10px', color: 'var(--bearish)' }}>
            Invalidation Conditions
          </p>
          {result.invalidationConditions.map((c, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '8px',
              padding: '6px 0',
              borderBottom: i < result.invalidationConditions.length - 1
                ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <span style={{ color: 'var(--bearish)', fontSize: '12px', marginTop: '2px' }}>✕</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="card" style={{
          padding: '16px',
          borderColor: 'rgba(245, 158, 11, 0.15)',
        }}>
          <p className="section-label" style={{ marginBottom: '10px', color: 'var(--wait)' }}>
            Warnings
          </p>
          {result.warnings.map((w, i) => (
            <p key={i} style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              padding: '4px 0',
            }}>
              ⚠ {w}
            </p>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        padding: '0 16px 8px',
        lineHeight: 1.6,
      }}>
        This analysis is for informational purposes only.
        Not financial advice. Past setups do not guarantee future results.
      </p>
    </div>
  )
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function BiasPill({ bias }: { bias: MarketBias }) {
  return (
    <span className={`pill-${bias}`} style={{ fontSize: '13px', padding: '4px 12px' }}>
      {bias === 'bullish' ? '▲ Bullish' : bias === 'bearish' ? '▼ Bearish' : '◆ Neutral'}
    </span>
  )
}

function ConfidenceRing({ confidence }: { confidence: number }) {
  const color = confidence >= 70 ? 'var(--bullish)' : confidence >= 50 ? 'var(--accent)' : 'var(--bearish)'
  const circumference = 2 * Math.PI * 20
  const dashOffset = circumference - (confidence / 100) * circumference

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="20" fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
        <circle
          cx="26" cy="26" r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="26" y="30" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
          {confidence}
        </text>
      </svg>
      <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '-2px', fontFamily: 'var(--font-mono)' }}>
        CONF
      </p>
    </div>
  )
}

function TradeSetupCard({ setup, bias }: { setup: AnalysisResult['tradeSetup']; bias: MarketBias }) {
  const isBuy = setup.type === 'buy'
  const isWait = setup.type === 'wait'

  const accentColor = isWait
    ? 'var(--wait)'
    : isBuy ? 'var(--bullish)' : 'var(--bearish)'

  return (
    <div className="card" style={{
      padding: '20px',
      borderColor: isWait ? 'rgba(245, 158, 11, 0.2)' : isBuy ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p className="section-label">Trade Setup</p>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '14px',
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {isWait ? '⏸ Wait' : isBuy ? '▲ Buy' : '▼ Sell'}
        </span>
      </div>

      {!isWait && (
        <>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            {setup.rationale}
          </p>

          {/* Price levels grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <LevelBox
              label="Entry Zone"
              value={`${setup.entryZone.low} – ${setup.entryZone.high}`}
              color="var(--accent)"
            />
            <LevelBox
              label="Stop Loss"
              value={setup.stopLoss.toString()}
              color="var(--bearish)"
              note={setup.stopLossRationale}
            />
          </div>

          {/* Take Profits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {setup.takeProfits.map((tp) => (
              <div key={tp.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {tp.label}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--bullish)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {tp.level}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '120px', textAlign: 'right' }}>
                  {tp.rationale}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: setup.riskRewardRatio >= 2 ? 'var(--bullish)' : setup.riskRewardRatio >= 1.5 ? 'var(--accent)' : 'var(--bearish)',
            }}>
              R:R {setup.riskRewardRatio.toFixed(1)}:1
            </span>
          </div>
        </>
      )}

      {isWait && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {setup.rationale}
        </p>
      )}
    </div>
  )
}

function LevelBox({ label, value, color, note }: {
  label: string; value: string; color: string; note?: string
}) {
  return (
    <div style={{
      padding: '12px',
      background: 'var(--bg-elevated)',
      borderRadius: '10px',
      borderLeft: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color }}>
        {value}
      </p>
      {note && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
          {note}
        </p>
      )}
    </div>
  )
}

function IndicatorCard({ label, value, zone, desc }: {
  label: string; value: string; zone: string; desc: string
}) {
  const zoneColor = zone === 'overbought' ? 'var(--bearish)'
    : zone === 'oversold' ? 'var(--bullish)'
    : zone === 'bullish' ? 'var(--bullish)'
    : zone === 'bearish' ? 'var(--bearish)'
    : 'var(--text-secondary)'

  return (
    <div className="card" style={{ padding: '14px' }}>
      <p className="section-label" style={{ marginBottom: '6px' }}>{label}</p>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '22px',
        color: zoneColor,
        marginBottom: '4px',
      }}>
        {value}
      </p>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
        {zone.replace('_', ' ')}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
        {desc}
      </p>
    </div>
  )
}

function MACard({ ma }: { ma: AnalysisResult['indicators']['movingAverages'] }) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <p className="section-label" style={{ marginBottom: '10px' }}>Moving Averages</p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <Tag
          label={ma.fastAboveSlow ? 'Fast > Slow' : 'Fast < Slow'}
          color={ma.fastAboveSlow ? 'bullish' : 'bearish'}
        />
        <Tag
          label={ma.priceAboveFast ? 'Price > Fast MA' : 'Price < Fast MA'}
          color={ma.priceAboveFast ? 'bullish' : 'bearish'}
        />
        {ma.crossoverType !== 'none' && (
          <Tag
            label={ma.crossoverType === 'golden' ? '✦ Golden Cross' : '✦ Death Cross'}
            color={ma.crossoverType === 'golden' ? 'bullish' : 'bearish'}
          />
        )}
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {ma.description}
      </p>
    </div>
  )
}

function Tag({ label, color }: { label: string; color?: 'bullish' | 'bearish' | string }) {
  const bg = color === 'bullish' ? 'var(--bullish-dim)'
    : color === 'bearish' ? 'var(--bearish-dim)'
    : 'var(--bg-elevated)'
  const fg = color === 'bullish' ? 'var(--bullish)'
    : color === 'bearish' ? 'var(--bearish)'
    : 'var(--text-secondary)'

  return (
    <span style={{
      background: bg,
      color: fg,
      fontSize: '11px',
      padding: '3px 8px',
      borderRadius: '6px',
      fontFamily: 'var(--font-mono)',
    }}>
      {label}
    </span>
  )
}
