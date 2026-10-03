import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import type { GeoJsonObject } from 'geojson'
import { Bench } from 'tinybench'
import type { SimplifyOptions } from '../src/index'
import { generate } from './generators'
import { countPositions, hash, type Measurement } from './report'
import type { Scenario } from './scenarios'

type Job = {
  scenario: Scenario
  modulePath: string
  mode: 'time' | 'memory'
  timeMs: number
  warmupMs: number
}

async function measure(job: Job): Promise<Measurement> {
  const { default: simplify } = (await import(pathToFileURL(job.modulePath).href)) as {
    default: (geometry: GeoJsonObject, options: SimplifyOptions) => GeoJsonObject
  }
  assert.equal(typeof simplify, 'function', 'Target module must export simplify as default')
  const { scenario } = job
  const source = generate(scenario.family, scenario.size, scenario.seed)
  const inputHash = hash(source)
  const inputPositions = countPositions(source)

  if (job.mode === 'memory') {
    assert.ok(global.gc, 'Memory worker requires --expose-gc')
    global.gc()
    const before = process.memoryUsage()
    const output = simplify(source, scenario.options)
    const after = process.memoryUsage()
    const maxRssKiB = process.resourceUsage().maxRSS
    return {
      inputHash,
      inputPositions,
      outputHash: hash(output),
      outputPositions: countPositions(output),
      memory: { before, after, maxRssKiB },
    }
  }

  // Preflight correctness checks and hashing are outside both warmup and timed iterations.
  const expected = simplify(structuredClone(source), scenario.options)
  const outputHash = hash(expected)
  const outputPositions = countPositions(expected)
  let input: GeoJsonObject = source
  let output: GeoJsonObject = expected
  const bench = new Bench({
    time: job.timeMs,
    warmupTime: job.warmupMs,
    iterations: 16,
    warmupIterations: 4,
    throws: true,
    retainSamples: false,
  })
  bench.add(
    scenario.id,
    () => {
      output = simplify(input, scenario.options)
    },
    {
      async: false,
      beforeEach: () => {
        input = scenario.options.mutate ? structuredClone(source) : source
      },
    },
  )
  bench.runSync()
  const result = bench.tasks[0].result
  assert.equal(result.state, 'completed', 'Benchmark did not complete')
  if (result.state !== 'completed') throw new Error('Missing timing statistics')
  assert.equal(hash(source), inputHash, 'Benchmark source was mutated')
  assert.equal(hash(output), outputHash, 'Last iteration differs from preflight')
  const stats = result.latency
  return {
    inputHash,
    inputPositions,
    outputHash,
    outputPositions,
    timing: {
      medianMs: stats.p50,
      meanMs: stats.mean,
      p99Ms: stats.p99,
      standardDeviationMs: stats.sd,
      relativeMarginOfErrorPercent: stats.rme,
      samples: stats.samplesCount,
    },
  }
}

try {
  const job = JSON.parse(process.argv[2]) as Job
  console.log(JSON.stringify(await measure(job)))
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
