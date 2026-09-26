# CurveLab

**Launch-config studio for Meteora's Dynamic Bonding Curve (DBC).** Simulate, compare and deploy DBC launch configs with full visibility into price discovery, fees, graduation economics and LP distribution — before spending a single lamport.

Built for the **Meteora sidetrack** of the Colosseum Crypto World's Fair hackathon (Superteam Earn).

## Why

Every DBC token launch picks a curve shape, fee schedule, migration threshold and LP split. These choices decide who gets rekt: snipers or founders, early believers or late FOMO. Today most launchpads copy the same default config because the trade-offs are invisible. CurveLab makes them visible.

- **Presets as products**: six curated, opinionated configs (meme fair launch, tokenized stock pair, long-curve RWA, exponential hype, vested builder launch, devnet toy) — each with a written rationale.
- **Exact simulation**: curves are computed with the official `@meteora-ag/dynamic-bonding-curve-sdk` quoting engine (`buildCurve` + `getQuoteFromInputAmount`), so the simulation is what the on-chain program will actually do — not an approximation.
- **One-command devnet deploy**: launch any preset on devnet and watch the full lifecycle (launch → trade → graduate → migrate to DAMM v2).

## Live dashboard

**https://paulcrossland-assistant.github.io/curvelab/** — preset comparison, simulated FDV curves, graduation metrics, full `buildCurve()` parameters for every preset.

## Presets

| Preset | Shape | Use case |
|---|---|---|
| `meme-fair` | 500→100 bps decay, 10 SOL threshold, 50% LP locked | Community memecoin with sniper tax and rug resistance |
| `devnet-toy` | Same shape, 1 SOL threshold | Full-lifecycle rehearsal on airdrop budgets |
| `stock-pair` | 25 bps floor, 200 SOL threshold, 15% on curve | xStocks/RWA equity with reference pricing |
| `long-tail-rwa` | 5% on curve, 500 SOL long curve | Illiquid real-world assets, month-long discovery |
| `exp-hype` | 12% cheap supply then steep ramp, 750→200 bps | Viral launches; late FOMO pays for the treasury |
| `builder-vested` | 2% supply cliff-vested, 60% LP locked | Founders proving commitment on-chain |

## Usage

```bash
npm install

# regenerate the dashboard data (runs the simulator over all presets)
npx tsx src/gen-dashboard-data.ts

# serve the dashboard locally
cd docs && python3 -m http.server 8000

# launch a preset on devnet (needs a funded devnet keypair at ./keypair.json)
npx tsx src/launch/devnet.ts --preset devnet-toy
```

## How the simulation works

`src/sim/simulate.ts` builds the exact on-chain config with `buildCurve(params)`, then
walks the curve with cumulative `client.pool.getQuoteFromInputAmount` calls (`PartialFill`,
quote→base) from the launch state. Marginal price is the finite difference between
consecutive cumulative quotes; FDV is marginal price × total supply. The quote engine is
the same code path the program uses, including the fee scheduler's cliff fee.

## Devnet proof

Full lifecycle executed on Solana devnet with the `devnet-toy` preset:

- Token: **CLAB** (`3xwRKHfWAGnXyRy91QW1gymgt2of8kA2cUzwWxyNviNT`)
- DBC config: `FhCHhGgUwy3vspgkb9ppyqzqoxwCnf76KLnYENcoSvpK`
- DBC pool: `95NsmiqLb3WVMyPLosbhDCggMKTvBjqgKZZufGR6ekkw` (graduated 100.00%)
- DAMM v2 pool (post-migration): `8ug4RWCa6ciS2VGbUHYbUP4NjRrP2RuHYno8sLF5h9zQ`
- Every transaction is linked on the [live dashboard](https://paulcrossland-assistant.github.io/curvelab/) (Solana Explorer, devnet).

Notable finding while building: a launch cannot be graduated with ExactIn buys once the remaining curve capacity is below the minimum fee-adjusted input — the final graduation needs a `PartialFill` swap (`src/launch/partial-buy.ts`). This edge case is now part of the simulator output.

## Roadmap

- [x] Off-chain curve simulation (exact, SDK-backed)
- [x] Six opinionated presets with rationale
- [x] Static dashboard (zero-dependency, canvas)
- [x] One-command devnet launch + full lifecycle incl. DAMM v2 migration (devnet proof above)
- [ ] Preset marketplace: publish a config on-chain, let other builders pay-to-use it
- [ ] DAMM v2 post-migration fee-schedule designer (`migratedPoolFee` market-cap scheduler)

## License

MIT
