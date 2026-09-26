import {
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  MigrationOption,
  TokenDecimal,
  TokenType,
} from '@meteora-ag/dynamic-bonding-curve-sdk'
import type { BuildCurveParams } from '@meteora-ag/dynamic-bonding-curve-sdk'

export interface Preset {
  id: string
  name: string
  tagline: string
  useCase: string
  rationale: string[]
  params: BuildCurveParams
}

const baseToken = (over: Partial<BuildCurveParams['token']> = {}): BuildCurveParams['token'] => ({
  tokenType: TokenType.SPLToken,
  tokenBaseDecimal: TokenDecimal.SIX,
  tokenQuoteDecimal: TokenDecimal.NINE,
  tokenAuthorityOption: 1,
  totalTokenSupply: 1_000_000_000,
  leftover: 0,
  ...over,
})

const baseFee = (startingFeeBps: number, endingFeeBps: number, numberOfPeriod: number, totalDuration: number): BuildCurveParams['fee'] => ({
  baseFeeParams: {
    baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
    feeSchedulerParam: { startingFeeBps, endingFeeBps, numberOfPeriod, totalDuration },
  },
  dynamicFeeEnabled: true,
  collectFeeMode: CollectFeeMode.QuoteToken,
  creatorTradingFeePercentage: 50,
  poolCreationFee: 0,
  enableFirstSwapWithMinFee: false,
})

const migration = (over: Partial<BuildCurveParams['migration']> = {}): BuildCurveParams['migration'] => ({
  migrationOption: MigrationOption.MET_DAMM_V2,
  migrationFeeOption: 3,
  migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
  ...over,
})

const split = (
  partnerLiquidityPercentage: number,
  partnerPermanentLockedLiquidityPercentage: number,
  creatorLiquidityPercentage: number,
  creatorPermanentLockedLiquidityPercentage: number,
): BuildCurveParams['liquidityDistribution'] => ({
  partnerLiquidityPercentage,
  partnerPermanentLockedLiquidityPercentage,
  creatorLiquidityPercentage,
  creatorPermanentLockedLiquidityPercentage,
})

const noVesting = (): BuildCurveParams['lockedVesting'] => ({
  totalLockedVestingAmount: 0,
  numberOfVestingPeriod: 0,
  cliffUnlockAmount: 0,
  totalVestingDuration: 0,
  cliffDurationFromMigrationTime: 0,
})

