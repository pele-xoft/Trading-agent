// ============================================================
// TESTS — Composite Signal Engine
// Run: npm test
// ============================================================

import { describe, it, expect } from 'vitest'
import { computeCompositeSignal } from '@/indicator-engine/composite-signal'
import type { AnalysisResult } from '@/types'

// Mock analysis result factory
function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    marketBias: 'bearish',
    structure: {
      trend: 'downtrend',
      higherHighs: false,
      lowerLows: true,
      keyLevel: 4500,
      description: 'Clear downtrend with lower highs and lower lows',
    },
    indicators: {
      movingAverages: {
        fastAboveSlow: false,
        priceAboveFast: false,
        priceAboveSlow: false,
        crossoverRecent: true,
        crossoverType: 'death',
        description: 'Death cross confirmed, price below both MAs',
      },
      rsi: {
        value: 41.23,
        zone: 'bearish',
        divergence: 'none',
        description: 'RSI below 50, bearish momentum',
      },
      stochastic: {
        kValue: 34.83,
        dValue: 28.5,
        zone: 'neutral',
        crossover: 'none',
        divergence: 'none',
        description: 'Stochastic in neutral territory, K above D',
      },
    },
    supportResistance: {
      nearestSupport: 4500,
      nearestResistance: 4540,
      keyLevels: [4500, 4540, 4580],
      description: 'Key support at 4500',
    },
    momentum: {
      type: 'continuation',
      strength: 'moderate',
      description: 'Bearish momentum continuing',
    },
    tradeSetup: {
      type: 'sell',
      rationale: 'Sell retracements in downtrend',
      entryZone: { low: 4527, high: 4535 },
      stopLoss: 4545,
      stopLossRationale: 'Above 1H MA',
      takeProfits: [
        { level: 4500, label: 'TP1', rationale: 'Session low' },
        { level: 4480, label: 'TP2', rationale: 'Next support' },
        { level: 4453, label: 'TP3', rationale: 'Daily low' },
      ],
      riskRewardRatio: 2.2,
    },
    confidence: 65,
    confidenceFactors: ['Death cross confirmed', 'RSI below 50', 'Lower lows structure'],
    reasoning: 'Clear bearish setup with multiple confirming factors',
    invalidationConditions: ['Close above 4550 on 1H'],
    warnings: [],
    ...overrides,
  }
}

describe('computeCompositeSignal', () => {
  it('returns bearish for classic bearish setup', () => {
    const signal = computeCompositeSignal(makeAnalysis())
    expect(signal.overall).toBe('bearish')
    expect(signal.score).toBeLessThan(0)
  })

  it('returns bullish for classic bullish setup', () => {
    const signal = computeCompositeSignal(makeAnalysis({
      marketBias: 'bullish',
      structure: {
        trend: 'uptrend',
        higherHighs: true,
        lowerLows: false,
        keyLevel: 4580,
        description: 'Uptrend confirmed',
      },
      indicators: {
        movingAverages: {
          fastAboveSlow: true,
          priceAboveFast: true,
          priceAboveSlow: true,
          crossoverRecent: true,
          crossoverType: 'golden',
          description: 'Golden cross, price above both MAs',
        },
        rsi: {
          value: 62,
          zone: 'bullish',
          divergence: 'none',
          description: 'RSI in bullish territory',
        },
        stochastic: {
          kValue: 65,
          dValue: 58,
          zone: 'neutral',
          crossover: 'bullish',
          divergence: 'none',
          description: 'Bullish crossover',
        },
      },
      momentum: { type: 'continuation', strength: 'strong', description: 'Strong bullish momentum' },
    }))

    expect(signal.overall).toBe('bullish')
    expect(signal.score).toBeGreaterThan(0)
  })

  it('confidence is between 0 and 100', () => {
    const signal = computeCompositeSignal(makeAnalysis())
    expect(signal.confidence).toBeGreaterThanOrEqual(0)
    expect(signal.confidence).toBeLessThanOrEqual(100)
  })

  it('returns neutral for mixed signals', () => {
    const signal = computeCompositeSignal(makeAnalysis({
      structure: {
        trend: 'ranging',
        higherHighs: false,
        lowerLows: false,
        keyLevel: null,
        description: 'Ranging market',
      },
      indicators: {
        movingAverages: {
          fastAboveSlow: true,
          priceAboveFast: false,
          priceAboveSlow: true,
          crossoverRecent: false,
          crossoverType: 'none',
          description: 'Mixed MA signals',
        },
        rsi: { value: 50, zone: 'neutral', divergence: 'none', description: 'RSI at midpoint' },
        stochastic: { kValue: 50, dValue: 50, zone: 'neutral', crossover: 'none', divergence: 'none', description: 'Neutral' },
      },
      momentum: { type: 'unclear', strength: 'weak', description: 'Unclear momentum' },
    }))

    expect(signal.overall).toBe('neutral')
  })

  it('all individual signals are present', () => {
    const signal = computeCompositeSignal(makeAnalysis())
    expect(signal.signals).toHaveProperty('trend')
    expect(signal.signals).toHaveProperty('rsi')
    expect(signal.signals).toHaveProperty('stochastic')
    expect(signal.signals).toHaveProperty('structure')
  })
})
