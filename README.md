[![Version Badge][npm-img]][npm-url]

# simplify-geojson-visvalingam

[npm-img]: https://img.shields.io/npm/v/simplify-geojson-visvalingam.svg
[npm-url]: https://www.npmjs.com/package/simplify-geojson-visvalingam

Takes a [GeoJSON][1] object and returns a simplified version. Uses the [Visvalingam–Wyatt][2] algorithm with additional logic for stable simplification and preservation of common boundaries.

## Install
```
npm i --save simplify-geojson-visvalingam
```

## Parameters

*   `geojson` **[GeoJSON][1]** object to be simplified, should extends [GeoJsonObject][6] in TypeScript
*   `options` **[Object][3]** Optional parameters (optional, default `{}`), should be of type [SimplifyOptions][7] in TypeScript

    *   `options.tolerance` **[number][4]** simplification tolerance, the minimum Cartesian area of ​​a triangle formed by a point and its two neighbors to preserve that point (optional, default `0`)
    *   `options.fraction` **[number][4]** the fraction of all points to be removed (optional, default `0`)
    *   `options.mutate` **[boolean][5]** allows GeoJSON input to be mutated (optional, default `true`)

> `tolerance` and `fraction` can be used together to make the simplification satisfy both options, but if neither is provided, the `geojson` will remain unsimplified

## Features and limitations

* Provides stable simplification and a better level of visual detail than the [Ramer–Douglas–Peucker][8] algorithm
* Will remove common points of different geometries simultaneously to preserve common boundaries
* Will leave valid empty `Feature` objects even if all their geometry will be removed, the GeoJSON structure will remain intact
* The start and end point of the `LineString` objects will never be removed

## Usage
### JS
```javascript
import simplify from 'simplify-geojson-visvalingam'

// CommonJS
// const simplify = require('simplify-geojson-visvalingam').default

const geojson = {
  "type": "Polygon",
  "coordinates": [
    [
      [-70.603637, -33.399918],
      [-70.614624, -33.395332],
      [-70.639343, -33.392466],
      [-70.659942, -33.394759],
      [-70.683975, -33.404504],
      [-70.697021, -33.419406],
      [-70.701141, -33.434306],
      [-70.700454, -33.446339],
      [-70.694274, -33.458369],
      [-70.682601, -33.465816],
      [-70.668869, -33.472117],
      [-70.646209, -33.473835],
      [-70.624923, -33.472117],
      [-70.609817, -33.468107],
      [-70.595397, -33.458369],
      [-70.587158, -33.442901],
      [-70.587158, -33.426283],
      [-70.590591, -33.414248],
      [-70.594711, -33.406224],
      [-70.603637, -33.399918]
    ]
  ]
}
const options = {
  tolerance: 0.00008, // remove all points that form a triangle with a smaller Cartesian area
}
const result = simplify(geojson, options)
```
### TS
```typescript
import { type Polygon } from 'geojson'
import simplify, { type SimplifyOptions } from 'simplify-geojson-visvalingam'

const geojson: Polygon = {
  "type": "Polygon",
  "coordinates": [
    [
      [-70.603637, -33.399918],
      [-70.614624, -33.395332],
      [-70.639343, -33.392466],
      [-70.659942, -33.394759],
      [-70.683975, -33.404504],
      [-70.697021, -33.419406],
      [-70.701141, -33.434306],
      [-70.700454, -33.446339],
      [-70.694274, -33.458369],
      [-70.682601, -33.465816],
      [-70.668869, -33.472117],
      [-70.646209, -33.473835],
      [-70.624923, -33.472117],
      [-70.609817, -33.468107],
      [-70.595397, -33.458369],
      [-70.587158, -33.442901],
      [-70.587158, -33.426283],
      [-70.590591, -33.414248],
      [-70.594711, -33.406224],
      [-70.603637, -33.399918]
    ]
  ]
}
const options: SimplifyOptions  = {
  fraction: 0.5, // remove 50% of all points
}
const result = simplify(geojson, options)
```

[1]: https://tools.ietf.org/html/rfc7946#section-3

[2]: https://en.wikipedia.org/wiki/Visvalingam%E2%80%93Whyatt_algorithm

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[5]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[6]: https://www.npmjs.com/package/@types/geojson

[7]: https://github.com/iamaleko/simplify-geojson-visvalingam/blob/56aece32122cb38f2d1cfc2e23a2b366d1e8ae5b/src/index.ts#L15

[8]: https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
