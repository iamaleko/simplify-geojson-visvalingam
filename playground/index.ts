import simplify from '@src/index'
import { GeoJsonObject } from 'geojson'

/**
 * LineString, 10 meters between 11 points, tolerance 0.0000000000045163
 */
import validLineString11x10mGeoJson from '@test/geojson/validLineString11x10m.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(validLineString11x10mGeoJson as GeoJsonObject, {
        // mutate: true,
        // tolerance: 0.0000000000045163, // leave all points
        // tolerance: 0.00000000001, // leave one point out of two
        // tolerance: 0.00000000002, // leave one point out of three
        // tolerance: 0.00000000003, // leave one point out of four
        // tolerance: 0.00000000005, // leave one point out of five
        // tolerance: 1, // remove all points except first and last
      }),
    ),
  )
}

/**
 * Polygon without interior rings, 10 meters between 1000 points, tolerance 0.0000000000045163
 */
import validPolygon1000x10mGeoJson from '@test/geojson/validPolygon1000x10m.json'
if (1) {
  console.log(
    JSON.stringify(
      simplify(validPolygon1000x10mGeoJson as GeoJsonObject, {
        // mutate: true,
        // tolerance: 0.0000000000045163, // leave all points
        // tolerance: 0.00000000001, // leave one point out of two
        // tolerance: 0.00000000002, // leave one point out of three
        // tolerance: 0.00000000003, // leave one point out of four
        // tolerance: 0.00000000005, // leave one point out of five
        tolerance: 0.0000001, // leave 50 points
        // tolerance: 1, // remove all points
      }),
    ),
  )
}
