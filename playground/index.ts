import simplify from '@src/index'
// import simplify from '../dist';
import { GeoJsonObject } from 'geojson'

import inLineString11pGeoJson from '@test/geojson/in/LineString11p.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inLineString11pGeoJson as GeoJsonObject, {
        tolerance: 0.00000000001,
      }),
    ),
  )
}

import inMultiLineString23pGeoJson from '@test/geojson/in/MultiLineString23p.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inMultiLineString23pGeoJson as GeoJsonObject, {
        tolerance: 0.00000000002,
      }),
    ),
  )
}

import inMultiPolygon44pGeoJson from '@test/geojson/in/MultiPolygon44p.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inMultiPolygon44pGeoJson as GeoJsonObject, {
        // tolerance: 0.00000003,
        // tolerance: 0.00000004, // so-so
        tolerance: 0.00000008,
      }),
    ),
  )
}
