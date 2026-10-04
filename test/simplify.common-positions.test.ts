import assert from 'assert'
import simplify from '@src/index'
import { FeatureCollection, GeoJsonObject } from 'geojson'

import inAllTypesWithCommonPositions from '@test/geojson/in/allTypesWithCommonPositions.json'
import outAllTypesWithCommonPositionsFraction1Tolerance1e6 from '@test/geojson/out/allTypesWithCommonPositionsFraction1Tolerance1e6.json'
import inSmallMultiLineStringWithCommonPositions from '@test/geojson/in/smallMultiLineStringWithCommonPositions.json'
import outSmallMultiLineStringWithCommonPositionsFraction0Tolerance000000000005 from '@test/geojson/out/smallMultiLineStringWithCommonPositionsFraction0Tolerance000000000005.json'
import outSmallMultiLineStringWithCommonPositionsFraction03Tolerance0 from '@test/geojson/out/smallMultiLineStringWithCommonPositionsFraction03Tolerance0.json'
import inSmallMultiPolygonWithCommonPositions from '@test/geojson/in/smallMultiPolygonWithCommonPositions.json'
import outSmallMultiPolygonWithCommonPositionsFraction0Tolerance000000014 from '@test/geojson/out/smallMultiPolygonWithCommonPositionsFraction0Tolerance000000014.json'
import outSmallMultiPolygonWithCommonPositionsFraction03Tolerance0 from '@test/geojson/out/smallMultiPolygonWithCommonPositionsFraction03Tolerance0.json'
import inMultiPolygonSharedFirstCollectedPosition from '@test/geojson/in/multiPolygonSharedFirstCollectedPosition.json'
import outMultiPolygonSharedFirstCollectedPositionFraction07Tolerance0 from '@test/geojson/out/multiPolygonSharedFirstCollectedPositionFraction07Tolerance0.json'
import inRegionalMosaicWithInteriorAndJunctionLakes from '@test/geojson/in/regionalMosaicWithInteriorAndJunctionLakes.json'
import outRegionalMosaicWithInteriorAndJunctionLakesFraction05Tolerance0 from '@test/geojson/out/regionalMosaicWithInteriorAndJunctionLakesFraction05Tolerance0.json'

function sharedEdgeNeighbors(collection: FeatureCollection, polygonIndex: number): number[] {
  const edges = collection.features.map((feature) => {
    if (feature.geometry?.type !== 'Polygon') throw new Error('Expected Polygon')
    const edgeKeys = new Set<string>()
    for (const ring of feature.geometry.coordinates) {
      for (let index = 0; index < ring.length - 1; index++) {
        const from = JSON.stringify(ring[index])
        const to = JSON.stringify(ring[index + 1])
        edgeKeys.add(from < to ? `${from}|${to}` : `${to}|${from}`)
      }
    }
    return edgeKeys
  })
  return edges.flatMap((otherEdges, index) =>
    index !== polygonIndex && [...edges[polygonIndex]].some((edge) => otherEdges.has(edge)) ? [index] : [],
  )
}

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
  it('should simplify the regional mosaic to the expected output', () => {
    assert.deepStrictEqual(
      simplify(inRegionalMosaicWithInteriorAndJunctionLakes as GeoJsonObject, { mutate: false, fraction: 0.5 }),
      outRegionalMosaicWithInteriorAndJunctionLakesFraction05Tolerance0,
    )
  })

  it('should preserve shared borders between a region, four neighbors, and the junction lake', () => {
    const input = inRegionalMosaicWithInteriorAndJunctionLakes as FeatureCollection
    const result = simplify(input, { mutate: false, fraction: 0.5 }) as FeatureCollection

    assert.deepStrictEqual(sharedEdgeNeighbors(result, 5), [1, 4, 6, 9, 17])
  })

  it('should preserve both lakes and their shared shorelines', () => {
    const input = inRegionalMosaicWithInteriorAndJunctionLakes as FeatureCollection
    const result = simplify(input, { mutate: false, fraction: 0.5 }) as FeatureCollection
    const interiorRegion = result.features[0].geometry

    assert.strictEqual(interiorRegion?.type, 'Polygon')
    if (interiorRegion?.type !== 'Polygon') throw new Error('Expected Polygon')
    assert.strictEqual(interiorRegion.coordinates.length, 2)
    assert.deepStrictEqual(sharedEdgeNeighbors(result, 16), [0])
    assert.deepStrictEqual(sharedEdgeNeighbors(result, 17), [5, 6, 9, 10])
  })

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

  it('should remove all shared candidate positions even when the first collected position belongs to the shared group', () => {
    assert.deepStrictEqual(
      simplify(inMultiPolygonSharedFirstCollectedPosition as GeoJsonObject, {
        mutate: false,
        fraction: 0.7,
      }),
      outMultiPolygonSharedFirstCollectedPositionFraction07Tolerance0,
    )
  })
})
