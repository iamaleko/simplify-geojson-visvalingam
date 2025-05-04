import assert from 'assert'
import simplify from '@src/index'
import {
  GeoJsonObject,
  Feature,
  FeatureCollection,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
  GeometryCollection,
} from 'geojson'

import inMinimalFeature from '@test/geojson/in/minimalFeature.json'
import inMinimalFeatureCollection from '@test/geojson/in/minimalFeatureCollection.json'
import inMinimalPoint from '@test/geojson/in/minimalPoint.json'
import inMinimalMultiPoint from '@test/geojson/in/minimalMultiPoint.json'
import inMinimalLineString from '@test/geojson/in/minimalLineString.json'
import inMinimalMultiLineString from '@test/geojson/in/minimalMultiLineString.json'
import inMinimalPolygon from '@test/geojson/in/minimalPolygon.json'
import inMinimalMultiPolygon from '@test/geojson/in/minimalMultiPolygon.json'
import inMinimalGeometryCollection from '@test/geojson/in/minimalGeometryCollection.json'

import inAllTypesNoCommonPositions from '@test/geojson/in/allTypesNoCommonPositions.json'
import outAllTypesNoCommonPositionsRemoveAllPositions from '@test/geojson/out/allTypesNoCommonPositionsRemoveAllPositions.json'
import outAllTypesNoCommonPositionsLeaveAllPositions from '@test/geojson/out/allTypesNoCommonPositionsLeaveAllPositions.json'
import inSmallLineStringNoCommonPositions from '@test/geojson/in/smallLineStringNoCommonPositions.json'
import outSmallLineStringNoCommonPositions from '@test/geojson/out/smallLineStringNoCommonPositions.json'
import inSmallMultiLineStringNoCommonPositions from '@test/geojson/in/smallMultiLineStringNoCommonPositions.json'
import outSmallMultiLineStringNoCommonPositions from '@test/geojson/out/smallMultiLineStringNoCommonPositions.json'
import inSmallPolygonNoCommonPositions from '@test/geojson/in/smallPolygonNoCommonPositions.json'
import outSmallPolygonNoCommonPositions from '@test/geojson/out/smallPolygonNoCommonPositions.json'
import inSmallMultiPolygonNoCommonPositions from '@test/geojson/in/smallMultiPolygonNoCommonPositions.json'
import outSmallMultiPolygonNoCommonPositions from '@test/geojson/out/smallMultiPolygonNoCommonPositions.json'
import inSmallFeatureCollectionNoCommonPositions from '@test/geojson/in/smallFeatureCollectionNoCommonPositions.json'
import outSmallFeatureCollectionNoCommonPositions from '@test/geojson/out/smallFeatureCollectionNoCommonPositions.json'

import inAllTypesWithCommonPositions from '@test/geojson/in/allTypesWithCommonPositions.json'
import outAllTypesWithCommonPositionsRemoveAllPositions from '@test/geojson/out/allTypesWithCommonPositionsRemoveAllPositions.json'
import inSmallMultiLineStringWithCommonPositions from '@test/geojson/in/smallMultiLineStringWithCommonPositions.json'
import outSmallMultiLineStringWithCommonPositions from '@test/geojson/out/smallMultiLineStringWithCommonPositions.json'

describe('simplify() - provided GeoJSON validation', () => {
  it('should throw TypeError when provided GeoJSON is null', () => {
    assert.throws(
      () =>
        simplify(null as unknown as GeoJsonObject, {
          mutate: false,
          tolerance: 1,
        }),
      new TypeError(`Expected provided GeoJSON to be an object, but received null.`),
    )
  })

  it('should throw TypeError when provided GeoJSON is not an object', () => {
    assert.throws(
      () =>
        simplify(true as unknown as GeoJsonObject, {
          mutate: false,
          tolerance: 1,
        }),
      new TypeError(`Expected provided GeoJSON to be an object, but received boolean.`),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal Feature', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalFeature as Feature, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal FeatureCollection', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalFeatureCollection as FeatureCollection, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal Point', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalPoint as Point, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal MultiPoint', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalMultiPoint as MultiPoint, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal LineString', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalLineString as LineString, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal MultiLineString', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalMultiLineString as MultiLineString, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal Polygon', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalPolygon as Polygon, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal MultiPolygon', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalMultiPolygon as MultiPolygon, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid minimal GeometryCollection', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalGeometryCollection as GeometryCollection, {
        mutate: false,
        tolerance: 1,
      }),
    )
  })
})

describe('simplify() - provided options validation', () => {
  it('should throw Error when provided tolerance is not a number', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          tolerance: true as unknown as number,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received true.`),
    )
  })

  it('should throw Error when provided tolerance is less than 0', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          tolerance: -1,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received -1.`),
    )
  })

  it('should throw Error when provided tolerance is equal to 0', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          tolerance: 0,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received 0.`),
    )
  })

  it('should throw Error when provided tolerance is infinite', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          tolerance: Infinity,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received Infinity.`),
    )
  })

  it('should not throw when tolerance is not provided', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalFeature as Feature, {
        mutate: false,
      }),
    )
  })

  it('should not throw when provided mutate is not a boolean', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalFeature as Feature, {
        mutate: null as unknown as boolean,
        tolerance: 1,
      }),
    )
  })

  it('should not throw when mutate is not provided', () => {
    assert.doesNotThrow(() =>
      simplify(inMinimalFeature as Feature, {
        tolerance: 1,
      }),
    )
  })
})

describe('simplify() - simplification by tolerance without common positions', () => {
  it('should remove all positions except points when provided tolerance is huge', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 1e6,
      }),
      outAllTypesNoCommonPositionsRemoveAllPositions,
    )
  })

  it('should leave all positions when provided tolerance is tiny', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.00000002422,
      }),
      outAllTypesNoCommonPositionsLeaveAllPositions,
    )
  })

  it('should leave all positions when tolerance is not provided', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
      }),
      outAllTypesNoCommonPositionsLeaveAllPositions,
    )
  })

  it('should return indempotent result when provided same options', () => {
    const json = simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
      mutate: false,
      tolerance: 0.000000096,
    })
    assert.deepStrictEqual(
      simplify(json, {
        tolerance: 0.000000096,
      }),
      outSmallPolygonNoCommonPositions,
    )
  })

  it('should correctly simplify small LineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000000005,
      }),
      outSmallLineStringNoCommonPositions,
    )
  })

  it('should correctly simplify small MultiLineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000000005,
      }),
      outSmallMultiLineStringNoCommonPositions,
    )
  })

  it('should correctly simplify small Polygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000096,
      }),
      outSmallPolygonNoCommonPositions,
    )
  })

  it('should correctly simplify small MultiPolygon', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000037,
      }),
      outSmallMultiPolygonNoCommonPositions,
    )
  })

  it('should correctly simplify small FeatureCollection', () => {
    assert.deepStrictEqual(
      simplify(inSmallFeatureCollectionNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000037,
      }),
      outSmallFeatureCollectionNoCommonPositions,
    )
  })
})

describe('simplify() - simplification by tolerance with common positions', () => {
  it('should remove all positions except common positions and points when provided tolerance is huge', () => {
    assert.deepStrictEqual(
      simplify(inAllTypesWithCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 1e6,
      }),
      outAllTypesWithCommonPositionsRemoveAllPositions,
    )
  })

  it('should correctly simplify small MultiLineString', () => {
    assert.deepStrictEqual(
      simplify(inSmallMultiLineStringWithCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000000005,
      }),
      outSmallMultiLineStringWithCommonPositions,
    )
  })
})
