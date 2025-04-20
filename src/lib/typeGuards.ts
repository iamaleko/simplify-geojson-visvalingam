import {
  GeoJsonObject,
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection,
} from 'geojson'

export type FinitePositiveNumber = number & { readonly __type: unique symbol }

export function isFinitePositiveNumber(value: number): value is FinitePositiveNumber {
  return value != null && Number.isFinite(value) && value > 0
}

export function isObject(value: object): value is object {
  return typeof value === 'object' && value !== null
}

export function isFeature(value: GeoJsonObject): value is Feature {
  return isObject(value) && value?.type === 'Feature'
}

export function isFeatureCollection(value: GeoJsonObject): value is FeatureCollection {
  return isObject(value) && value?.type === 'FeatureCollection'
}

export function isLineString(value: GeoJsonObject): value is LineString {
  return isObject(value) && value?.type === 'LineString'
}

export function isMultiLineString(value: GeoJsonObject): value is MultiLineString {
  return isObject(value) && value?.type === 'MultiLineString'
}

export function isPolygon(value: GeoJsonObject): value is Polygon {
  return isObject(value) && value?.type === 'Polygon'
}

export function isMultiPolygon(value: GeoJsonObject): value is MultiPolygon {
  return isObject(value) && value?.type === 'MultiPolygon'
}

export function isGeometryCollection(value: GeoJsonObject): value is GeometryCollection {
  return isObject(value) && value?.type === 'GeometryCollection'
}
