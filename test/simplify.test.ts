import assert from 'assert';
import simplify from '@src/index';

import invalidTypeGeoJson from '@test/geojson/invalidType.json';

import validMinimalFeatureGeoJson from '@test/geojson/validMinimalFeature.json';
import validMinimalFeatureCollectionGeoJson from '@test/geojson/validMinimalFeatureCollection.json';
import validMinimalPointGeoJson from '@test/geojson/validMinimalPoint.json';
import validMinimalMultiPointGeoJson from '@test/geojson/validMinimalMultiPoint.json';
import validMinimalLineStringGeoJson from '@test/geojson/validMinimalLineString.json';
import validMinimalMultiLineStringGeoJson from '@test/geojson/validMinimalMultiLineString.json';
import validMinimalPolygonGeoJson from '@test/geojson/validMinimalPolygon.json';
import validMinimalMultiPolygonGeoJson from '@test/geojson/validMinimalMultiPolygon.json';
import validMinimalGeometryCollectionGeoJson from '@test/geojson/validMinimalGeometryCollection.json';

import {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson';

describe('simplify()', () => {
  it('should throw TypeError when input is null', () => {
    assert.throws(() => simplify(null as unknown as GeoJsonObject), TypeError);
  });

  it('should throw TypeError when input is not an object', () => {
    assert.throws(() => simplify(true as unknown as GeoJsonObject), TypeError);
  });

  it('should throw TypeError when input is GeoJSON with invalid type', () => {
    assert.throws(() => simplify(invalidTypeGeoJson as unknown as GeoJsonObject), TypeError);
  });

  it('should not throw when input is a valid Feature GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalFeatureGeoJson as Feature));
  });

  it('should not throw when input is a valid FeatureCollection GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalFeatureCollectionGeoJson as FeatureCollection));
  });

  it('should not throw when input is a valid Point GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalPointGeoJson as Point));
  });

  it('should not throw when input is a valid MultiPoint GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalMultiPointGeoJson as MultiPoint));
  });

  it('should not throw when input is a valid LineString GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalLineStringGeoJson as LineString));
  });

  it('should not throw when input is a valid MultiLineString GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalMultiLineStringGeoJson as MultiLineString));
  });

  it('should not throw when input is a valid Polygon GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalPolygonGeoJson as Polygon));
  });

  it('should not throw when input is a valid MultiPolygon GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalMultiPolygonGeoJson as MultiPolygon));
  });

  it('should not throw when input is a valid GeometryCollection GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMinimalGeometryCollectionGeoJson as GeometryCollection));
  });
});