import simplify from '@src/index'
// import simplify from '../dist';
import { GeoJsonObject } from 'geojson'

import inLineString11p0000000000045163tGeoJson from '@test/geojson/in/LineString11p0000000000045163t.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inLineString11p0000000000045163tGeoJson as GeoJsonObject, {
        tolerance: 0.00000000001,
      }),
    ),
  )
}

import inMultiLineString23p0000000000045163tGeoJson from '@test/geojson/in/MultiLineString23p0000000000045163t.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inMultiLineString23p0000000000045163tGeoJson as GeoJsonObject, {
        tolerance: 0.00000000002,
      }),
    ),
  )
}
