# Library algorithm

Implementation: `src/index.ts`, `src/lib/functions.ts`, and `src/lib/typeGuards.ts`. Performance constraints are documented in `docs/memory/performance.md`.

## Scope

The library simplifies valid two-dimensional GeoJSON using Visvalingam-style local triangle-area priorities and equal-coordinate groups. Coordinates are interpreted as Cartesian `[x, y]` values.

- `LineString`, `MultiLineString`, `Polygon`, and `MultiPolygon` contribute positions.
- `Feature`, `FeatureCollection`, and `GeometryCollection` are traversed recursively.
- `Point`, `MultiPoint`, and null feature geometries contribute no positions.
- Coordinate validity, ring validity, and geometric topology are input assumptions; they are not deeply validated.

## Public API

```ts
simplify(geojson: GeoJsonObject, options?: SimplifyOptions): GeoJsonObject
```

| Option      | Internal default | Meaning and validation                                                                                                           |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `tolerance` | `0`              | Triangle-area threshold; an explicitly supplied value must be finite and greater than `0`                                        |
| `fraction`  | `0`              | Target fraction of collected positions to delete; an explicitly supplied value must be finite, greater than `0`, and at most `1` |
| `mutate`    | `true`           | Controls in-place modification; an explicitly supplied value is coerced with `!!`                                                |

The top-level input must be a non-null object; otherwise a `TypeError` is thrown. Invalid numeric options throw an `Error`.

After validation, if both simplification parameters retain their default values, the original object is returned immediately, including when `mutate` is false. Otherwise, `mutate: false` clones the input with `structuredClone` before traversal; `mutate: true` operates on the original object.

## Pipeline

1. Validate input and options; handle the no-op return.
2. Clone the input if requested.
3. Collect positions and chain topology with `collectPositions(...)`.
4. Build equal-coordinate groups with `groupPositions(...)`.
5. Produce a deletion mask with `deletePositions(...)`.
6. Compact GeoJSON coordinate arrays with `updatePositions(...)`.

Grouping, deletion, and reconstruction are skipped when no positions were collected. The collected count includes line endpoints even though they cannot be deleted.

Collection and deletion operate across the entire input tree. Each line or ring retains its own neighbor chain, while equal-coordinate groups can connect positions from different chains. Coordinate arrays are compacted only after deletion decisions are complete, so working indexes remain stable throughout simplification.

## Position topology

```ts
type Positions = {
  coordinates: Position[]
  nextIndexes: number[]
  prevIndexes: number[]
}
```

- `coordinates` contains references to coordinate arrays in traversal order.
- `prevIndexes` and `nextIndexes` identify adjacent positions in the same line or ring.
- Lines contribute every position. Their first and last positions have a missing neighbor encoded as `-1` and are non-removable.
- Rings contribute every position except the final closing position. Their neighbor indexes form a cycle.
- Collection does not deduplicate repeated coordinates inside a line or ring.

## Equal-coordinate groups

```ts
type Groups = {
  groupOf: Uint32Array
  groupSize: Uint32Array
  nextInGroup: Uint32Array
}
```

For `n` collected positions:

- `groupOf[i]` is the first input index with the same `x` and `y` as position `i`.
- `groupSize[groupId]` is the number of positions in that group; only group-root entries are used.
- `nextInGroup[i]` is the next member in input order, or `n` at the end of the group.
- Member links strictly increase until the sentinel. Group membership remains fixed during deletion.

`groupPositions(...)` builds the groups in one input-order pass. Its map is keyed by `x`:

- For one distinct `y`, the value is the group-root index.
- When a second distinct `y` appears, the value becomes a map from `y` to group-root index.
- Further positions reuse an existing root or create a root at their own index.

The temporary `groupTail` array supports appending members. Only `groupOf`, `groupSize`, and `nextInGroup` are returned.

For example, positions `[[5, 3], [1, 1], [5, 2], [5, 3]]` produce `groupOf = [0, 1, 2, 0]`. Group `0` contains members `0` and `3`, linked as `0 -> 3 -> 4`, where `4` is the position-count sentinel. The positions with `x = 5` and different `y` values remain in separate groups.

Grouping spans all collected geometries. A line endpoint in a group prevents that group from becoming fully candidate-marked. The data model does not distinguish repeated positions within one geometry from shared positions across geometries.

## Priority and heap

`getPositionArea(...)` computes the absolute Cartesian area of the triangle formed by a position and its two current neighbors. Smaller areas have higher deletion priority.

The heap initially contains every position with both neighbors. `heapcompare(...)` orders entries by area, then `x`, then `y`. Equal areas and coordinates compare equal; input order and heap operations determine their processing order. The same input order and options produce deterministic processing.

Heap state consists of a one-indexed `heap` array, its active size in `heap[0]`, a `heapRev` position-to-slot mapping, and per-position `priority` values. Initial construction uses `heapify(...)`. After an ordinary deletion changes local topology, `heapupdate(...)` repairs affected neighbor entries using their recalculated areas.

## Candidate accounting and deletion

Deletion state consists of:

