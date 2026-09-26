import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js'
import { Wallet } from '@coral-xyz/anchor'
import { DynamicBondingCurveClient, SwapMode } from '@meteora-ag/dynamic-bonding-curve-sdk'
import BN from 'bn.js'
import fs from 'fs'

const RPC = 'https://api.devnet.solana.com'
const BASE_MINT = new PublicKey('3xwRKHfWAGnXyRy91QW1gymgt2of8kA2cUzwWxyNviNT')

async function main() {
  const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))))
  const amountSol = Number(process.argv[3] ?? '0.001')
  const connection = new Connection(RPC, 'confirmed')
  const client = new DynamicBondingCurveClient(connection, 'confirmed')
  const wallet = new Wallet(keypair)

  const poolAddress = (await client.state.getPoolByBaseMint(BASE_MINT)).publicKey
    const tx = await client.pool.swap2({
    owner: keypair.publicKey,
    pool: poolAddress,
    amountIn: new BN(Math.floor(amountSol * 1e9)),
    minimumAmountOut: new BN(0),
    swapBaseForQuote: false,
    swapMode: SwapMode.PartialFill,
    referralTokenAccount: null,
  })
  tx.feePayer = keypair.publicKey
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  const sig = await sendAndConfirmTransaction(connection, tx, [keypair])
  console.log('swap sig:', sig)
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
