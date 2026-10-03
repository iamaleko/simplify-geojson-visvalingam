import { createHash } from 'node:crypto'
import type { Feature, FeatureCollection, GeoJsonObject, Geometry } from 'geojson'
import type { Scenario } from './scenarios'

export function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

// Count the algorithm's collected positions: ring closure and Point/MultiPoint are excluded.
export function countPositions(value: GeoJsonObject | null): number {
  if (!value) return 0
  const geojson = value as Geometry | Feature | FeatureCollection
  switch (geojson.type) {
    case 'Feature':
      return countPositions(geojson.geometry)
    case 'FeatureCollection':
      return geojson.features.reduce((sum, feature) => sum + countPositions(feature), 0)
    case 'GeometryCollection':
      return geojson.geometries.reduce((sum, geometry) => sum + countPositions(geometry), 0)
    case 'LineString':
      return geojson.coordinates.length
    case 'MultiLineString':
      return geojson.coordinates.reduce((sum, line) => sum + line.length, 0)
    case 'Polygon':
      return geojson.coordinates.reduce((sum, ring) => sum + Math.max(0, ring.length - 1), 0)
    case 'MultiPolygon':
      return geojson.coordinates.reduce(
        (sum, polygon) => sum + polygon.reduce((count, ring) => count + Math.max(0, ring.length - 1), 0),
        0,
      )
    default:
      return 0
  }
}

export type Timing = {
  medianMs: number
  meanMs: number
  p99Ms: number
  standardDeviationMs: number
  relativeMarginOfErrorPercent: number
  samples: number
}
export type Measurement = {
  inputHash: string
  outputHash: string
  inputPositions: number
  outputPositions: number
  timing?: Timing
  memory?: {
    before: NodeJS.MemoryUsage
    after: NodeJS.MemoryUsage
    maxRssKiB: number
  }
}
export type Report = {
  schemaVersion: 1
  generatorVersion: number
  createdAt: string
  mode: 'time' | 'memory'
  config: { suite: 'quick' | 'full'; repeats: number; timeMs: number; warmupMs: number; cpuProfile: boolean }
  harness: { runnerSha256: string; workerSha256: string; tinybenchSha256: string }
  environment: { node: string; v8: string; platform: string; arch: string; cpu: string }
  target: { path: string; sha256: string; commit: string | null; dirty: boolean | null }
  cases: { scenario: Scenario; runs: Measurement[] }[]
}

export function median(values: number[]): number {
  if (!values.length || values.some((n) => !Number.isFinite(n))) throw new Error('Expected finite measurements')
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function compareReports(baseline: Report, candidate: Report) {
  if (baseline.schemaVersion !== 1 || candidate.schemaVersion !== 1) throw new Error('Unsupported report schema')
  for (const key of ['mode', 'generatorVersion', 'config', 'environment', 'harness'] as const) {
    if (hash(baseline[key]) !== hash(candidate[key])) throw new Error(`Incompatible ${key}; rerun both versions`)
  }
  if (baseline.cases.length !== candidate.cases.length) throw new Error('Different scenario sets')
  if (!baseline.cases.length || baseline.config.repeats < 1) throw new Error('Empty report')
  const baselineCases = new Map(baseline.cases.map((entry) => [entry.scenario.id, entry]))
  if (
    baselineCases.size !== baseline.cases.length ||
    new Set(candidate.cases.map((c) => c.scenario.id)).size !== candidate.cases.length
  ) {
    throw new Error('Duplicate scenario IDs')
  }
  return candidate.cases.map((entry) => {
    const previous = baselineCases.get(entry.scenario.id)
    if (!previous || hash(previous.scenario) !== hash(entry.scenario))
      throw new Error(`Different scenario: ${entry.scenario.id}`)
    if (previous.runs.length !== baseline.config.repeats || entry.runs.length !== candidate.config.repeats) {
      throw new Error(`Incomplete repeats: ${entry.scenario.id}`)
    }
    const reference = previous.runs[0]
    for (const run of [...previous.runs, ...entry.runs]) {
      for (const key of ['inputHash', 'outputHash', 'inputPositions', 'outputPositions'] as const) {
        if (run[key] !== reference[key]) throw new Error(`Different ${key}: ${entry.scenario.id}`)
      }
    }
    const metric = (run: Measurement): number => {
      const value = baseline.mode === 'time' ? run.timing?.medianMs : run.memory?.maxRssKiB
      if (value === undefined || !Number.isFinite(value) || value <= 0)
        throw new Error(`Invalid measurement: ${entry.scenario.id}`)
      return value
    }
    const before = median(previous.runs.map(metric))
    const after = median(entry.runs.map(metric))
    return { scenario: entry.scenario.id, before, after, changePercent: (after / before - 1) * 100 }
  })
}
