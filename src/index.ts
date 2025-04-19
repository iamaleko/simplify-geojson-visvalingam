import { GeoJsonObject } from 'geojson'
import {
  isFeature,
  isFeatureCollection,
  isPoint,
  isMultiPoint,
  isLineString,
  isMultiLineString,
  isPolygon,
  isMultiPolygon,
  isGeometryCollection,
} from '@lib/typeGuards'

export default function simplify(geojson: GeoJsonObject): GeoJsonObject {
  if (
    isFeature(geojson) ||
    isFeatureCollection(geojson) ||
    isLineString(geojson) ||
    isMultiLineString(geojson) ||
    isPolygon(geojson) ||
    isMultiPolygon(geojson) ||
    isGeometryCollection(geojson)
  ) {
    // TODO
  } else if (isPoint(geojson) || isMultiPoint(geojson)) {
    // nothing to simplify
  } else {
    throw new TypeError(
      `Expected a GeoJsonObject, but received ${typeof geojson}.`,
    )
  }
  return geojson
}
