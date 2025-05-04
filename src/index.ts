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
  sortIndexes: number[]
  groupedFrom: number[]
  groupedTo: number[]
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
  if (options.mutate !== undefined) {
    mutate = !!options.mutate
  }

  if (!mutate) {
    geojson = structuredClone(geojson)
  }

  const positions: Positions = {
    coordinates: [],
    nextIndexes: [],
    prevIndexes: [],
    sortIndexes: [],
    groupedFrom: [],
    groupedTo: [],
  }

  collectPositions(geojson, positions)
  if (positions.coordinates.length) {
    groupPositions(positions)
    const isDeleted: Uint8Array = new Uint8Array(positions.coordinates.length)
    deletePositions(positions, tolerance, isDeleted)
    updatePositions(geojson, isDeleted, 0)
  }

  return geojson
}

function groupPositions(positions: Positions): void {
  positions.sortIndexes = [...new Array(positions.coordinates.length).keys()]
  positions.sortIndexes.sort((a, b) => {
    return (
      positions.coordinates[a][0] - positions.coordinates[b][0] ||
      positions.coordinates[a][1] - positions.coordinates[b][1]
    )
  })

  positions.groupedFrom = new Array(positions.coordinates.length).fill(0)
  positions.groupedTo = new Array(positions.coordinates.length).fill(positions.sortIndexes.length - 1)
  for (let i = 1, j = positions.sortIndexes.length - 2; i < positions.sortIndexes.length; i++, j--) {
    if (
      positions.coordinates[positions.sortIndexes[i]][0] !== positions.coordinates[positions.sortIndexes[i - 1]][0] ||
      positions.coordinates[positions.sortIndexes[i]][1] !== positions.coordinates[positions.sortIndexes[i - 1]][1]
    ) {
      positions.groupedFrom[positions.sortIndexes[i]] = i
    } else {
      positions.groupedFrom[positions.sortIndexes[i]] = positions.groupedFrom[positions.sortIndexes[i - 1]]
    }
    if (
      positions.coordinates[positions.sortIndexes[j]][0] !== positions.coordinates[positions.sortIndexes[j + 1]][0] ||
      positions.coordinates[positions.sortIndexes[j]][1] !== positions.coordinates[positions.sortIndexes[j + 1]][1]
    ) {
      positions.groupedTo[positions.sortIndexes[j]] = j
    } else {
      positions.groupedTo[positions.sortIndexes[j]] = positions.groupedTo[positions.sortIndexes[j + 1]]
    }
  }
}

function getPositionArea(i: number, positions: Positions): number {
  return (
    Math.abs(
      positions.coordinates[i][0] *
        (positions.coordinates[positions.prevIndexes[i]][1] - positions.coordinates[positions.nextIndexes[i]][1]) +
        positions.coordinates[positions.prevIndexes[i]][0] *
          (positions.coordinates[positions.nextIndexes[i]][1] - positions.coordinates[i][1]) +
        positions.coordinates[positions.nextIndexes[i]][0] *
          (positions.coordinates[i][1] - positions.coordinates[positions.prevIndexes[i]][1]),
    ) / 2
  )
}

function heapcompare(a: number, b: number, priority: Float64Array, coordinates: Position[]): number {
  return priority[a] - priority[b] || coordinates[a][0] - coordinates[b][0] || coordinates[a][1] - coordinates[b][1]
}

function heapsink(
  heap: Uint32Array,
  heapRev: Uint32Array,
  i: number,
  priority: Float64Array,
  coordinates: Position[],
): number {
  let l: number, r: number, t: number
  while (true) {
    t = i
    if ((l = i << 1) <= heap[0] && heapcompare(heap[t], heap[l], priority, coordinates) > 0) t = l
    if ((r = l + 1) <= heap[0] && heapcompare(heap[t], heap[r], priority, coordinates) > 0) t = r
    if (i === t) break
    heapswap(heap, heapRev, i, t)
    i = t
  }
  return i
}

function heapbubble(
  heap: Uint32Array,
  heapRev: Uint32Array,
  i: number,
  priority: Float64Array,
  coordinates: Position[],
): number {
  let t: number
  while (i > 1) {
    t = i >>> 1
    if (i === t || heapcompare(heap[t], heap[i], priority, coordinates) <= 0) break
    heapswap(heap, heapRev, i, t)
    i = t
  }
  return i
}

function heapupdate(
  heap: Uint32Array,
  heapRev: Uint32Array,
  val: number,
  priority: Float64Array,
  coordinates: Position[],
): void {
  heapbubble(heap, heapRev, heapsink(heap, heapRev, heapRev[val], priority, coordinates), priority, coordinates)
}

function heapswap(heap: Uint32Array, heapRev: Uint32Array, i: number, t: number): void {
  heapRev[heap[i]] = t
  heapRev[heap[t]] = i
  ;[heap[i], heap[t]] = [heap[t], heap[i]]
}

function heappop(heap: Uint32Array, heapRev: Uint32Array, priority: Float64Array, coordinates: Position[]): number {
  if (heap[0] > 1) {
    heapswap(heap, heapRev, 1, heap[0])
    heap[0]--
    heapsink(heap, heapRev, 1, priority, coordinates)
    return heap[heap[0] + 1]
  } else if (heap[0] === 1) {
    heap[0]--
    return heap[1]
  }
  return -1
}

