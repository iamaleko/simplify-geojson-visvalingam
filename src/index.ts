import { GeoJsonObject, Position } from 'geojson'
import {
  isObject,
  FinitePositiveNumber,
  isFinitePositiveNumber,
  isFeature,
  isFeatureCollection,
  isLineString,
  isMultiLineString,
  isPolygon,
  isMultiPolygon,
  isGeometryCollection,
} from '@lib/typeGuards'

export type SimplifyOptions = {
  tolerance?: number
  mutate?: boolean
}

type Positions = {
  coordinates: Position[]
  nextIndexes: number[]
  prevIndexes: number[]
}

export default function (geojson: GeoJsonObject, options: SimplifyOptions = {}): GeoJsonObject {
  // validate input data
  if (!isObject(geojson)) {
    throw new TypeError(
      `Expected provided GeoJSON to be an object, but received ${geojson === null ? 'null' : typeof geojson}.`,
    )
  }

  // validate options
  let tolerance: FinitePositiveNumber
  if (options.tolerance !== undefined && !isFinitePositiveNumber(options.tolerance)) {
    throw new Error(`Expected provided tolerance to be a finite positive number, but received ${options.tolerance}.`)
  } else {
    // exit if no simplification options provided
    if (options.tolerance === undefined) return geojson
    tolerance = options.tolerance
  }
  let mutate = true
  if (options.mutate !== undefined) mutate = options.mutate

  if (!mutate) {
    geojson = structuredClone(geojson)
  }

  const positions: Positions = {
    coordinates: [],
    nextIndexes: [],
    prevIndexes: [],
  }

  collectPositions(geojson, positions)
  const isDeleted: boolean[] = new Array(positions.coordinates.length).fill(false)
  deletePositionsByTolerance(positions, tolerance, isDeleted)
  updatePositions(geojson, isDeleted, 0)

  return geojson
}

function getPositionArea(i: number, positions: Positions): number {
  const [x1, y1] = positions.coordinates[i]
  const [x2, y2] = positions.coordinates[positions.prevIndexes[i]]
  const [x3, y3] = positions.coordinates[positions.nextIndexes[i]]
  return Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2
}

function heapsink(heap: number[], i: number, priority: number[], positions: Positions): void {
  let l: number, r: number, t: number
  while (true) {
    l = i << 1
    r = l + 1
    t = i
    if (
      l <= heap[0] &&
      (priority[heap[t]] > priority[heap[l]] ||
        (priority[heap[t]] === priority[heap[l]] &&
          (positions.coordinates[heap[t]][0] > positions.coordinates[heap[l]][0] ||
            (positions.coordinates[heap[t]][0] === positions.coordinates[heap[l]][0] &&
              positions.coordinates[heap[t]][1] > positions.coordinates[heap[l]][1]))))
    )
      t = l
    if (
      r <= heap[0] &&
      (priority[heap[t]] > priority[heap[r]] ||
        (priority[heap[t]] === priority[heap[r]] &&
          (positions.coordinates[heap[t]][0] > positions.coordinates[heap[r]][0] ||
            (positions.coordinates[heap[t]][0] === positions.coordinates[heap[r]][0] &&
              positions.coordinates[heap[t]][1] > positions.coordinates[heap[r]][1]))))
    )
      t = r
    if (i === t) break
    ;[heap[i], heap[t], i] = [heap[t], heap[i], t]
  }
}

function heapbubble(heap: number[], i: number, priority: number[], positions: Positions): void {
  let t: number
  while (i > 0) {
    t = i >>> 1
    if (
      i === t ||
      priority[heap[t]] < priority[heap[i]] ||
      (priority[heap[t]] === priority[heap[i]] &&
        (positions.coordinates[heap[t]][0] < positions.coordinates[heap[i]][0] ||
          (positions.coordinates[heap[t]][0] === positions.coordinates[heap[i]][0] &&
            positions.coordinates[heap[t]][1] < positions.coordinates[heap[i]][1])))
    )
      break
    ;[heap[i], heap[t], i] = [heap[t], heap[i], t]
  }
}

