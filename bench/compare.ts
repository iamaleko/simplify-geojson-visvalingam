import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { compareReports, type Report } from './report'

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: { out: { type: 'string' } } })
  if (positionals.length !== 2)
    throw new Error('Usage: npm run bench:compare -- baseline.json candidate.json [--out comparison.json]')
  const [baseline, candidate] = await Promise.all(
    positionals.map(async (path) => JSON.parse(await readFile(path, 'utf8')) as Report),
  )
  const comparison = compareReports(baseline, candidate)
  const unit = baseline.mode === 'time' ? 'ms' : 'KiB'
  console.table(
    comparison.map((row) => ({
      scenario: row.scenario,
      [`baseline ${unit}`]: row.before.toFixed(3),
      [`candidate ${unit}`]: row.after.toFixed(3),
      'change %': row.changePercent.toFixed(2),
    })),
  )
  console.log('Negative change = improvement. Each value is the median across independent process repeats.')
  if (values.out) {
    const path = resolve(values.out)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(
      path,
      JSON.stringify(
        { baseline: baseline.target, candidate: candidate.target, mode: baseline.mode, comparison },
        null,
        2,
      ) + '\n',
    )
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
