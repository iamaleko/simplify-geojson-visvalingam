import simplify from '@src/index'
// import simplify from '../dist';
import { GeoJsonObject } from 'geojson'

import inAllTypesNoCommonPositionsRemoveAllPositions from '@test/geojson/in/allTypesNoCommonPositionsRemoveAllPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inAllTypesNoCommonPositionsRemoveAllPositions as GeoJsonObject, {
        tolerance: 1e6,
      }),
    ),
  )
}

import inAllTypesNoCommonPositionsLeaveAllPositions from '@test/geojson/in/allTypesNoCommonPositionsLeaveAllPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inAllTypesNoCommonPositionsLeaveAllPositions as GeoJsonObject, {
        tolerance: 0.00000002422,
      }),
    ),
  )
}

import inSmallLineStringNoCommonPositions from '@test/geojson/in/smallLineStringNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallLineStringNoCommonPositions as GeoJsonObject, {
        // tolerance: 0.000000000004, // leave all
        tolerance: 0.000000000005, // remove part
        // tolerance: 0.000000000542, // remove all except starting points
      }),
    ),
  )
}

import inSmallMultiLineStringNoCommonPositions from '@test/geojson/in/smallMultiLineStringNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiLineStringNoCommonPositions as GeoJsonObject, {
        // tolerance: 0.000000000004, // leave all
        tolerance: 0.000000000005, // remove part
        // tolerance: 0.000000000542, // remove all except starting points
      }),
    ),
  )
}

import inSmallPolygonNoCommonPositions from '@test/geojson/in/smallPolygonNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
        // tolerance: 0.000000031, // leave all
        tolerance: 0.000000096, // remove part
      }),
    ),
  )
}

import inSmallMultiPolygonNoCommonPositions from '@test/geojson/in/smallMultiPolygonNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiPolygonNoCommonPositions as GeoJsonObject, {
        tolerance: 0.000000037, // remove part
      }),
    ),
  )
}

import inSmallFeatureCollectionNoCommonPositions from '@test/geojson/in/smallFeatureCollectionNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallFeatureCollectionNoCommonPositions as GeoJsonObject, {
        tolerance: 0.000000037, // remove part
      }),
    ),
  )
}

import inSmallMultiLineStringWithCommonPositions from '@test/geojson/in/smallMultiLineStringWithCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiLineStringWithCommonPositions as GeoJsonObject, {
        // tolerance: 0.000000000004, // leave all
        tolerance: 0.000000000005, // remove part
        // tolerance: 0.000000000542, // remove all except starting points and common positions
      }),
    ),
  )
}