function heappop(heap: number[], priority: number[], positions: Positions): number {
  if (heap[0] > 1) {
    const data = heap[1]
    heap[1] = heap[heap[0]]
    heap[0]--
    heapsink(heap, 1, priority, positions)
    return data
  } else if (heap[0] === 1) {
    heap[0]--
    return heap[1]
  }
  return -1
}

function heappush(heap: number[], val: number, priority: number[], positions: Positions): void {
  heap[++heap[0]] = val
  heapbubble(heap, heap[0], priority, positions)
}

function deletePositionsByTolerance(positions: Positions, tolerance: FinitePositiveNumber, isDeleted: boolean[]): void {
  const n = positions.coordinates.length
  const priority: number[] = new Array(n).fill(0)
  const heap: number[] = new Array(n + 1).fill(0)
  for (let i = 0; i < n; i++) {
    if (positions.prevIndexes[i] !== -1 && positions.nextIndexes[i] !== -1) {
      priority[i] = getPositionArea(i, positions)
      heap[0]++
      heap[heap[0]] = i
    }
  }
  for (let i = heap[0] >>> 1; i > 0; i--) {
    heapsink(heap, i, priority, positions)
  }

  let i: number
  while (heap[0]) {
    i = heappop(heap, priority, positions)
    if (heap[0] && priority[i] > priority[heap[1]]) {
      continue
    }
    if (priority[i] < tolerance) {
      if (priority[i] === -1) {
        priority[i] = getPositionArea(i, positions)
        continue
      }
      isDeleted[i] = true
      positions.prevIndexes[positions.nextIndexes[i]] = positions.prevIndexes[i]
      positions.nextIndexes[positions.prevIndexes[i]] = positions.nextIndexes[i]
      if (
        positions.prevIndexes[positions.prevIndexes[i]] !== -1 &&
        positions.nextIndexes[positions.prevIndexes[i]] !== -1
      ) {
        priority[positions.prevIndexes[i]] = getPositionArea(positions.prevIndexes[i], positions)
        heappush(heap, positions.prevIndexes[i], priority, positions)
      }
      if (
        positions.prevIndexes[positions.nextIndexes[i]] !== -1 &&
        positions.nextIndexes[positions.nextIndexes[i]] !== -1
      ) {
        priority[positions.nextIndexes[i]] = getPositionArea(positions.nextIndexes[i], positions)
        heappush(heap, positions.nextIndexes[i], priority, positions)
      }
    }
  }
}

function updatePositions(geojson: GeoJsonObject, isDeleted: boolean[], index: number): number {
  if (isFeatureCollection(geojson)) {
    for (let i = 0; i < geojson.features.length; i++) {
      index = updatePositions(geojson.features[i], isDeleted, index)
    }
  } else if (isFeature(geojson)) {
    index = updatePositions(geojson.geometry, isDeleted, index)
  } else if (isGeometryCollection(geojson)) {
    for (let i = 0; i < geojson.geometries.length; i++) {
      index = updatePositions(geojson.geometries[i], isDeleted, index)
    }
  } else if (isLineString(geojson)) {
    index = updateLinePositions(geojson.coordinates, isDeleted, index)
  } else if (isMultiLineString(geojson)) {
    for (let i = 0; i < geojson.coordinates.length; i++) {
      index = updateLinePositions(geojson.coordinates[i], isDeleted, index)
    }
  } else if (isPolygon(geojson)) {
    let remove = false
    ;[index, remove] = updateRingsPositions(geojson.coordinates, isDeleted, index)
    if (remove) geojson.coordinates.splice(0)
  } else if (isMultiPolygon(geojson)) {
    let offset = 0
    for (let remove = false, i = 0; i < geojson.coordinates.length; i++) {
      ;[index, remove] = updateRingsPositions(geojson.coordinates[i], isDeleted, index)
      if (remove) {
        offset++
      } else if (offset) {
        geojson.coordinates[i - offset] = geojson.coordinates[i]
      }
    }
    if (offset) geojson.coordinates.splice(geojson.coordinates.length - offset)
  }
  return index
}

