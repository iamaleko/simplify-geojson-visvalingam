import type { FeatureCollection, Geometry, Position } from 'geojson'

export const generatorVersion = 2
export const families = [
  'noisy-line',
  'short-lines',
  'polygon-holes',
  'shared-boundary',
  'country-mosaic',
  'collinear-line',
  'feature-collection',
] as const
export type Family = (typeof families)[number]

function randomSource(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function line(n: number, offset: number, random: () => number): Position[] {
  return Array.from({ length: n }, (_, i) => [
    offset + i / Math.max(1, n - 1),
    Math.sin(i * 0.03) * 0.1 + (random() - 0.5) * 0.02,
  ])
}

function ring(n: number, x: number, radius: number, random: () => number): Position[] {
  const coordinates = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI
    const r = radius * (1 + random() * 0.02)
    return [x + Math.cos(angle) * r, Math.sin(angle) * r]
  })
  coordinates.push([...coordinates[0]])
  return coordinates
}

function edge(from: Position, to: Position, n: number): Position[] {
  return Array.from({ length: n }, (_, i) => [
    from[0] + ((to[0] - from[0]) * i) / n,
    from[1] + ((to[1] - from[1]) * i) / n,
  ])
}

function border(from: Position, to: Position, segments: number, random: () => number): Position[] {
  const deltaX = to[0] - from[0]
  const deltaY = to[1] - from[1]
  return Array.from({ length: segments + 1 }, (_, index) => {
    if (index === 0) return from
    if (index === segments) return to
    const fraction = index / segments
    const bend = (random() - 0.5) * 0.12 * Math.sin(Math.PI * fraction)
    return [from[0] + deltaX * fraction - deltaY * bend, from[1] + deltaY * fraction + deltaX * bend]
  })
}

export function generate(family: Family, size: number, seed: number): Geometry | FeatureCollection {
  if (!Number.isSafeInteger(size) || size < 32) throw new Error('Size must be an integer >= 32')
  const random = randomSource(seed)
  switch (family) {
    case 'noisy-line':
      return { type: 'LineString', coordinates: line(size, 0, random) }
    case 'collinear-line':
      return { type: 'LineString', coordinates: Array.from({ length: size }, (_, i) => [i / size, 0]) }
    case 'short-lines': {
      const count = Math.ceil(size / 32)
      return {
        type: 'MultiLineString',
        coordinates: Array.from({ length: count }, (_, i) =>
          line(Math.floor(size / count) + (i < size % count ? 1 : 0), i * 2, random),
        ),
      }
    }
    case 'polygon-holes': {
      const holeSize = Math.floor(size / 4)
      return {
        type: 'Polygon',
        coordinates: [
          ring(size - holeSize * 2, 0, 1, random),
          ring(holeSize, -0.4, 0.2, random).reverse(),
          ring(holeSize, 0.4, 0.2, random).reverse(),
        ],
      }
    }
    case 'shared-boundary': {
      const n = Math.floor(size / 8)
      const shared = Array.from({ length: n }, (_, i) => [Math.sin((i / n) * Math.PI) * 0.03, i / n])
      const left = [
        ...edge([-1, 0], [0, 0], n),
        ...shared.map((p) => [...p]),
        ...edge([0, 1], [-1, 1], n),
        ...edge([-1, 1], [-1, 0], n),
      ]
      const right = [
        ...edge([0, 0], [1, 0], n),
        ...edge([1, 0], [1, 1], n),
        ...edge([1, 1], [0, 1], n),
        [0, 1],
        ...shared
          .slice(1)
          .reverse()
          .map((p) => [...p]),
      ]
      left.push([...left[0]])
      right.push([...right[0]])
      return { type: 'MultiPolygon', coordinates: [[left], [right]] }
    }
    case 'country-mosaic': {
      const gridSize = Math.min(8, Math.max(2, Math.floor(Math.sqrt(size / 8))))
      const segments = Math.max(2, Math.round(size / (4 * gridSize * gridSize)))
      const vertices = Array.from({ length: gridSize + 1 }, (_, row) =>
        Array.from(
          { length: gridSize + 1 },
          (_, column): Position => [column + (random() - 0.5) * 0.18, row + (random() - 0.5) * 0.18],
        ),
      )
      const horizontal = Array.from({ length: gridSize + 1 }, (_, row) =>
        Array.from({ length: gridSize }, (_, column) =>
          border(vertices[row][column], vertices[row][column + 1], segments, random),
        ),
      )
      const vertical = Array.from({ length: gridSize }, (_, row) =>
        Array.from({ length: gridSize + 1 }, (_, column) =>
          border(vertices[row][column], vertices[row + 1][column], segments, random),
        ),
      )
      return {
        type: 'FeatureCollection',
        features: Array.from({ length: gridSize * gridSize }, (_, index) => {
          const row = Math.floor(index / gridSize)
          const column = index % gridSize
          const coordinates = [
            ...horizontal[row][column].slice(0, -1),
            ...vertical[row][column + 1].slice(0, -1),
            ...horizontal[row + 1][column].slice(1).reverse(),
            ...vertical[row][column].slice(1).reverse(),
          ].map((position) => [...position])
          coordinates.push([...coordinates[0]])
          return {
            type: 'Feature',
            properties: { id: index },
            geometry: { type: 'Polygon', coordinates: [coordinates] },
          }
        }),
      }
    }
    case 'feature-collection': {
      const count = Math.ceil(size / 128)
      return {
        type: 'FeatureCollection',
        features: Array.from({ length: count }, (_, i) => ({
          type: 'Feature',
          properties: { id: i, label: `synthetic-${i}` },
          geometry: {
            type: 'Polygon',
            coordinates: [ring(Math.floor(size / count) + (i < size % count ? 1 : 0), i * 3, 1, random)],
          },
        })),
      }
    }
  }
}
