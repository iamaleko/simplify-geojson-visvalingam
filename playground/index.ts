import simplify from '@src/index'
// import simplify from '../dist';
import { GeoJsonObject } from 'geojson'

import inAllTypesNoCommonPositions from '@test/geojson/in/allTypesNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inAllTypesNoCommonPositions as GeoJsonObject, {
        mutate: false,
        // tolerance: 1e6,
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
        mutate: false,
        // tolerance: 0.000000000004, // leave all
        tolerance: 0.000000000005, // remove part
        // tolerance: 0.000000000542, // remove all except starting points
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.5, // remove half
      }),
    ),
  )
}

import inSmallMultiLineStringNoCommonPositions from '@test/geojson/in/smallMultiLineStringNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        // tolerance: 0.000000000004, // leave all
        tolerance: 0.000000000005, // remove part
        // tolerance: 0.000000000542, // remove all except starting points
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiLineStringNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.2, // remove part
      }),
    ),
  )
}

import inSmallPolygonNoCommonPositions from '@test/geojson/in/smallPolygonNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        // tolerance: 0.000000031, // leave all
        tolerance: 0.000000096, // remove part
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.5, // remove half
      }),
    ),
  )
}

import inSmallMultiPolygonNoCommonPositions from '@test/geojson/in/smallMultiPolygonNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000037, // remove part
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiPolygonNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.45, // remove part
      }),
    ),
  )
}

import inSmallFeatureCollectionNoCommonPositions from '@test/geojson/in/smallFeatureCollectionNoCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallFeatureCollectionNoCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000037, // remove part
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallFeatureCollectionNoCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.1,
        tolerance: 0.000000037, // remove part
      }),
    ),
  )
}

import inAllTypesWithCommonPositions from '@test/geojson/in/allTypesWithCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inAllTypesWithCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 1e6,
        // tolerance: 0.00000002422,
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inAllTypesWithCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 1,
      }),
    ),
  )
}

import inSmallMultiLineStringWithCommonPositions from '@test/geojson/in/smallMultiLineStringWithCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiLineStringWithCommonPositions as GeoJsonObject, {
        mutate: false,
        // tolerance: 0.000000000004, // leave all
        tolerance: 0.000000000005, // remove part
        // tolerance: 0.000000000542, // remove all except starting points and common positions
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiLineStringWithCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.3, // remove part
      }),
    ),
  )
}

import inSmallMultiPolygonWithCommonPositions from '@test/geojson/in/smallMultiPolygonWithCommonPositions.json'
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiPolygonWithCommonPositions as GeoJsonObject, {
        mutate: false,
        tolerance: 0.000000014, // remove part
      }),
    ),
  )
}
if (0) {
  console.log(
    JSON.stringify(
      simplify(inSmallMultiPolygonWithCommonPositions as GeoJsonObject, {
        mutate: false,
        fraction: 0.3, // remove part
      }),
    ),
  )
}
