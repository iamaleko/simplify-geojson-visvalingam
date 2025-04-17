import assert from 'assert';
import simplify from '@src/index';
import invalidGeoJson from '@test/geojson/invalid.json';
import validFeatureGeoJson from '@test/geojson/validFeature.json';
import validFeatureCollectionGeoJson from '@test/geojson/validFeatureCollection.json';
import validPointGeoJson from '@test/geojson/validPoint.json';
import validMultiPointGeoJson from '@test/geojson/validMultiPoint.json';
import validLineStringGeoJson from '@test/geojson/validLineString.json';
import validMultiLineStringGeoJson from '@test/geojson/validMultiLineString.json';
import validPolygonGeoJson from '@test/geojson/validPolygon.json';
import validMultiPolygonGeoJson from '@test/geojson/validMultiPolygon.json';
import validGeometryCollectionGeoJson from '@test/geojson/validGeometryCollection.json';
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

  it('should throw TypeError when input is invalid GeoJSON', () => {
    assert.throws(() => simplify(invalidGeoJson as unknown as GeoJsonObject), TypeError);
  });

  it('should not throw when input is a valid Feature GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validFeatureGeoJson as Feature));
  });

  it('should not throw when input is a valid FeatureCollection GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validFeatureCollectionGeoJson as FeatureCollection));
  });

  it('should not throw when input is a valid Point GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validPointGeoJson as Point));
  });

  it('should not throw when input is a valid MultiPoint GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMultiPointGeoJson as MultiPoint));
  });


  it('should not throw when input is a valid LineString GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validLineStringGeoJson as LineString));
  });

  it('should not throw when input is a valid MultiLineString GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMultiLineStringGeoJson as MultiLineString));
  });

  it('should not throw when input is a valid Polygon GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validPolygonGeoJson as Polygon));
  });

  it('should not throw when input is a valid MultiPolygon GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validMultiPolygonGeoJson as MultiPolygon));
  });

  it('should not throw when input is a valid GeometryCollection GeoJSON', () => {
    assert.doesNotThrow(() => simplify(validGeometryCollectionGeoJson as GeometryCollection));
  });
});