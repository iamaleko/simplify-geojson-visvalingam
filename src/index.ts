import { GeoJsonObject, Position } from 'geojson'
import {
  isObject,
  isFinitePositiveNumber,
  isFeature,
  isFeatureCollection,
  isLineString,
  isMultiLineString,
  isPolygon,
  isMultiPolygon,
  isGeometryCollection,
} from '@lib/typeGuards'
import { deletePositions, groupPositions, type Positions } from '@lib/functions'

export type SimplifyOptions = {
  tolerance?: number
  fraction?: number
  mutate?: boolean
}

export default function (geojson: GeoJsonObject, options: SimplifyOptions = {}): GeoJsonObject {
  // validate input data
  if (!isObject(geojson)) {
    throw new TypeError(
      `Expected provided GeoJSON to be an object, but received ${geojson === null ? 'null' : typeof geojson}.`,
    )
  }

  // validate options
  let tolerance = 0
  if (options.tolerance !== undefined) {
    if (!isFinitePositiveNumber(options.tolerance)) {
      throw new Error(`Expected provided tolerance to be a finite positive number, but received ${options.tolerance}.`)
    }
    tolerance = options.tolerance
  }
  let fraction = 0
  if (options.fraction !== undefined) {
    if (!isFinitePositiveNumber(options.fraction)) {
      throw new Error(`Expected provided fraction to be a finite positive number, but received ${options.fraction}.`)
    }
    if (options.fraction > 1) {
      throw new Error(`Expected provided fraction to be less or equal to 1, but received ${options.fraction}.`)
    }
    fraction = options.fraction
  }
  let mutate = true
  if (options.mutate !== undefined) {
    mutate = !!options.mutate
  }

  // exit if no simplification options provided
  if (tolerance === 0 && fraction === 0) {
    return geojson
  }

  if (!mutate) {
    geojson = structuredClone(geojson)
  }

  const positions: Positions = {
    coordinates: [],
    nextIndexes: [],
    prevIndexes: [],
  }
  collectPositions(geojson, positions)

  if (positions.coordinates.length) {
    updatePositions(geojson, deletePositions(positions, groupPositions(positions.coordinates), tolerance, fraction), 0)
  }

  return geojson
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