- `isDeleted[i]`: whether position `i` has been removed.
- `isCandidate[i]`: whether position `i` has been marked for deletion consideration.
- `candidatesByGroup[groupId]`: number of marked positions in that group.
- `toDelete = Math.round(n * fraction)`: remaining deletion budget.

Candidate marks persist. Each position contributes to its group counter at most once.

Candidate and deleted are different states: a popped position can remain in its chain while other members of its coordinate group are still unmarked. Equal coordinates can have different areas because their neighbors differ. Waiting for all members coordinates their removal across those chains.

For each heap pop:

1. Skip an already-deleted position.
2. Stop if its priority is at least `tolerance` and `toDelete <= 0`.
3. Mark the position as a candidate if needed.
4. Continue to the next pop unless its group counter equals its group size.
5. Traverse the ready group in input order, skipping deleted members and applying the appropriate deletion path.

Group readiness permits traversal; it does not bypass the neighboring-group checks required for a member of a three-position ring.

### Ordinary deletion

For a position whose ring has not reached the three-position case, or for an eligible line position:

1. Mark the position deleted and decrement `toDelete` by `1`.
2. Link its preceding and following positions to each other.
3. Recompute eligible neighbor areas and repair their heap positions with `heapupdate(...)`.

Members deleted during group traversal can still have heap entries. Those entries are skipped when popped.

### Three-position ring

A ring with three remaining positions is detected through its cyclic neighbor indexes.

1. Mark the preceding and following positions as candidates if needed.
2. Check that both neighboring coordinate groups are fully candidate-marked.
3. If either group is not ready, leave the ring in place and continue group traversal.
4. Otherwise, mark all three ring positions deleted and decrement `toDelete` by `3`.
5. Restart traversal at the current group root. Earlier members may now have ready neighboring groups.

The neighboring positions are marked without comparing their own areas against `tolerance`. Their coordinate groups must still satisfy readiness before the ring disappears. Ring deletion changes the deletion mask and budget; the removed ring needs no further neighbor or area updates.

The stop condition is checked between heap pops, not during group traversal. A ready group and whole-ring removals can exceed the remaining fraction budget.

## Stopping semantics

| Active options   | Heap-pop stop condition                                 |
| ---------------- | ------------------------------------------------------- |
| `tolerance` only | Current non-deleted entry has area at least `tolerance` |
| `fraction` only  | The rounded deletion budget has been met or exceeded    |
| Both             | Both the area threshold and budget conditions hold      |

- `tolerance` uses current triangle areas, not geographic distance.
- `fraction` sets a target based on all collected positions, including protected line endpoints.
- With both options, stopping requires both the area threshold and deletion budget conditions to hold.
- The heap can become empty before the fraction target is reached because of protected positions and group or ring constraints.
- Repeating fraction-based simplification is not generally idempotent: the collected count, topology, and priorities can change between calls.

## Reconstruction

Reconstruction follows the same traversal order as collection and consumes the deletion mask in that order.

- Line survivors are compacted in place; endpoints remain.
- Ring survivors are compacted in place. A changed surviving ring is closed with its first remaining position.
- A changed ring with fewer than three remaining non-closing positions is removed.
- Removing an interior ring affects only that ring.
- Removing an exterior ring empties a `Polygon` or removes the corresponding polygon from a `MultiPolygon`. Mask indexes still advance over that polygon's interior rings.
- Features and collection containers remain present even when their geometry content becomes empty.
- Coordinate values and the relative order of surviving positions are preserved.

### Result by GeoJSON type

| Type                                         | Reconstruction behavior                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `LineString`                                 | Compacts the line while preserving both endpoints                                                      |
| `MultiLineString`                            | Compacts each line independently; the line collection remains present                                  |
| `Polygon`                                    | Removes collapsed interior rings; sets `coordinates` to an empty array if the exterior ring disappears |
| `MultiPolygon`                               | Compacts the polygon array to omit polygons whose exterior rings disappear                             |
| `Feature`                                    | Retains the feature, properties, and geometry type, including when coordinates become empty            |
| `FeatureCollection`                          | Retains its features and recursively updates their geometries                                          |
| `GeometryCollection`                         | Retains its geometry members and recursively updates them                                              |
| `Point`, `MultiPoint`, null feature geometry | Contribute no deletion-mask entries and receive no coordinate updates                                  |

An emptied geometry is not replaced with `null` or a different GeoJSON type. Unchanged parts of the tree retain their values; with `mutate: false`, all processing applies to the cloned tree.

## Geometry constraints

Equal-coordinate groups coordinate deletion across shared boundaries. Whole-ring collapse can remove one geometry while an adjacent geometry survives.

Coordinate matching is exact on both axes. The algorithm does not discover segment intersections, insert matching vertices, or snap nearby positions together. Shared-boundary coordination therefore depends on matching positions being present in the input.

Ring validity is assumed on input. Repeated identical positions within a ring remain separate indexed members of one coordinate group. Interactions between ordinary grouped deletion and whole-ring collapse can produce additional fraction overshoot for such degenerate rings. Geometry ownership is not recorded in the working set.

This ownership-free representation keeps bookkeeping indexed by position and coordinate group. Special handling that distinguishes self-duplicates from cross-geometry sharing would require additional ownership state and changes to deletion rules; that distinction is outside the current model.
