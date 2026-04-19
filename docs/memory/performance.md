# Performance and memory policy

Related file: see `docs/memory/algorithm.md` for algorithm semantics, geometry behavior, and tested invariants.

## Purpose

This file documents implementation decisions that preserve throughput, reduce allocation pressure, and keep memory use predictable in the simplification hot path.

These rules are strict. Future changes should preserve them unless benchmarks or correctness requirements justify a different design.

## Performance priorities

- Throughput is a primary constraint.
- Avoid extra passes over coordinates when work can be folded into an existing pass.
- Avoid object-heavy intermediate representations in hot code.
- Avoid deep validation and defensive normalization inside simplification.
- Prefer deterministic behavior when it can be preserved without extra structural cost.

## Validation scope

- Runtime validation is intentionally narrow.
- The library validates:
  - top-level object shape
  - `tolerance`
  - `fraction`
- The library does not perform deep coordinate or geometry validation.

Reason:

- deep validation adds extra passes and extra branches
- simplification assumes valid 2D GeoJSON input
- validation outside the hot path is cheaper than validation during simplification

Future edits must not move full GeoJSON validation into the simplification path without a measured reason.

## Mutation and cloning policy

- `mutate: true` is the default.
- `mutate: false` is opt-in and pays the cost of `structuredClone`.

Reason:

- in-place simplification is cheaper than cloning before any work starts
- default mutation avoids unconditional allocation of a second GeoJSON tree

Future edits must preserve mutation as the default unless there is a measured regression or an explicit API decision to change it.

## Early-exit policy

The no-op case exits before any working-set allocation or traversal:

- if `tolerance === 0` and `fraction === 0`, the function returns immediately
- this happens before cloning
- this happens before position collection
- this happens before grouping, heap construction, or reconstruction

Reason:

- no-op calls should not pay for simplification infrastructure
- the early exit avoids unnecessary traversal and temporary allocation in the common degenerate case

Future edits must keep the no-op path ahead of all simplification setup work.

## Flat working-set policy

Simplification is computed on a flat indexed working set:

```ts
type Positions = {
  coordinates: Position[]
  nextIndexes: number[]
  prevIndexes: number[]
}
```

Reason:

- all removable positions can be processed in one index space
- neighbor updates are index rewrites, not object traversal
- no per-vertex wrapper objects are created
- grouping, heap membership, flags, and deletion masks can all target the same point ids

Future edits should preserve flat indexed processing. Avoid replacing it with linked objects, class instances, or per-geometry deletion queues.

## Sentinel and topology encoding policy

Topology is encoded directly in `prevIndexes` and `nextIndexes`.

Rules:

- line endpoints use `-1`
- ring vertices use cyclic neighbor indexes
- no extra endpoint flags or wrapper nodes are allocated

Reason:

- endpoint checks stay branch-light
- topology updates are simple integer rewrites
- no parallel object graph is needed for adjacency

Future edits should preserve sentinel-based topology encoding unless a correctness fix requires a different representation.

## Typed-array policy

Typed arrays are used for hot-path control data:

- `Uint32Array` for `sortIndexes`, `groupedFrom`, `groupedTo`
- `Uint32Array` for `heap`
- `Uint32Array` for `heapRev`
- `Uint8Array` for `isDeleted`
- `Uint8Array` for `isCandidate`
- `Uint32Array` for `candidatesByGroupFrom`
- `Float64Array` for `priority`

Reason:

- tighter storage than general objects and arrays of records
- predictable numeric layout
- low-overhead indexed access
- fewer per-entry allocations

Future edits should not replace these structures with maps, sets, boxed node objects, or nested heap objects without benchmarks showing a clear win.

## Deletion-mask policy

Deletion state is tracked by masks and counters instead of survivor collections.

Current structures:

- `isDeleted: Uint8Array`
- `isCandidate: Uint8Array`
- `candidatesByGroupFrom: Uint32Array`

Reason:

- delete state is updated by point id with constant-time writes
- reconstruction can read one deletion mask instead of materializing filtered arrays
- grouping and lazy heap invalidation can share the same point-id space

Future edits should preserve mask-based deletion tracking. Do not replace it with lists of survivors, per-group objects, or repeated filtering passes in hot code.

