import {
  GeoJsonObject,
  Feature,
  FeatureCollection,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection,
} from 'geojson';

export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null;
}

export function isFeature(geojson: GeoJsonObject): geojson is Feature {
  return isObject(geojson) && geojson?.type === "Feature";
}

export function isFeatureCollection(geojson: GeoJsonObject): geojson is FeatureCollection {
  return isObject(geojson) && geojson?.type === "FeatureCollection";
}

export function isPoint(geojson: GeoJsonObject): geojson is Point {
  return isObject(geojson) && geojson?.type === "Point";
}

export function isMultiPoint(geojson: GeoJsonObject): geojson is MultiPoint {
  return isObject(geojson) && geojson?.type === "MultiPoint";
}

export function isLineString(geojson: GeoJsonObject): geojson is LineString {
  return isObject(geojson) && geojson?.type === "LineString";
}

export function isMultiLineString(geojson: GeoJsonObject): geojson is MultiLineString {
  return isObject(geojson) && geojson?.type === "MultiLineString";
}

export function isPolygon(geojson: GeoJsonObject): geojson is Polygon {
  return isObject(geojson) && geojson?.type === "Polygon";
}

export function isMultiPolygon(geojson: GeoJsonObject): geojson is MultiPolygon {
  return isObject(geojson) && geojson?.type === "MultiPolygon";
}

export function isGeometryCollection(geojson: GeoJsonObject): geojson is GeometryCollection {
  return isObject(geojson) && geojson?.type === "GeometryCollection";
}