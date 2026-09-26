import BN from 'bn.js'
import { Connection } from '@solana/web3.js'
import {
  DynamicBondingCurveClient,
  SwapMode,
  buildCurve,
} from '@meteora-ag/dynamic-bonding-curve-sdk'
import type { BuildCurveParams } from '@meteora-ag/dynamic-bonding-curve-sdk'

export interface CurvePoint {
  quoteIn: number
  baseOut: number
  marginalPrice: number
  avgPrice: number
  fdv: number
  pctToMigration: number
}

export interface SimulationResult {
  points: CurvePoint[]
  migrationQuoteThreshold: number
  supplyOnCurve: number
  totalSupply: number
  fdvAtStart: number
  fdvAtMigration: number
  avgPriceAtMigration: number
  priceMultiple: number
  effectiveFeeBps: number
}

const toNumber = (bn: BN, decimals: number): number =>
  Number(bn.toString()) / 10 ** decimals

export function simulateCurve(params: BuildCurveParams, steps = 60): SimulationResult {
  const connection = new Connection('http://localhost:8899')
  const client = new DynamicBondingCurveClient(connection as never, 'confirmed' as never)

  const config = buildCurve(params)

  const quoteDecimals = params.token.tokenQuoteDecimal
  const baseDecimals = Number(params.token.tokenBaseDecimal)
  const threshold = params.migrationQuoteThreshold

  const swapConfig = {
    poolFees: config.poolFees,
    collectFeeMode: config.collectFeeMode,
    sqrtStartPrice: config.sqrtStartPrice,
    migrationQuoteThreshold: config.migrationQuoteThreshold,
    curve: config.curve,
  }

  const points: CurvePoint[] = []
  let firstMarginal: number | null = null
  let totalExcluded = 0

  for (let i = 1; i <= steps; i++) {
    const x = (threshold * i) / steps
    const amountIn = new BN(Math.floor(x * 10 ** quoteDecimals))
    const quote = client.pool.getQuoteFromInputAmount({
      config: swapConfig,
      swapBaseForQuote: false,
      amountIn,
      swapMode: SwapMode.PartialFill,
    })

    const cumQuote = toNumber(quote.includedFeeInputAmount, quoteDecimals)
    const cumBase = toNumber(quote.outputAmount, baseDecimals)
    const cumExcluded = toNumber(quote.excludedFeeInputAmount, quoteDecimals)
    totalExcluded = cumExcluded
    if (cumBase <= 0) continue

    const prev = points[points.length - 1]
    const dQ = cumQuote - (prev?.quoteIn ?? 0)
    const dB = cumBase - (prev?.baseOut ?? 0)
    const marginal = dB > 0 ? dQ / dB : prev?.marginalPrice ?? 0
    if (firstMarginal === null) firstMarginal = marginal

    points.push({
      quoteIn: cumQuote,
      baseOut: cumBase,
      marginalPrice: marginal,
      avgPrice: cumQuote / cumBase,
      fdv: marginal * params.token.totalTokenSupply,
      pctToMigration: Math.min(cumQuote / threshold, 1),
    })

    if (quote.amountLeft && !quote.amountLeft.isZero()) break
  }

  const last = points[points.length - 1]
  const fdvAtStart = (firstMarginal ?? 0) * params.token.totalTokenSupply
  const effectiveFeeBps = last && last.quoteIn > 0
    ? (1 - totalExcluded / last.quoteIn) * 10_000
    : 0

  return {
    points,
    migrationQuoteThreshold: threshold,
    supplyOnCurve: last?.baseOut ?? 0,
    totalSupply: params.token.totalTokenSupply,
    fdvAtStart,
    fdvAtMigration: last?.fdv ?? 0,
    avgPriceAtMigration: last?.avgPrice ?? 0,
    priceMultiple: last && firstMarginal ? last.marginalPrice / firstMarginal : 0,
    effectiveFeeBps,
  }
}