## Pass minimization

The implementation is organized into a small number of focused passes:

1. validate
2. collect positions
3. group positions
4. delete positions
5. reconstruct coordinates

Within those phases, additional full traversals are avoided when possible.

Examples already present in the code:

- `groupPositions(...)` derives group bounds after one coordinate sort
- `heapify(...)` builds the heap bottom-up instead of repeated insert-and-bubble setup
- reconstruction compacts arrays in place instead of building fresh coordinate arrays
- the no-op case exits before any simplification setup
- group bounds are computed from both ends in one pass after sorting

Future edits must avoid adding extra whole-dataset passes when equivalent work can be folded into existing phases.

## Ring storage policy

Rings are collected without the duplicate closing coordinate.

Reason:

- the working set stores only unique ring vertices
- the neighbor graph stays cyclic without redundant duplicate entries
- priority computation and deletion do not pay for a repeated endpoint
- closure is restored once during reconstruction

Future edits should preserve this representation. Do not expand the working set to include duplicate closing ring coordinates unless required by a correctness fix.

## In-place reconstruction policy

`updateLinePositions(...)`, `updateRingsPositions(...)`, and `updateRingPositions(...)` compact arrays by:

- overwriting survivors forward with an `offset`
- applying a final `splice(...)`

Reason:

- avoids allocating replacement coordinate arrays
- minimizes temporary storage during reconstruction
- keeps writes local to existing arrays

Future edits should preserve offset-based in-place compaction by default.

This applies across container levels:

- lines compact their coordinate arrays in place
- polygon rings compact in place
- polygon ring arrays compact in place
- `MultiPolygon` compacts its polygon array in place

Future edits should not replace these compaction paths with alternate rebuilt arrays unless measurement justifies it.

## Grouping strategy

Equal coordinates are grouped by sorting point ids, then deriving contiguous group bounds.

Current structures:

```ts
type Groups = {
  sortIndexes: Uint32Array
  groupedFrom: Uint32Array
  groupedTo: Uint32Array
}
```

Reason:

- one sort produces adjacency for equal coordinates
- contiguous groups can be represented by start and end indexes
- no hash-based grouping structure is needed
- the same coordinate ordering also supports deterministic tie-breaking

Group ids are implicit:

- the canonical identifier of a group is `groupedFrom[i]`
- `candidatesByGroupFrom[...]` uses that canonical start index directly
- no separate group object or group-id allocation exists

Group bounds are derived in one post-sort pass from both directions:

- `groupedFrom` is filled left-to-right
- `groupedTo` is filled right-to-left in the same loop

Reason:

- no extra pass is needed to assign a separate group identifier
- one loop computes both group boundaries after sorting
- group bookkeeping stays array-based and allocation-free

Future edits should preserve:

- sort-and-bounds grouping
- canonical group ids via `groupedFrom`
- bidirectional boundary computation in one loop

Do not introduce separate group records or extra grouping passes without benchmarks.

## Heap structure

The deletion queue is a binary min-heap stored in a typed array.

Layout:

- `heap` is `Uint32Array(n + 1)`
- `heap[0]` stores the current heap size
- `heap[1]` stores the first real element
- the heap is intentionally 1-indexed

Reason:

- parent and child arithmetic stays cheap and branch-light:
  - parent: `i >>> 1`
  - left child: `i << 1`
  - right child: `left + 1`
- heap size lives inside the same compact structure
- no separate node wrapper is needed

Future edits must preserve the 1-indexed heap layout unless a replacement is benchmarked and clearly better.

## Reverse index policy

`heapRev` maps point id to current heap slot.

Reason:

- `heapupdate(...)` can repair one known heap member without searching for it
- targeted updates stay `O(log n)` after reprioritizing a neighbor
- the implementation avoids linear scans over heap contents

`heap` and `heapRev` form a shared invariant:

- if `heap[pos] = pointId`, then `heapRev[pointId] = pos`
- `heapswap(...)` updates both structures together

Future edits must preserve this invariant. Do not remove `heapRev` and reintroduce heap searches for updates.

## Heap construction policy

The heap is built once from positions that initially have both neighbors.

