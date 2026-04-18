import assert from 'assert'
import simplify from '@src/index'
import { GeoJsonObject } from 'geojson'

import inAllTypesWithCommonPositions from '@test/geojson/in/allTypesWithCommonPositions.json'
import outAllTypesWithCommonPositionsFraction1Tolerance1e6 from '@test/geojson/out/allTypesWithCommonPositionsFraction1Tolerance1e6.json'
import inSmallMultiLineStringWithCommonPositions from '@test/geojson/in/smallMultiLineStringWithCommonPositions.json'
import outSmallMultiLineStringWithCommonPositionsFraction0Tolerance000000000005 from '@test/geojson/out/smallMultiLineStringWithCommonPositionsFraction0Tolerance000000000005.json'
import outSmallMultiLineStringWithCommonPositionsFraction03Tolerance0 from '@test/geojson/out/smallMultiLineStringWithCommonPositionsFraction03Tolerance0.json'
import inSmallMultiPolygonWithCommonPositions from '@test/geojson/in/smallMultiPolygonWithCommonPositions.json'
import outSmallMultiPolygonWithCommonPositionsFraction0Tolerance000000014 from '@test/geojson/out/smallMultiPolygonWithCommonPositionsFraction0Tolerance000000014.json'
import outSmallMultiPolygonWithCommonPositionsFraction03Tolerance0 from '@test/geojson/out/smallMultiPolygonWithCommonPositionsFraction03Tolerance0.json'

describe('simplify() - simplification by tolerance with common positions', () => {
  it('should remove all positions except common positions and points when provided tolerance is huge', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesWithCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 1e6,
      }),
      outAllTypesWithCommonPositionsFraction1Tolerance1e6,
    )
  })

  it('should correctly simplify small MultiLineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiLineStringWithCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000000005,
      }),
      outSmallMultiLineStringWithCommonPositionsFraction0Tolerance000000000005,
    )
  })

  it('should correctly simplify small MultiPolygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiPolygonWithCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000014,
      }),
      outSmallMultiPolygonWithCommonPositionsFraction0Tolerance000000014,
    )
  })
})

describe('simplify() - simplification by fraction with common positions', () => {
  it('should remove all positions except common positions and points when provided fraction is 1', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesWithCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 1,
      }),
      outAllTypesWithCommonPositionsFraction1Tolerance1e6,
    )
  })

  it('should correctly simplify small MultiLineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiLineStringWithCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.3,
      }),
      outSmallMultiLineStringWithCommonPositionsFraction03Tolerance0,
    )
  })

  it('should correctly simplify small MultiPolygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiPolygonWithCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.3,
      }),
      outSmallMultiPolygonWithCommonPositionsFraction03Tolerance0,
    )
  })
})
