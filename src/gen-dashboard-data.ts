import { writeFileSync, mkdirSync } from 'fs'
import { presets } from './presets/index.js'
import { simulateCurve } from './sim/simulate.js'

const out = presets.map((p) => {
  const r = simulateCurve(p.params, 80)
  return {
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    useCase: p.useCase,
    rationale: p.rationale,
    params: p.params,
    result: {
      migrationQuoteThreshold: r.migrationQuoteThreshold,
      supplyOnCurve: r.supplyOnCurve,
      totalSupply: r.totalSupply,
      fdvAtStart: r.fdvAtStart,
      fdvAtMigration: r.fdvAtMigration,
      avgPriceAtMigration: r.avgPriceAtMigration,
      priceMultiple: r.priceMultiple,
      effectiveFeeBps: r.effectiveFeeBps,
      points: r.points,
    },
  }
})

mkdirSync('docs', { recursive: true })
writeFileSync('docs/data.json', JSON.stringify({ generatedAt: new Date().toISOString(), presets: out }, null, 1))
console.log(`docs/data.json written (${out.length} presets)`)
