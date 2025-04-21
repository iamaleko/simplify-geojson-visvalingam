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

import inFeature0pGeoJson from '@test/geojson/in/Feature0p.json'
import inFeatureCollection0pGeoJson from '@test/geojson/in/FeatureCollection0p.json'
import inPoint0pGeoJson from '@test/geojson/in/Point0p.json'
import inMultiPoint0pGeoJson from '@test/geojson/in/MultiPoint0p.json'
import inLineString0pGeoJson from '@test/geojson/in/LineString0p.json'
import inMultiLineString0pGeoJson from '@test/geojson/in/MultiLineString0p.json'
import inPolygon0pGeoJson from '@test/geojson/in/Polygon0p.json'
import inMultiPolygon0pGeoJson from '@test/geojson/in/MultiPolygon0p.json'
import inGeometryCollection0pGeoJson from '@test/geojson/in/GeometryCollection0p.json'

import inLineString11p0000000000045163tGeoJson from '@test/geojson/in/LineString11p0000000000045163t.json'
import outLineString6p0000000000361309tGeoJson from '@test/geojson/out/LineString6p0000000000361309t.json'

import inMultiLineString23p0000000000045163tGeoJson from '@test/geojson/in/MultiLineString23p0000000000045163t.json'
import outMultyLineString11p0000000000270982tGeoJson from '@test/geojson/out/MultyLineString11p0000000000270982t.json'

describe('simplify() - provided GeoJSON validation', () => {
  it('should throw TypeError when provided GeoJSON is null', () => {
    assert.throws(
      () =>
        simplify(null as unknown as GeoJsonObject, {
          mutate: false,
          tolerance: 0.0000000000001,
        }),
      new TypeError(`Expected provided GeoJSON to be an object, but received null.`),
    )
  })

  it('should throw TypeError when provided GeoJSON is not an object', () => {
    assert.throws(
      () =>
        simplify(true as unknown as GeoJsonObject, {
          mutate: false,
          tolerance: 0.0000000000001,
        }),
      new TypeError(`Expected provided GeoJSON to be an object, but received boolean.`),
    )
  })

  it('should not throw when provided GeoJSON is a valid Feature', () => {
    assert.doesNotThrow(() =>
      simplify(inFeature0pGeoJson as Feature, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid FeatureCollection', () => {
    assert.doesNotThrow(() =>
      simplify(inFeatureCollection0pGeoJson as FeatureCollection, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid Point', () => {
    assert.doesNotThrow(() =>
      simplify(inPoint0pGeoJson as Point, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid MultiPoint', () => {
    assert.doesNotThrow(() =>
      simplify(inMultiPoint0pGeoJson as MultiPoint, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid LineString', () => {
    assert.doesNotThrow(() =>
      simplify(inLineString0pGeoJson as LineString, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid MultiLineString', () => {
    assert.doesNotThrow(() =>
      simplify(inMultiLineString0pGeoJson as MultiLineString, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid Polygon', () => {
    assert.doesNotThrow(() =>
      simplify(inPolygon0pGeoJson as Polygon, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid MultiPolygon', () => {
    assert.doesNotThrow(() =>
      simplify(inMultiPolygon0pGeoJson as MultiPolygon, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })

  it('should not throw when provided GeoJSON is a valid GeometryCollection', () => {
    assert.doesNotThrow(() =>
      simplify(inGeometryCollection0pGeoJson as GeometryCollection, {
        mutate: false,
        tolerance: 0.0000000000001,
      }),
    )
  })
})

describe('simplify() - provided options validation', () => {
  it('should throw Error when provided tolerance is not a number', () => {
    assert.throws(
      () =>
        simplify(inFeature0pGeoJson as GeoJsonObject, {
          mutate: false,
          tolerance: true as unknown as number,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received true.`),
    )
  })

  it('should throw Error when provided tolerance is less than 0', () => {
    assert.throws(
      () =>
        simplify(inFeature0pGeoJson as GeoJsonObject, {
          mutate: false,
          tolerance: -1,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received -1.`),
    )
  })

  it('should throw Error when provided tolerance is equal to 0', () => {
    assert.throws(
      () =>
        simplify(inFeature0pGeoJson as GeoJsonObject, {
          mutate: false,
          tolerance: 0,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received 0.`),
    )
  })

  it('should throw Error when provided tolerance is infinite', () => {
    assert.throws(
      () =>
        simplify(inFeature0pGeoJson as GeoJsonObject, {
          mutate: false,
          tolerance: Infinity,
        }),
      new Error(`Expected provided tolerance to be a finite positive number, but received Infinity.`),
    )
  })
})

describe('simplify() - basic simplification', () => {
  it('should correctly simplify LineString', () => {
    assert.deepStrictEqual(
      simplify(inLineString11p0000000000045163tGeoJson as GeoJsonObject, {
        mutate: false,
        tolerance: 0.00000000001,
      }),
      outLineString6p0000000000361309tGeoJson,
    )
  })

  it('should correctly simplify MultiLineString', () => {
    assert.deepStrictEqual(
      simplify(inMultiLineString23p0000000000045163tGeoJson as GeoJsonObject, {
        mutate: false,
        tolerance: 0.00000000002,
      }),
      outMultyLineString11p0000000000270982tGeoJson,
    )
  })
})