function heapify(heap: Uint32Array, heapRev: Uint32Array, priority: Float64Array, coordinates: Position[]): void {
  for (let i = heap[0] >>> 1; i > 0; i--) {
    heapsink(heap, heapRev, i, priority, coordinates)
  }
}

function deletePositions(positions: Positions, tolerance: FinitePositiveNumber, isDeleted: Uint8Array): void {
  const n = positions.coordinates.length

  const candidatesByGroupFrom: Uint32Array = new Uint32Array(n)
  const isCandidate: Uint8Array = new Uint8Array(n)

  const heap: Uint32Array = new Uint32Array(n + 1)
  const priority: Float64Array = new Float64Array(n)
  const heapRev: Uint32Array = new Uint32Array(n)
  for (let i = 0; i < n; i++) {
    if (positions.prevIndexes[i] !== -1 && positions.nextIndexes[i] !== -1) {
      priority[i] = getPositionArea(i, positions)
      heap[0]++
      heap[heap[0]] = i
      heapRev[i] = heap[0]
    }
  }
  heapify(heap, heapRev, priority, positions.coordinates)

  let i: number
  while (heap[0]) {
    i = heappop(heap, heapRev, priority, positions.coordinates)

    // check if position should be skipped
    if (isDeleted[i]) {
      continue
    }

    // check if simplification is completed
    if (priority[i] >= tolerance) {
      break
    }

    // mark as candidate
    if (!isCandidate[i]) {
      isCandidate[i] = 1
      candidatesByGroupFrom[positions.groupedFrom[i]]++
    }

    // check if position is grouped and group is not entirely marked
    if (candidatesByGroupFrom[positions.groupedFrom[i]] !== positions.groupedTo[i] - positions.groupedFrom[i] + 1) {
      continue
    }

    // delete all positions from group
    // possible bug: in ring with two idetical positions (!!) test case needed
    for (let k: number, j = positions.groupedFrom[i]; j <= positions.groupedTo[i]; j++) {
      k = positions.sortIndexes[j]
      if (isDeleted[k]) {
        continue
      }

      // check if we are about to delete the entire ring or a single position
      if (
        positions.prevIndexes[k] !== -1 &&
        positions.prevIndexes[positions.prevIndexes[k]] !== -1 &&
        positions.prevIndexes[positions.prevIndexes[positions.prevIndexes[k]]] === k
      ) {
        // mark neighbors as candidates if not yet
        if (!isCandidate[positions.prevIndexes[k]]) {
          isCandidate[positions.prevIndexes[k]] = 1
          candidatesByGroupFrom[positions.groupedFrom[positions.prevIndexes[k]]]++
        }
        if (!isCandidate[positions.nextIndexes[k]]) {
          isCandidate[positions.nextIndexes[k]] = 1
          candidatesByGroupFrom[positions.groupedFrom[positions.nextIndexes[k]]]++
        }

        // remove entire ring if neighbor groups are entirely marked
        if (
          candidatesByGroupFrom[positions.groupedFrom[positions.prevIndexes[k]]] ===
            positions.groupedTo[positions.prevIndexes[k]] - positions.groupedFrom[positions.prevIndexes[k]] + 1 &&
          candidatesByGroupFrom[positions.groupedFrom[positions.nextIndexes[k]]] ===
            positions.groupedTo[positions.nextIndexes[k]] - positions.groupedFrom[positions.nextIndexes[k]] + 1
        ) {
          isDeleted[k] = 1
          isDeleted[positions.nextIndexes[k]] = 1
          isDeleted[positions.prevIndexes[k]] = 1

          // repeat to delete all matching rings
          // possible optimization
          j = positions.groupedFrom[i] - 1
        }
      } else {
        isDeleted[k] = 1
        positions.prevIndexes[positions.nextIndexes[k]] = positions.prevIndexes[k]
        positions.nextIndexes[positions.prevIndexes[k]] = positions.nextIndexes[k]

        // update neighbors priority and their positions in the heap
        if (positions.prevIndexes[positions.prevIndexes[k]] !== -1) {
          priority[positions.prevIndexes[k]] = getPositionArea(positions.prevIndexes[k], positions)
          heapupdate(heap, heapRev, positions.prevIndexes[k], priority, positions.coordinates)
        }
        if (positions.nextIndexes[positions.nextIndexes[k]] !== -1) {
          priority[positions.nextIndexes[k]] = getPositionArea(positions.nextIndexes[k], positions)
          heapupdate(heap, heapRev, positions.nextIndexes[k], priority, positions.coordinates)
        }
      }
    }
  }
}

function updatePositions(geojson: GeoJsonObject, isDeleted: Uint8Array, index: number): number {
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

function updateLinePositions(coordinates: Position[], isDeleted: Uint8Array, index: number): number {
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

function updateRingsPositions(coordinates: Position[][], isDeleted: Uint8Array, index: number): [number, boolean] {
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

function updateRingPositions(coordinates: Position[], isDeleted: Uint8Array, index: number): [number, boolean] {
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
