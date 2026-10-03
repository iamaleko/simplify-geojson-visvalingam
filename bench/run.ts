import { execFile, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { cpus } from 'node:os'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { promisify, parseArgs } from 'node:util'
import { generatorVersion } from './generators'
import { compareReports, median, type Measurement, type Report } from './report'
import { scenarios } from './scenarios'

function git(directory: string, args: string[]): string | null {
  try {
    return execFileSync('git', ['-C', directory, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function numberOption(value: string, name: string, minimum: number, integer = false): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < minimum || (integer && !Number.isSafeInteger(n))) {
    throw new Error(`--${name} must be ${integer ? 'an integer' : 'a number'} >= ${minimum}`)
  }
  return n
}

async function main() {
  const { values } = parseArgs({
    options: {
      suite: { type: 'string', default: 'quick' },
      mode: { type: 'string', default: 'time' },
      size: { type: 'string' },
      filter: { type: 'string' },
      repeats: { type: 'string', default: '3' },
      time: { type: 'string', default: '1000' },
      warmup: { type: 'string', default: '300' },
      module: { type: 'string', default: 'dist/index.js' },
      out: { type: 'string' },
      list: { type: 'boolean' },
      'cpu-profile': { type: 'boolean' },
    },
  })
  if (values.suite !== 'quick' && values.suite !== 'full') throw new Error('--suite must be quick or full')
  if (values.mode !== 'time' && values.mode !== 'memory') throw new Error('--mode must be time or memory')
  const repeats = numberOption(values.repeats, 'repeats', 1, true)
  const timeMs = numberOption(values.time, 'time', 1)
  const warmupMs = numberOption(values.warmup, 'warmup', 0)
  const size = values.size === undefined ? undefined : numberOption(values.size, 'size', 32, true)
  const selected = scenarios(values.suite, size).filter(
    (scenario) => !values.filter || scenario.id.includes(values.filter),
  )
  if (!selected.length) throw new Error('No scenarios match --filter')
  if (values.list) {
    console.log(selected.map((scenario) => scenario.id).join('\n'))
    return
  }
  const modulePath = resolve(values.module)
  const targetBytes = await readFile(modulePath)
  const digestFile = async (path: string) =>
    createHash('sha256')
      .update(await readFile(path))
      .digest('hex')
  const require = createRequire(import.meta.url)
  const status = git(dirname(modulePath), ['status', '--porcelain'])
  const report: Report = {
    schemaVersion: 1,
    generatorVersion,
    createdAt: new Date().toISOString(),
    mode: values.mode,
    config: { suite: values.suite, repeats, timeMs, warmupMs, cpuProfile: !!values['cpu-profile'] },
    harness: {
      runnerSha256: await digestFile(resolve('.bench-build/run.js')),
      workerSha256: await digestFile(resolve('.bench-build/worker.js')),
      tinybenchSha256: await digestFile(require.resolve('tinybench')),
    },
    environment: {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model ?? 'unknown',
    },
    target: {
      path: modulePath,
      sha256: createHash('sha256').update(targetBytes).digest('hex'),
      commit: git(dirname(modulePath), ['rev-parse', 'HEAD']),
      dirty: status === null ? null : status.length > 0,
    },
    cases: selected.map((scenario) => ({ scenario, runs: [] })),
  }
  const outputPath = resolve(values.out ?? `.bench-results/${values.mode}-${Date.now()}.json`)
  await mkdir(dirname(outputPath), { recursive: true })
  const profileDirectory = resolve('.bench-results/profiles')
  if (values['cpu-profile']) await mkdir(profileDirectory, { recursive: true })
  const execute = promisify(execFile)
  for (let repeat = 0; repeat < repeats; repeat++) {
    for (const entry of report.cases) {
      console.log(`[${repeat + 1}/${repeats}] ${entry.scenario.id}`)
      const flags = values.mode === 'memory' ? ['--expose-gc'] : []
      if (values['cpu-profile']) flags.push('--cpu-prof', `--cpu-prof-dir=${profileDirectory}`)
      const { stdout } = await execute(
        process.execPath,
        [
          ...flags,
          resolve('.bench-build/worker.js'),
          JSON.stringify({ scenario: entry.scenario, modulePath, mode: values.mode, timeMs, warmupMs }),
        ],
        { timeout: 600_000, maxBuffer: 1024 * 1024, env: { ...process.env, NODE_OPTIONS: '' } },
      )
      entry.runs.push(JSON.parse(stdout) as Measurement)
    }
  }
  // Reject inconsistent outputs and incomplete or invalid measurements before saving a usable report.
  compareReports(report, report)
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n')
  console.table(
    report.cases.map(({ scenario, runs }) => ({
      scenario: scenario.id,
      input: runs[0].inputPositions,
      output: runs[0].outputPositions,
      removedPercent: ((1 - runs[0].outputPositions / runs[0].inputPositions) * 100).toFixed(1),
      ...(values.mode === 'time'
        ? { medianMs: median(runs.map((run) => run.timing!.medianMs)).toFixed(3) }
        : {
            maxRssMiB: (median(runs.map((run) => run.memory!.maxRssKiB)) / 1024).toFixed(2),
            arrayBuffersDeltaKiB: (
              median(runs.map((run) => run.memory!.after.arrayBuffers - run.memory!.before.arrayBuffers)) / 1024
            ).toFixed(2),
          }),
    })),
  )
  console.log(`Report: ${outputPath}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
