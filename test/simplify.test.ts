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

import inAllTypesWithCommonPositions from '@test/geojson/in/allTypesWithCommonPositions.json'
import outAllTypesWithCommonPositionsFraction1Tolerance1e6 from '@test/geojson/out/allTypesWithCommonPositionsFraction1Tolerance1e6.json'

import inSmallMultiLineStringWithCommonPositions from '@test/geojson/in/smallMultiLineStringWithCommonPositions.json'
import outSmallMultiLineStringWithCommonPositionsFraction0Tolerance000000000005 from '@test/geojson/out/smallMultiLineStringWithCommonPositionsFraction0Tolerance000000000005.json'
import outSmallMultiLineStringWithCommonPositionsFraction03Tolerance0 from '@test/geojson/out/smallMultiLineStringWithCommonPositionsFraction03Tolerance0.json'

import inSmallMultiPolygonWithCommonPositions from '@test/geojson/in/smallMultiPolygonWithCommonPositions.json'
import outSmallMultiPolygonWithCommonPositionsFraction0Tolerance000000014 from '@test/geojson/out/smallMultiPolygonWithCommonPositionsFraction0Tolerance000000014.json'
import outSmallMultiPolygonWithCommonPositionsFraction03Tolerance0 from '@test/geojson/out/smallMultiPolygonWithCommonPositionsFraction03Tolerance0.json'

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

  it('should throw Error when provided fraction is not a number', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          fraction: true as unknown as number,
        }),
      new Error(`Expected provided fraction to be a finite positive number, but received true.`),
    )
  })

  it('should throw Error when provided fraction is less than 0', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          fraction: -1,
        }),
      new Error(`Expected provided fraction to be a finite positive number, but received -1.`),
    )
  })

  it('should throw Error when provided fraction is greater than 1', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          fraction: 1.1,
        }),
      new Error(`Expected provided fraction to be less or equal to 1, but received 1.1.`),
    )
  })

  it('should throw Error when provided fraction is equal to 0', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          fraction: 0,
        }),
      new Error(`Expected provided fraction to be a finite positive number, but received 0.`),
    )
  })

  it('should throw Error when provided fraction is infinite', () => {
    assert.throws(
      () =>
        simplify(inMinimalFeature as Feature, {
          mutate: false,
          fraction: Infinity,
        }),
      new Error(`Expected provided fraction to be a finite positive number, but received Infinity.`),
    )
  })

  it('should not throw when tolerance and/or fraction is not provided', () => {
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
