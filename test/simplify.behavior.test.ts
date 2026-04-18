import assert from 'assert'
import simplify from '@src/index'
import { GeoJsonObject, Feature, LineString, MultiPolygon, Polygon, GeometryCollection } from 'geojson'

import inAllTypesNoCommonPositions from '@test/geojson/in/allTypesNoCommonPositions.json'
import outAllTypesNoCommonPositionsFraction1Tolerance1e6 from '@test/geojson/out/allTypesNoCommonPositionsFraction1Tolerance1e6.json'
import inSmallLineStringNoCommonPositions from '@test/geojson/in/smallLineStringNoCommonPositions.json'
import outSmallLineStringNoCommonPositionsFraction0Tolerance000000000005 from '@test/geojson/out/smallLineStringNoCommonPositionsFraction0Tolerance000000000005.json'
import outSmallLineStringNoCommonPositionsFraction05Tolerance0 from '@test/geojson/out/smallLineStringNoCommonPositionsFraction05Tolerance0.json'
import inSmallPolygonNoCommonPositions from '@test/geojson/in/smallPolygonNoCommonPositions.json'
import inFeatureSmallLineStringNoCommonPositions from '@test/geojson/in/featureSmallLineStringNoCommonPositions.json'
import outFeatureSmallLineStringNoCommonPositionsFraction0Tolerance000000000005 from '@test/geojson/out/featureSmallLineStringNoCommonPositionsFraction0Tolerance000000000005.json'
import inGeometryCollectionSmallLineStringAndMinimalPoint from '@test/geojson/in/geometryCollectionSmallLineStringAndMinimalPoint.json'
import outGeometryCollectionSmallLineStringAndMinimalPointFraction0Tolerance000000000005 from '@test/geojson/out/geometryCollectionSmallLineStringAndMinimalPointFraction0Tolerance000000000005.json'
import inPolygonWithSmallInteriorRing from '@test/geojson/in/polygonWithSmallInteriorRing.json'
import outPolygonWithSmallInteriorRingFraction0Tolerance1 from '@test/geojson/out/polygonWithSmallInteriorRingFraction0Tolerance1.json'
import inMultiPolygonWithSmallPolygon from '@test/geojson/in/multiPolygonWithSmallPolygon.json'
import outMultiPolygonWithSmallPolygonFraction0Tolerance1 from '@test/geojson/out/multiPolygonWithSmallPolygonFraction0Tolerance1.json'

function countPositions(geojson: GeoJsonObject): number {
  switch (geojson.type) {
    case 'Feature':
      return geojson.geometry ? countPositions(geojson.geometry) : 0
    case 'FeatureCollection':
      return geojson.features.reduce((sum, feature) => sum + countPositions(feature), 0)
    case 'GeometryCollection':
      return geojson.geometries.reduce((sum, geometry) => sum + countPositions(geometry), 0)
    case 'Point':
      return 1
    case 'MultiPoint':
    case 'LineString':
      return geojson.coordinates.length
    case 'MultiLineString':
    case 'Polygon':
      return geojson.coordinates.reduce((sum, coordinates) => sum + coordinates.length, 0)
    case 'MultiPolygon':
      return geojson.coordinates.reduce(
        (sum, polygon) => sum + polygon.reduce((polygonSum, coordinates) => polygonSum + coordinates.length, 0),
        0,
      )
  }
}

describe('simplify() - mutation semantics', () => {
  it('should not mutate input and should return a new object when mutate is false', () => {
    const input = structuredClone(inSmallLineStringNoCommonPositions) as GeoJsonObject
    const snapshot = structuredClone(input)

    const result = simplify(input, {
      mutate: false,
      tolerance: 0.000000000005,
    })

    assert.notStrictEqual(result, input)
    assert.deepStrictEqual(input, snapshot)
    assert.deepStrictEqual(result, outSmallLineStringNoCommonPositionsFraction0Tolerance000000000005)
  })

  it('should mutate input and return the same object when mutate is true', () => {
    const input = structuredClone(inSmallLineStringNoCommonPositions) as GeoJsonObject

    const result = simplify(input, {
      mutate: true,
      tolerance: 0.000000000005,
    })

    assert.strictEqual(result, input)
    assert.deepStrictEqual(input, outSmallLineStringNoCommonPositionsFraction0Tolerance000000000005)
  })

  it('should return the same object when simplification options are not provided', () => {
    const input = structuredClone(inSmallLineStringNoCommonPositions) as GeoJsonObject

    const result = simplify(input, {
      mutate: false,
    })

    assert.strictEqual(result, input)
    assert.deepStrictEqual(result, inSmallLineStringNoCommonPositions)
  })
})

