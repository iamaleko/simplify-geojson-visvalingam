import assert from 'node:assert/strict'
import { families, generate } from '../bench/generators'
import { compareReports, countPositions, hash, type Report } from '../bench/report'
import { scenarios } from '../bench/scenarios'
import simplify from '@src/index'

function report(): Report {
  const scenario = scenarios('quick', 128)[0]
  return {
    schemaVersion: 1,
    generatorVersion: 1,
    createdAt: '2026-10-02T00:00:00.000Z',
    mode: 'time',
    config: { suite: 'quick', repeats: 1, timeMs: 1000, warmupMs: 300, cpuProfile: false },
    harness: { runnerSha256: 'runner', workerSha256: 'worker', tinybenchSha256: 'tinybench' },
    environment: { node: 'test', v8: 'test', platform: 'test', arch: 'test', cpu: 'test' },
    target: { path: 'test', sha256: 'test', commit: null, dirty: null },
    cases: [
      {
        scenario,
        runs: [
          {
            inputHash: 'input',
            outputHash: 'output',
            inputPositions: 128,
            outputPositions: 64,
            timing: {
              medianMs: 10,
              meanMs: 11,
              p99Ms: 15,
              standardDeviationMs: 2,
              relativeMarginOfErrorPercent: 1,
              samples: 100,
            },
          },
        ],
      },
    ],
  }
}

describe('benchmark generators', () => {
  for (const family of families) {
    it(`should reproduce ${family} from its seed and simplify identically in both modes`, () => {
      const input = generate(family, 128, 42)
      const originalHash = hash(input)
      assert.equal(countPositions(input), 128)
      assert.deepStrictEqual(input, generate(family, 128, 42))
      const cloned = simplify(input, { mutate: false, fraction: 0.5 })
      assert.equal(hash(input), originalHash)
      const mutated = simplify(structuredClone(input), { mutate: true, fraction: 0.5 })
      assert.deepStrictEqual(mutated, cloned)
      assert.ok(countPositions(cloned) < countPositions(input))
    })
  }

  it('should generate closed rings with exactly matching shared boundary coordinates and distinct objects', () => {
    const input = generate('shared-boundary', 128, 42)
    assert.equal(input.type, 'MultiPolygon')
    if (input.type !== 'MultiPolygon') throw new Error('Expected MultiPolygon')
    const [left, right] = input.coordinates.map((polygon) => polygon[0])
    assert.deepStrictEqual(left[0], left[left.length - 1])
    assert.deepStrictEqual(right[0], right[right.length - 1])
    const common = left.slice(0, -1).filter((point) => right.slice(0, -1).some((other) => hash(point) === hash(other)))
    assert.equal(common.length, 17)
    for (const point of common) {
      const other = right.find((candidate) => hash(point) === hash(candidate))
      assert.notStrictEqual(point, other)
    }
  })

  it('should use seeds to change noisy geometry', () => {
    assert.notEqual(hash(generate('noisy-line', 128, 1)), hash(generate('noisy-line', 128, 2)))
  })

  it('should select only mutating scenarios with unique IDs', () => {
    const selected = scenarios('quick')
    assert.equal(selected.length, 6)
    assert.equal(new Set(selected.map((scenario) => scenario.id)).size, 6)
    assert.ok(selected.every((scenario) => scenario.options.mutate === true && scenario.id.endsWith('/mutate')))
    const full = scenarios('full')
    assert.equal(full.length, 90)
    assert.ok(full.every((scenario) => scenario.options.mutate === true && scenario.id.endsWith('/mutate')))
  })

  it('should reject unsupported input sizes', () => {
    for (const size of [0, 31, 32.5, NaN, Infinity]) assert.throws(() => generate('noisy-line', size, 42))
  })
})

describe('benchmark report comparison', () => {
  it('should compare the median across process repeats and report negative changes as improvements', () => {
    const baseline = report()
    baseline.config.repeats = 3
    baseline.cases[0].runs = [10, 12, 100].map((medianMs) => ({
      ...baseline.cases[0].runs[0],
      timing: { ...baseline.cases[0].runs[0].timing!, medianMs },
    }))
    const candidate = structuredClone(baseline)
    candidate.target.sha256 = 'new-code'
    candidate.cases[0].runs.forEach((run) => {
      run.timing!.medianMs = 6
    })
    assert.deepStrictEqual(compareReports(baseline, candidate), [
      { scenario: baseline.cases[0].scenario.id, before: 12, after: 6, changePercent: -50 },
    ])
  })

  it('should compare memory as peak RSS in KiB', () => {
    const baseline = report()
    baseline.mode = 'memory'
    baseline.cases[0].runs[0].memory = { before: process.memoryUsage(), after: process.memoryUsage(), maxRssKiB: 100 }
    const candidate = structuredClone(baseline)
    candidate.cases[0].runs[0].memory!.maxRssKiB = 80
    assert.ok(Math.abs(compareReports(baseline, candidate)[0].changePercent + 20) < 1e-10)
  })

  for (const key of ['inputHash', 'outputHash', 'inputPositions', 'outputPositions'] as const) {
    it(`should reject different ${key}`, () => {
      const baseline = report()
      const candidate = structuredClone(baseline)
      if (key === 'inputHash' || key === 'outputHash') candidate.cases[0].runs[0][key] = 'different'
      else candidate.cases[0].runs[0][key]++
      assert.throws(() => compareReports(baseline, candidate), new RegExp(key))
    })
  }

  it('should reject incompatible environments and measurement settings', () => {
    const baseline = report()
    const candidate = structuredClone(baseline)
    candidate.environment.node = 'different'
    assert.throws(() => compareReports(baseline, candidate), /environment/)
    candidate.environment = baseline.environment
    candidate.config.timeMs++
    assert.throws(() => compareReports(baseline, candidate), /config/)
  })

  it('should reject measurements made with different harness code', () => {
    const baseline = report()
    const candidate = structuredClone(baseline)
    candidate.harness.workerSha256 = 'changed'
    assert.throws(() => compareReports(baseline, candidate), /harness/)
  })

  it('should reject missing scenarios, incomplete repeats and invalid measurements', () => {
    const baseline = report()
    const candidate = structuredClone(baseline)
    candidate.cases = []
    assert.throws(() => compareReports(baseline, candidate), /scenario sets/)
    candidate.cases = structuredClone(baseline.cases)
    candidate.cases[0].runs = []
    assert.throws(() => compareReports(baseline, candidate), /Incomplete/)
    candidate.cases = structuredClone(baseline.cases)
    candidate.cases[0].runs[0].timing!.medianMs = NaN
    assert.throws(() => compareReports(baseline, candidate), /Invalid/)
  })

  it('should reject changed scenarios and duplicate scenario IDs', () => {
    const baseline = report()
    const candidate = structuredClone(baseline)
    candidate.cases[0].scenario.seed++
    assert.throws(() => compareReports(baseline, candidate), /Different scenario/)
    candidate.cases = [...baseline.cases, ...baseline.cases]
    baseline.cases = candidate.cases
    assert.throws(() => compareReports(baseline, candidate), /Duplicate/)
  })
})