function updateLinePositions(coordinates: Position[], isDeleted: boolean[], index: number): number {
  let offset = 0
  for (let i = 0; i < coordinates.length; i++) {
    if (isDeleted[index]) {
      offset++
    } else if (offset) {
      coordinates[i - offset] = coordinates[i]
    }
    index++
  }
  if (offset) coordinates.splice(coordinates.length - offset)
  return index
}

function updateRingsPositions(coordinates: Position[][], isDeleted: boolean[], index: number): [number, boolean] {
  let offset = 0
  for (let remove = false, i = 0; i < coordinates.length; i++) {
    ;[index, remove] = updateRingPositions(coordinates[i], isDeleted, index)
    if (remove) {
      // skip interior rings if exterior ring is removed
      if (i === 0) {
        for (i = 1; i < coordinates.length; i++) {
          if (coordinates[i].length) index += coordinates[i].length - 1
        }
        // avoid alternating coordinates array if exterior ring is removed
        return [index, true]
      }
      offset++
    } else if (offset) {
      coordinates[i - offset] = coordinates[i]
    }
  }
  if (offset) coordinates.splice(coordinates.length - offset)
  return [index, false]
}

function updateRingPositions(coordinates: Position[], isDeleted: boolean[], index: number): [number, boolean] {
  let offset = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    if (isDeleted[index]) {
      offset++
    } else if (offset) {
      coordinates[i - offset] = coordinates[i]
    }
    index++
  }
  if (offset) {
    if (coordinates.length - 1 - offset < 3) {
      // avoid alternating coordinates array if ring is removed
      return [index, true]
    }
    coordinates.splice(coordinates.length - 1 - offset, offset + 1, coordinates[0])
  }
  return [index, false]
}

function collectPositions(geojson: GeoJsonObject, positions: Positions): void {
  if (isFeatureCollection(geojson)) {
    for (let i = 0; i < geojson.features.length; i++) {
      collectPositions(geojson.features[i], positions)
    }
  } else if (isFeature(geojson)) {
    collectPositions(geojson.geometry, positions)
  } else if (isGeometryCollection(geojson)) {
    for (let i = 0; i < geojson.geometries.length; i++) {
      collectPositions(geojson.geometries[i], positions)
    }
  } else if (isLineString(geojson)) {
    collectLinePositions(geojson.coordinates, positions)
  } else if (isMultiLineString(geojson)) {
    for (let i = 0; i < geojson.coordinates.length; i++) {
      collectLinePositions(geojson.coordinates[i], positions)
    }
  } else if (isPolygon(geojson)) {
    for (let i = 0; i < geojson.coordinates.length; i++) {
      collectRingPositions(geojson.coordinates[i], positions)
    }
  } else if (isMultiPolygon(geojson)) {
    for (let j, i = 0; i < geojson.coordinates.length; i++) {
      for (j = 0; j < geojson.coordinates[i].length; j++) {
        collectRingPositions(geojson.coordinates[i][j], positions)
      }
    }
  }
}

function collectLinePositions(coordinates: Position[], positions: Positions) {
  for (let p = positions.coordinates.length, n = coordinates.length, i = 0; i < n; i++) {
    positions.coordinates.push(coordinates[i])
    positions.prevIndexes.push(i === 0 ? -1 : p + i - 1)
    positions.nextIndexes.push(i === n - 1 ? -1 : p + i + 1)
  }
}

function collectRingPositions(coordinates: Position[], positions: Positions) {
  for (let p = positions.coordinates.length, n = coordinates.length - 1, i = 0; i < n; i++) {
    positions.coordinates.push(coordinates[i])
    positions.prevIndexes.push(i === 0 ? p + n - 1 : p + i - 1)
    positions.nextIndexes.push(i === n - 1 ? p : p + i + 1)
  }
}