describe('simplify() - recursive containers', () => {
  it('should simplify geometry inside Feature', () => {
    const input = structuredClone(inFeatureSmallLineStringNoCommonPositions) as Feature

    const result = simplify(input, {
      mutate: false,
      tolerance: 0.000000000005,
    })

    assert.deepStrictEqual(result, outFeatureSmallLineStringNoCommonPositionsFraction0Tolerance000000000005)
  })

  it('should simplify nested geometries inside GeometryCollection', () => {
    const input = structuredClone(inGeometryCollectionSmallLineStringAndMinimalPoint) as GeometryCollection

    const result = simplify(input, {
      mutate: false,
      tolerance: 0.000000000005,
    })

    assert.deepStrictEqual(result, outGeometryCollectionSmallLineStringAndMinimalPointFraction0Tolerance000000000005)
  })
})

describe('simplify() - geometry invariants', () => {
  it('should preserve first and last positions of LineString', () => {
    const input = structuredClone(inSmallLineStringNoCommonPositions) as LineString

    const result = simplify(input, {
      mutate: false,
      fraction: 1,
    }) as LineString

    assert.deepStrictEqual(result.coordinates[0], input.coordinates[0])
    assert.deepStrictEqual(
      result.coordinates[result.coordinates.length - 1],
      input.coordinates[input.coordinates.length - 1],
    )
  })

  it('should keep simplified polygon ring closed', () => {
    const result = simplify(structuredClone(inSmallPolygonNoCommonPositions) as Polygon, {
      mutate: false,
      tolerance: 0.000000096,
    }) as Polygon

    const ring = result.coordinates[0]
    assert.deepStrictEqual(ring[0], ring[ring.length - 1])
  })

  it('should keep simplified polygon ring valid with at least four positions', () => {
    const result = simplify(structuredClone(inSmallPolygonNoCommonPositions) as Polygon, {
      mutate: false,
      fraction: 0.75,
    }) as Polygon

    assert.ok(result.coordinates[0].length >= 4)
  })
})

describe('simplify() - polygon edge cases', () => {
  it('should remove an interior ring when it collapses under tolerance', () => {
    const input = structuredClone(inPolygonWithSmallInteriorRing) as Polygon

    const result = simplify(input, {
      mutate: false,
      tolerance: 1,
    }) as Polygon

    assert.deepStrictEqual(result, outPolygonWithSmallInteriorRingFraction0Tolerance1)
  })

  it('should keep a heavily simplified polygon in MultiPolygon valid', () => {
    const input = structuredClone(inMultiPolygonWithSmallPolygon) as MultiPolygon

    const result = simplify(input, {
      mutate: false,
      tolerance: 1,
    }) as MultiPolygon

    assert.deepStrictEqual(result, outMultiPolygonWithSmallPolygonFraction0Tolerance1)
  })
})

describe('simplify() - combined tolerance and fraction', () => {
  it('should follow tolerance when it requires more simplification than fraction', () => {
    const result = simplify(structuredClone(inAllTypesNoCommonPositions) as GeoJsonObject, {
      mutate: false,
      tolerance: 1e6,
      fraction: 0.001,
    })

    assert.deepStrictEqual(result, outAllTypesNoCommonPositionsFraction1Tolerance1e6)
  })

  it('should follow fraction when it requires more simplification than tolerance', () => {
    const result = simplify(structuredClone(inSmallLineStringNoCommonPositions) as GeoJsonObject, {
      mutate: false,
      tolerance: 0.000000000005,
      fraction: 0.5,
    })

    assert.deepStrictEqual(result, outSmallLineStringNoCommonPositionsFraction05Tolerance0)
  })

  it('should not leave more positions than each individual mode for intermediate values', () => {
    const toleranceOnly = simplify(structuredClone(inSmallPolygonNoCommonPositions) as GeoJsonObject, {
      mutate: false,
      tolerance: 0.000000096,
    })
    const fractionOnly = simplify(structuredClone(inSmallPolygonNoCommonPositions) as GeoJsonObject, {
      mutate: false,
      fraction: 0.5,
    })
    const combined = simplify(structuredClone(inSmallPolygonNoCommonPositions) as GeoJsonObject, {
      mutate: false,
      tolerance: 0.000000096,
      fraction: 0.5,
    })

    assert.ok(countPositions(combined) <= countPositions(toleranceOnly))
    assert.ok(countPositions(combined) <= countPositions(fractionOnly))
  })
})