export const presets: Preset[] = [
  {
    id: 'meme-fair',
    name: 'Meme Fair Launch',
    tagline: 'The sane default for a community memecoin',
    useCase: 'Permissionless meme/community token where early snipers must be taxed and post-graduation LP must be rug-resistant.',
    rationale: [
      '500→100 bps linear fee decay over the first hour prices out bot sniping without punishing organic buyers.',
      '10 SOL migration threshold keeps graduation achievable on a small community push.',
      '50% of LP permanently locked kills the classic migrate-and-dump rug vector.',
    ],
    params: {
      token: baseToken(),
      fee: baseFee(500, 100, 12, 3600),
      migration: migration(),
      liquidityDistribution: split(25, 25, 25, 25),
      lockedVesting: noVesting(),
      activationType: ActivationType.Timestamp,
      percentageSupplyOnMigration: 20,
      migrationQuoteThreshold: 10,
    },
  },
  {
    id: 'devnet-toy',
    name: 'Devnet Toy Launch',
    tagline: 'Tiny thresholds for end-to-end rehearsals',
    useCase: 'Devnet/localnet rehearsal of the full lifecycle: launch → trade → graduate → migrate, on airdrop-sized budgets.',
    rationale: [
      '1 SOL threshold graduates inside a single devnet airdrop, so the whole lifecycle is testable without capital.',
      'Same shape as meme-fair so rehearsal results transfer to production configs.',
    ],
    params: {
      token: baseToken(),
      fee: baseFee(250, 100, 10, 1800),
      migration: migration(),
      liquidityDistribution: split(25, 25, 25, 25),
      lockedVesting: noVesting(),
      activationType: ActivationType.Timestamp,
      percentageSupplyOnMigration: 20,
      migrationQuoteThreshold: 1,
    },
  },
  {
    id: 'stock-pair',
    name: 'Tokenized Stock Pair',
    tagline: 'Patient price discovery for thinly traded equities',
    useCase: 'xStocks/RWA-style equity token where reference pricing exists off-chain and the curve should track, not hype.',
    rationale: [
      'Low, flat fee (25 bps floor) — arbitrary fee drag breaks arbitrage against the reference market.',
      'High migration threshold (200 SOL) — equity buyers arrive slowly; premature graduation strands the price discovery phase.',
      'Only 15% of supply on curve; the rest can be distributed to market makers post-migration.',
    ],
    params: {
      token: baseToken({ totalTokenSupply: 100_000_000 }),
      fee: baseFee(100, 25, 24, 86400),
      migration: migration(),
      liquidityDistribution: split(40, 0, 40, 20),
      lockedVesting: noVesting(),
      activationType: ActivationType.Timestamp,
      percentageSupplyOnMigration: 15,
      migrationQuoteThreshold: 200,
    },
  },
  {
    id: 'long-tail-rwa',
    name: 'Long-Curve RWA',
    tagline: 'Wide, slow curve for illiquid real-world assets',
    useCase: 'Tokenized real estate, carbon credits, invoices — assets with no price history and multi-month discovery horizons.',
    rationale: [
      'A 5%-of-supply, 500 SOL long curve means each buy moves the price gently — wide price exploration with bounded slippage.',
      'Day-scale fee decay rewards genuinely early conviction without locking the door behind them.',
      'Creator LP vesting is left to a companion lock; the curve itself stays simple.',
    ],
    params: {
      token: baseToken({ totalTokenSupply: 10_000_000 }),
      fee: baseFee(200, 50, 30, 86400 * 7),
      migration: migration(),
      liquidityDistribution: split(30, 20, 30, 20),
      lockedVesting: noVesting(),
      activationType: ActivationType.Timestamp,
      percentageSupplyOnMigration: 5,
      migrationQuoteThreshold: 500,
    },
  },
  {
    id: 'exp-hype',
    name: 'Exponential Hype',
    tagline: 'Steep back-end for viral launches',
    useCase: 'Launch expected to go viral: early supply is cheap, late demand pays exponentially — maximizing treasury at migration.',
    rationale: [
      'Two-segment structure (here: 12% cheap supply then a steep ramp) concentrates price impact on late FOMO, not early community.',
      '750→200 bps fee decay front-loads sniper tax into the first minutes when MEV is worst.',
      'Threshold 50 SOL: meaningful treasury, still reachable mid-hype.',
    ],
    params: {
      token: baseToken(),
      fee: baseFee(750, 200, 6, 900),
      migration: migration(),
      liquidityDistribution: split(20, 30, 20, 30),
      lockedVesting: noVesting(),
      activationType: ActivationType.Timestamp,
      percentageSupplyOnMigration: 12,
      migrationQuoteThreshold: 50,
    },
  },
  {
    id: 'builder-vested',
    name: 'Builder Vested Launch',
    tagline: 'For founders who want to prove they are staying',
    useCase: 'Solo builder / small team token where the market needs credible commitment: locked vesting + heavy LP lock.',
    rationale: [
      '2% of supply cliff-vests to the team over 6 months — visible on-chain commitment, not a pinky promise.',
      '60% of LP permanently locked — the migration cannot be an exit.',
      'Gentle 300→50 bps decay: buyers are investing in the builder, fees should not be the product.',
    ],
    params: {
      token: baseToken(),
      fee: baseFee(300, 50, 18, 7200),
      migration: migration(),
      liquidityDistribution: split(20, 30, 20, 30),
      lockedVesting: {
        totalLockedVestingAmount: 20_000_000,
        numberOfVestingPeriod: 6,
        cliffUnlockAmount: 0,
        totalVestingDuration: 86400 * 180,
        cliffDurationFromMigrationTime: 86400 * 30,
      },
      activationType: ActivationType.Timestamp,
      percentageSupplyOnMigration: 18,
      migrationQuoteThreshold: 25,
    },
  },
]

export const getPreset = (id: string): Preset => {
  const p = presets.find((p) => p.id === id)
  if (!p) throw new Error(`unknown preset: ${id}`)
  return p
}