Construction details:

- `priority[i]` is precomputed only for heap members
- members are appended into `heap`
- `heapify(...)` runs bottom-up from `heap[0] >>> 1` down to `1`

Reason:

- bottom-up heapify is cheaper than repeated insertion with bubble-up
- only eligible points enter the heap
- setup cost remains linear in heap size

Future edits should keep one-time bottom-up heap construction unless a measured alternative is better.

## Heap update strategy

The heap is not rebuilt after each deletion.

Current strategy:

- normal deletion updates only the directly affected surviving neighbors
- neighbor priority is recomputed immediately
- `heapupdate(...)` repairs the modified heap member in place
- positions deleted indirectly through synchronous group deletion are not eagerly removed from the heap
- stale deleted entries remain in the heap until popped later
- the main loop skips them with:

```ts
if (isDeleted[i]) {
  continue
}
```

This is a mixed strategy:

- eager local repair for changed live neighbors
- lazy invalidation for stale deleted members
- no full heap rebuild after each deletion

Reason:

- local reprioritization is cheaper than rebuilding or rescanning the whole heap
- lazy invalidation avoids extra maintenance work for entries that may never matter again before pop
- total heap maintenance stays proportional to actual local changes

Future edits must preserve this mixed strategy unless benchmarks show a better approach.

## Whole-ring fast-path policy

Deletion has a dedicated fast path when a point belongs to a remaining triangular ring.

Current behavior:

- detect the three-vertex ring case from neighbor topology
- mark neighboring groups as candidates when needed
- remove the whole ring at once if all required groups are ready
- decrement `toDelete` by `3`
- restart group iteration to catch matching rings

Reason:

- avoids simulating the collapse as multiple ordinary deletions
- keeps ring-removal accounting aligned with actual removed positions
- handles an important collapse case without broader heap maintenance work

Future edits should preserve a direct whole-ring removal path unless a correctness fix requires a different strategy.

## Determinism policy

`heapcompare(...)` compares:

1. priority
2. `x`
3. `y`

Reason:

- equal-priority points are still ordered deterministically
- repeated runs with the same input and options do not depend on incidental heap state
- determinism is preserved without adding a separate ordering structure

Future edits must keep tie-breaking explicit. Do not rely on engine-dependent ordering for equal priorities.

## Type and branch policy

The library uses narrow runtime checks and explicit type guards:

- `isObject`
- `isFeature`
- `isFeatureCollection`
- `isLineString`
- `isMultiLineString`
- `isPolygon`
- `isMultiPolygon`
- `isGeometryCollection`
- `isFinitePositiveNumber`

Reason:

- control flow stays simple
- hot-path code can assume narrower shapes after entry validation
- runtime normalization logic is kept minimal

Future edits should prefer narrow checks that support simpler hot-path code over broader runtime normalization.

## Change review checklist

Before changing hot-path code, check:

- Did this add a new full pass over coordinates?
- Did this add new cloning, copying, or temporary arrays?
- Did this replace typed arrays or flat arrays with heavier structures?
- Did this widen validation or normalization inside simplification?
- Did this move the no-op exit later than necessary?
- Did this weaken deterministic ordering?
- Did this replace sentinel-based topology encoding with heavier state?
- Did this replace deletion masks with survivor collections or filtering passes?
- Did this remove 1-indexed heap layout or move heap size out of `heap[0]`?
- Did this remove `heapRev` or reintroduce heap searches?
- Did this replace bottom-up heap construction with more expensive setup?
- Did this replace local heap repair with broader heap rebuild work?
- Did this remove lazy skipping of stale deleted heap entries?
- Did this add separate group objects or extra grouping passes?
- Did this remove the whole-ring fast path?
- Did this change asymptotic behavior or memory profile without benchmarks?

## Synchronization rule

When hot-path behavior, memory layout, heap logic, validation scope, or performance rationale changes, update this file together with:

- implementation code
- relevant tests or fixtures
- `docs/memory/algorithm.md` if algorithm mechanics or invariants also changed
- this file and `docs/memory/algorithm.md` should stay cross-consistent; neither should describe behavior the other now contradicts
- `README.md` if public guarantees changed
