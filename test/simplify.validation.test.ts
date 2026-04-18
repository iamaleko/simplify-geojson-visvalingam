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
