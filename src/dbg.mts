import { Connection, PublicKey } from '@solana/web3.js'
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk'
const c = new Connection('http://localhost:8899','confirmed')
const client = new DynamicBondingCurveClient(c,'confirmed')
const mint = new PublicKey('AoaDDezLqgniMF6ZyH2qm3degtVaxLdRsedByAxYx3pQ')
const pa = await client.state.getPoolByBaseMint(mint)
console.log('pool obj keys:', Object.keys(pa)); console.log('pool:', pa.publicKey.toBase58())
const pool = await client.state.getPool(pa.publicKey)
const p = pool.poolState
console.log('quoteReserve:', p.quoteReserve?.toString(), 'sqrtPrice:', p.sqrtPrice?.toString(), 'isMigrated:', p.isMigrated)
const cfg = await client.state.getPoolConfig(p.config)
console.log('threshold:', cfg.migrationQuoteThreshold?.toString())
console.log('curve segments:', cfg.curve?.length)
