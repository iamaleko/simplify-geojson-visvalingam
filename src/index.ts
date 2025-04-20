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
  coordinates: Position[][]
  coordinatesIndexes: number[]
  nextIndexes: number[]
  prevIndexes: number[]
}

export default function (geojson: GeoJsonObject, options: SimplifyOptions = {}): GeoJsonObject {
  // validate input data
  if (!isObject(geojson)) {
    throw new TypeError(`Expected an Object, but received ${typeof geojson}.`)
  }

  // validate options
  let tolerance: FinitePositiveNumber
  if (options.tolerance !== undefined && !isFinitePositiveNumber(options.tolerance)) {
    throw new Error(`Expected tolerance to be a finite positive number, but received ${options.tolerance}.`)
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
    coordinatesIndexes: [],
    nextIndexes: [],
    prevIndexes: [],
  }

  collectPositions(geojson, positions)
  const isDeleted: boolean[] = new Array(positions.coordinatesIndexes.length).fill(false)
  deletePositionsByTolerance(positions, tolerance, isDeleted)
  updatePositions(geojson, positions, isDeleted, 0)

  return geojson
}

function deletePositionsByTolerance(positions: Positions, tolerance: FinitePositiveNumber, isDeleted: boolean[]): void {
  const n = positions.coordinatesIndexes.length - 1
  let l = 0
  let r = 1
  let x1: number, x2: number, x3: number, y1: number, y2: number, y3: number
  while (l <= n) {
    if (!isDeleted[l] && positions.prevIndexes[l] !== -1 && positions.nextIndexes[l] !== -1) {
      // check if we need to delete current position
      ;[x1, y1] = positions.coordinates[l][positions.coordinatesIndexes[l]]
      ;[x2, y2] = positions.coordinates[l][positions.coordinatesIndexes[positions.prevIndexes[l]]]
      ;[x3, y3] = positions.coordinates[l][positions.coordinatesIndexes[positions.nextIndexes[l]]]
      if (Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2 < tolerance) {
        isDeleted[l] = true
        // update positions linked list
        positions.prevIndexes[positions.nextIndexes[l]] = positions.prevIndexes[l]
        positions.nextIndexes[positions.prevIndexes[l]] = positions.nextIndexes[l]
        // jump to previous position to recheck updated triangle
        l = positions.prevIndexes[l]
        continue
      }
    }
    l = r++
  }
}

function updatePositions(geojson: GeoJsonObject, positions: Positions, isDeleted: boolean[], index: number): number {
  if (isFeatureCollection(geojson)) {
    for (let i = 0; i < geojson.features.length; i++) {
      index = updatePositions(geojson.features[i], positions, isDeleted, index)
    }
  } else if (isFeature(geojson)) {
    index = updatePositions(geojson.geometry, positions, isDeleted, index)
  } else if (isGeometryCollection(geojson)) {
    for (let i = 0; i < geojson.geometries.length; i++) {
      index = updatePositions(geojson.geometries[i], positions, isDeleted, index)
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
    coordinates.splice(coordinates.length - 1 - offset, offset, coordinates[0])
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
  for (let p = positions.coordinatesIndexes.length, n = coordinates.length, i = 0; i < n; i++) {
    positions.coordinates.push(coordinates)
    positions.coordinatesIndexes.push(i)
    positions.prevIndexes.push(i === 0 ? -1 : p + i - 1)
    positions.nextIndexes.push(i === n - 1 ? -1 : p + i + 1)
  }
}

function collectRingPositions(coordinates: Position[], positions: Positions) {
  for (let p = positions.coordinatesIndexes.length, n = coordinates.length - 1, i = 0; i < n; i++) {
    positions.coordinates.push(coordinates)
    positions.coordinatesIndexes.push(i)
    positions.prevIndexes.push(i === 0 ? p + n - 1 : p + i - 1)
    positions.nextIndexes.push(i === n - 1 ? p : p + i + 1)
  }
}
