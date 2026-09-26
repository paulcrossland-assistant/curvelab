import { Connection, PublicKey } from '@solana/web3.js'
import { CpAmm } from '@meteora-ag/cp-amm-sdk'
const c = new Connection('https://api.devnet.solana.com','confirmed')
const cpAmm = new CpAmm(c)
const mint = new PublicKey('3xwRKHfWAGnXyRy91QW1gymgt2of8kA2cUzwWxyNviNT')
const pools = await cpAmm.fetchPoolStatesByTokenMint(mint)
for (const p of pools) console.log('DAMM v2 pool:', p.publicKey.toBase58())
