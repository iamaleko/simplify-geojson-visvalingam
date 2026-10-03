import type { SimplifyOptions } from '../src/index'
import { families, type Family } from './generators'

export type Scenario = {
  id: string
  family: Family
  size: number
  seed: number
  options: SimplifyOptions
}

export function scenarios(suite: 'quick' | 'full', size?: number): Scenario[] {
  const sizes = size === undefined ? (suite === 'quick' ? [10_000] : [1_000, 10_000, 100_000]) : [size]
  const settings: { name: string; options: SimplifyOptions }[] =
    suite === 'quick'
      ? [{ name: 'fraction-0.5', options: { fraction: 0.5 } }]
      : [
          { name: 'fraction-0.1', options: { fraction: 0.1 } },
          { name: 'fraction-0.5', options: { fraction: 0.5 } },
          { name: 'fraction-0.9', options: { fraction: 0.9 } },
          { name: 'tolerance', options: { tolerance: 0.0001 } },
          { name: 'combined', options: { tolerance: 0.0001, fraction: 0.25 } },
        ]
  return sizes.flatMap((n) =>
    families.flatMap((family) =>
      settings.map(({ name, options }) => ({
        id: `${family}/${n}/${name}/mutate`,
        family,
        size: n,
        seed: 20261002,
        options: { ...options, mutate: true },
      })),
    ),
  )
}
