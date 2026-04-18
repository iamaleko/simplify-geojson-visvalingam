import assert from 'assert'
import simplify from '@src/index'
import { GeoJsonObject } from 'geojson'

import inAllTypesNoCommonPositions from '@test/geojson/in/allTypesNoCommonPositions.json'
import outAllTypesNoCommonPositionsFraction1Tolerance1e6 from '@test/geojson/out/allTypesNoCommonPositionsFraction1Tolerance1e6.json'
import outAllTypesNoCommonPositionsLeaveAllPositionsFraction001Tolerance00000002422 from '@test/geojson/out/allTypesNoCommonPositionsFraction001Tolerance00000002422.json'
import inSmallLineStringNoCommonPositions from '@test/geojson/in/smallLineStringNoCommonPositions.json'
import outSmallLineStringNoCommonPositionsFraction0Tolerance000000000005 from '@test/geojson/out/smallLineStringNoCommonPositionsFraction0Tolerance000000000005.json'
import outSmallLineStringNoCommonPositionsFraction05Tolerance0 from '@test/geojson/out/smallLineStringNoCommonPositionsFraction05Tolerance0.json'
import inSmallMultiLineStringNoCommonPositions from '@test/geojson/in/smallMultiLineStringNoCommonPositions.json'
import outSmallMultiLineStringNoCommonPositionsFraction0Tolerance000000000005 from '@test/geojson/out/smallMultiLineStringNoCommonPositionsFraction0Tolerance000000000005.json'
import outSmallMultiLineStringNoCommonPositionsFraction02Tolerance0 from '@test/geojson/out/smallMultiLineStringNoCommonPositionsFraction02Tolerance0.json'
import inSmallPolygonNoCommonPositions from '@test/geojson/in/smallPolygonNoCommonPositions.json'
import outSmallPolygonNoCommonPositionsFraction0Tolerance000000096 from '@test/geojson/out/smallPolygonNoCommonPositionsFraction0Tolerance000000096.json'
import outSmallPolygonNoCommonPositionsFraction075Tolerance0 from '@test/geojson/out/smallPolygonNoCommonPositionsFraction075Tolerance0.json'
import inSmallMultiPolygonNoCommonPositions from '@test/geojson/in/smallMultiPolygonNoCommonPositions.json'
import outSmallMultiPolygonNoCommonPositionsFraction0Tolerance000000037 from '@test/geojson/out/smallMultiPolygonNoCommonPositionsFraction0Tolerance000000037.json'
import outSmallMultiPolygonNoCommonPositionsFraction045Tolerance0 from '@test/geojson/out/smallMultiPolygonNoCommonPositionsFraction045Tolerance0.json'
import inSmallFeatureCollectionNoCommonPositions from '@test/geojson/in/smallFeatureCollectionNoCommonPositions.json'
import outSmallFeatureCollectionNoCommonPositionsFraction035Tolerance000000037 from '@test/geojson/out/smallFeatureCollectionNoCommonPositionsFraction035Tolerance000000037.json'

describe('simplify() - simplification by tolerance without common positions', () => {
  it('should remove all positions except points when provided tolerance is huge', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 1e6,
      }),
      outAllTypesNoCommonPositionsFraction1Tolerance1e6,
    )
  })

  it('should leave all positions when provided tolerance is tiny', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.00000002422,
      }),
      outAllTypesNoCommonPositionsLeaveAllPositionsFraction001Tolerance00000002422,
    )
  })

  it('should leave all positions when tolerance and fraction are not provided', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
      }),
      outAllTypesNoCommonPositionsLeaveAllPositionsFraction001Tolerance00000002422,
    )
  })

  it('should return indempotent result when provided same options twice', () => {
    const json = simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
      mutate: false,
      tolerance: 0.000000096,
    })
    assert.deepStrictEqual(
      simplify(json, {
        tolerance: 0.000000096,
      }),
      outSmallPolygonNoCommonPositionsFraction0Tolerance000000096,
    )
  })

  it('should correctly simplify small LineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000000005,
      }),
      outSmallLineStringNoCommonPositionsFraction0Tolerance000000000005,
    )
  })

  it('should correctly simplify small MultiLineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000000005,
      }),
      outSmallMultiLineStringNoCommonPositionsFraction0Tolerance000000000005,
    )
  })

  it('should correctly simplify small Polygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000096,
      }),
      outSmallPolygonNoCommonPositionsFraction0Tolerance000000096,
    )
  })

  it('should correctly simplify small MultiPolygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000037,
      }),
      outSmallMultiPolygonNoCommonPositionsFraction0Tolerance000000037,
    )
  })

  it('should correctly simplify small FeatureCollection', () => {
    assert.deepStrictEqual(
      simplify(inSmallFeatureCollectionNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000037,
      }),
      outSmallFeatureCollectionNoCommonPositionsFraction035Tolerance000000037,
    )
  })
})

describe('simplify() - simplification by fraction without common positions', () => {
  it('should remove all positions except points when provided fraction is 1', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 1,
      }),
      outAllTypesNoCommonPositionsFraction1Tolerance1e6,
    )
  })

  it('should leave all positions when provided fraction is tiny', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.001,
      }),
      outAllTypesNoCommonPositionsLeaveAllPositionsFraction001Tolerance00000002422,
    )
  })

  it('should not return indempotent result when provided same options twice', () => {
    const json = simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
      mutate: false,
      fraction: 0.5,
    })
    assert.deepStrictEqual(
      simplify(json, {
        fraction: 0.5,
      }),
      outSmallPolygonNoCommonPositionsFraction075Tolerance0,
    )
  })

  it('should correctly simplify small LineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.5,
      }),
      outSmallLineStringNoCommonPositionsFraction05Tolerance0,
    )
  })

  it('should correctly simplify small MultiLineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.2,
      }),
      outSmallMultiLineStringNoCommonPositionsFraction02Tolerance0,
    )
  })

  it('should correctly simplify small Polygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.75,
      }),
      outSmallPolygonNoCommonPositionsFraction075Tolerance0,
    )
  })

  it('should correctly simplify small MultiPolygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.45,
      }),
      outSmallMultiPolygonNoCommonPositionsFraction045Tolerance0,
    )
  })

  it('should correctly simplify small FeatureCollection', () => {
    assert.deepStrictEqual(
      simplify(inSmallFeatureCollectionNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.35,
        tolerance: 0.000000037,
      }),
      outSmallFeatureCollectionNoCommonPositionsFraction035Tolerance000000037,
    )
  })
})
