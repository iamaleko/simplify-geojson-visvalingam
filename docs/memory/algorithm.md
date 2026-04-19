# Library algorithm and logic

Related file: see `docs/memory/performance.md` for implementation constraints that preserve speed, memory behavior, heap maintenance strategy, and low-allocation processing.

## Target behavior

- Simplify GeoJSON with Visvalingam-Wyatt priority ordering.
- Prefer visually stable point removal based on local triangle area.
- Remove shared positions synchronously so neighboring geometries preserve common boundaries as long as possible.
- Preserve key geometry invariants while keeping the implementation performance-oriented.

## Scope

- Public entrypoint: `src/index.ts`
- Accepted simplifiable structures:
  - `Feature`
  - `FeatureCollection`
  - `GeometryCollection`
  - `LineString`
  - `MultiLineString`
  - `Polygon`
  - `MultiPolygon`
- `Point` and `MultiPoint` are valid inputs but do not contribute removable positions.
- `Feature` with `null` geometry passes through unchanged.
- Deep GeoJSON validation is intentionally out of scope. The library assumes valid 2D input shaped like `[x, y]`.
- Reason: simplification is optimized for throughput; deep validation would add extra passes and extra checks.

## Public API

```ts
simplify(geojson: GeoJsonObject, options?: SimplifyOptions): GeoJsonObject
```

### Options

- `tolerance`: minimum triangle area required to preserve a point
- `fraction`: fraction of collected positions to remove
- `mutate`: whether the input object may be modified in place

### Option semantics

- Internal defaults:
  - `tolerance = 0`
  - `fraction = 0`
  - `mutate = true`
- `mutate` defaults to `true` for performance. In-place mutation avoids the cost of `structuredClone`.
- If `tolerance === 0` and `fraction === 0`, the function returns the original object immediately.
- If `mutate === false`, the input is cloned before simplification.

### Validation

- Top-level input must be an object.
- `tolerance` must be a finite number greater than `0`.
- `fraction` must be a finite number greater than `0` and less than or equal to `1`.
- `mutate` is coerced through `!!options.mutate`; it is not strictly type-validated.

## Pipeline

1. Validate input and options.
2. Clone input if needed.
3. Collect all simplifiable positions into a flat indexed representation.
4. Group equal positions.
5. Delete positions in heap order.
6. Rewrite GeoJSON coordinate arrays from the deletion mask.

Code path:

```ts
collectPositions(...)
groupPositions(...)
deletePositions(...)
updatePositions(...)
```

Deletion is computed on a flat index space first and projected back into the original GeoJSON structure afterward.

If `collectPositions(...)` produces no removable positions, grouping, deletion, and reconstruction are skipped.

## Internal data model

### `Positions`

```ts
type Positions = {
  coordinates: Position[]
  nextIndexes: number[]
  prevIndexes: number[]
}
```

- `coordinates`: flat array of collected positions
- `prevIndexes`: previous position in the local chain
- `nextIndexes`: next position in the local chain

Rules:

- Line endpoints use `-1` and are therefore non-removable.
- Rings are stored without the duplicate closing coordinate.
- Ring neighbor links are cyclic.

### `Groups`

```ts
type Groups = {
  sortIndexes: Uint32Array
  groupedFrom: Uint32Array
  groupedTo: Uint32Array
}
```

- `sortIndexes`: position indexes sorted by `x`, then `y`
- `groupedFrom[i]`: start of the equal-coordinate group for position `i`
- `groupedTo[i]`: end of that group

`groupedFrom[i]` also acts as the canonical group identifier in later bookkeeping.

Reasons for coordinate sorting:

- adjacent equal coordinates allow grouping in one linear pass
- no hash map or other heavier structure is needed
- the same coordinate ordering is reused in `heapcompare(...)` as a tie-break for equal priorities
- tie-breaking by coordinates makes deletion order deterministic for equal triangle areas

## Simplification mechanics

### Priority

- `getPositionArea(i, positions)` computes the absolute triangle area of the current point and its two neighbors.
- Smaller area means lower significance and earlier deletion priority.

### Heap membership

Only positions with both neighbors enter the heap. This excludes:

- `LineString` endpoints
- endpoints of each line inside `MultiLineString`
- positions that have already lost a neighbor

### Main deletion loop

For each heap pop:

1. Skip if the position was already deleted indirectly.
2. Stop only when both conditions are true:
   - current minimum priority is at least `tolerance`
   - `toDelete <= 0`
3. Mark the popped position as a deletion candidate in its equal-coordinate group.
4. Do nothing until the whole group becomes candidate-marked.
5. Once the whole group is marked, delete that group synchronously.

### Single-position deletion

- mark `isDeleted`
- decrement `toDelete` by `1`
- relink neighbors in `prevIndexes` and `nextIndexes`
- recompute neighbor priorities
- update heap positions with `heapupdate(...)`

Entries deleted indirectly through synchronous group deletion are not eagerly removed from the heap. They are skipped later when popped.

This preserves standard Visvalingam-Wyatt re-prioritization after each deletion.

## Shared positions

Shared coordinates are not deleted independently.

Mechanism:

- sort all positions by coordinates
- form equal-coordinate groups
- mark candidates independently
- delete only when the whole group is ready

Effect:

- equal boundary points disappear synchronously
- neighboring geometries remain aligned for longer
- one geometry may still collapse under strong simplification, but shared boundaries do not drift before that happens due to asymmetric point removal

## Geometry behavior

If simplification removes all geometric content from part of the input, the library may leave an empty GeoJSON structure of the same overall kind instead of rewriting the object into a different top-level shape.

### `LineString`

- all coordinates are collected
- first and last points are non-removable

### `MultiLineString`

- each line is an independent chain
- all chains still share the same flat position array

### `Polygon`

- each ring contributes only unique vertices
- after reconstruction, a ring is either:
  - rebuilt with a closing coordinate
  - removed if fewer than three unique vertices remain
- if the exterior ring is removed, the polygon becomes empty

### `MultiPolygon`

- each polygon is reconstructed independently
- if one exterior ring disappears, only that polygon is removed

### `Feature` and `FeatureCollection`

- act as recursive containers
- overall GeoJSON structure is preserved
- a `Feature` remains present even if simplification empties its geometry content
- the library does not require empty results to be represented only through `Feature`; empty geometry-bearing structures may also remain in other valid GeoJSON shapes

### `GeometryCollection`

- simplified recursively
- only nested geometries with simplifiable coordinates contribute positions

## Ring semantics

- GeoJSON rings are closed by repeating the first coordinate.
- The working set stores only unique ring vertices.
- Closure is restored only during reconstruction.
- If a ring ends with fewer than three unique vertices, it is removed.
- If an exterior ring is removed:
  - `Polygon` becomes empty
  - `MultiPolygon` removes only the corresponding polygon

## `tolerance` vs `fraction`

### `tolerance`

- Lower bound on point significance.
- Simplification continues while the minimum heap priority is below the threshold.

### `fraction`

```ts
toDelete = Math.round(n * fraction)
```

- `n` is the number of collected positions.
- Simplification continues while `toDelete > 0`.
- Normal deletion decreases `toDelete` by `1`.
- Since `1.3.5`, deleting an entire triangular ring decreases `toDelete` by `3`.

### Combined behavior

- `tolerance` and `fraction` are conjunctive stop conditions.
- The algorithm stops only when both are satisfied.
- Result: combined mode may simplify more aggressively than either mode alone.

## Stability

- `heapcompare(...)` uses coordinates as a tie-break, so equal-priority deletions remain deterministic.
- `tolerance` is idempotent in the tested scenario.
- `fraction` is not generally idempotent:
  - each run recomputes `toDelete` from the current number of positions
  - local priorities also change after previous deletions

## Verified invariants from tests

- top-level input must be an object or a `TypeError` is thrown
- `tolerance` and `fraction` must be positive finite numbers
- `fraction` cannot exceed `1`
- `mutate: false` returns a new object and leaves the input unchanged
- `mutate: true` returns the same object and simplifies it in place
- without `tolerance` and `fraction`, the original object is returned unchanged
- `LineString` endpoints are preserved
- simplified rings remain closed
- simplified rings are not left with fewer than four GeoJSON coordinates
- interior rings may disappear
- polygon exterior rings may disappear
- shared boundaries are simplified synchronously while linked geometries still exist

## Maintenance rule

When algorithm behavior changes, update these together:

- tests and expected fixtures
- `README.md` if public guarantees change
- this file if internal mechanics, invariants, or `tolerance` / `fraction` semantics change
- `docs/memory/performance.md` if the change also affects hot-path structure, heap logic, allocation behavior, or performance rationale
