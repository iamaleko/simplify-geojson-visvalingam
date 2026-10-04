# Performance and memory policy

This document records optimization constraints for the implementation in `src/index.ts` and `src/lib/functions.ts`. Algorithm semantics are documented in `docs/memory/algorithm.md`.

## Priorities

- Preserve throughput, coordinate-group behavior, and deterministic processing.
- Account for temporary allocations and peak memory as well as retained storage.
- Keep coordinate passes, per-position work, and allocation counts explicit.
- Justify changes to hot-path structures with comparable timing and memory measurements.

The constraints below describe both the storage or control-flow choice and its purpose. Changes must preserve the stated invariants; improvements in one phase must be evaluated against the cost of the complete public call.

## Entry path

- Validate only the top-level object and numeric options. Geometry traversal dispatches through shallow type guards and assumes valid 2D GeoJSON.
- Keep the no-op return ahead of cloning, traversal, and working-set allocation.
- Preserve default in-place mutation. `structuredClone` runs only when simplification is requested and `mutate` is false.

Rationale:

- Narrow validation bounds entry overhead. The hot path relies on valid coordinates and container shapes, so it does not normalize or repeatedly validate individual positions.
- The no-op return incurs no geometry-sized work or allocation, even when cloning was requested. Keep it after option validation so invalid options still fail consistently.
- Default mutation does not allocate a second GeoJSON tree. Cloning is an explicit isolation cost paid before any coordinate arrays are modified.

## Traversal and topology

- Collect coordinates and neighbor indexes together into one flat position space.
- Store references to existing coordinate arrays.
- Encode missing line neighbors as `-1` and ring neighbors as cyclic indexes.
- Exclude the final closing position of each ring from the working set.
- Keep collection, grouping, deletion, and reconstruction as separate phases with consistent index order.
- Fold additional work into the relevant phase when possible; account for every additional full traversal.

Rationale:

- One position-index space lets topology, groups, priorities, and flags address the same vertices directly. Shared coordinates can span geometries without requiring a separate deletion queue for each geometry.
- Coordinate references preserve the input values without copying each position. Neighbor changes require numeric index writes and no per-vertex wrapper objects.
- The `-1` sentinel carries endpoint protection in the topology arrays themselves. Cyclic ring links support neighbor access at the first and last working positions.
- Omitting ring closure gives its repeated endpoint one working position and one area calculation. Reconstruction restores the required closing coordinate.
- Consistent traversal order lets reconstruction consume the deletion mask sequentially. Additional passes increase work in proportion to the full input size, including positions that survive simplification.

## Numeric storage

For `n` collected positions:

| Storage                               | Type           | Length   | Role                                    |
| ------------------------------------- | -------------- | -------- | --------------------------------------- |
| `prevIndexes`, `nextIndexes`          | `number[]`     | `n` each | Local chain topology                    |
| `groupOf`, `groupSize`, `nextInGroup` | `Uint32Array`  | `n` each | Group membership, counts, and traversal |
| `groupTail`                           | `Uint32Array`  | `n`      | Temporary group construction state      |
| `isDeleted`, `isCandidate`            | `Uint8Array`   | `n` each | Deletion and candidate flags            |
| `candidatesByGroup`                   | `Uint32Array`  | `n`      | Candidate counts indexed by group root  |
| `heap`                                | `Uint32Array`  | `n + 1`  | Heap size and position indexes          |
| `heapRev`                             | `Uint32Array`  | `n`      | Position-to-heap reverse indexes        |
| `priority`                            | `Float64Array` | `n`      | Current triangle areas                  |

Use indexed numeric state in the deletion loop. Preserve the distinction between position-indexed arrays and root-indexed group counters.

Rationale:

- Typed arrays give fixed-width storage for indexes, counters, flags, and fractional priorities. The byte arrays use one byte per boolean flag; area values use floating-point storage.
- Topology arrays grow as positions are collected and represent `-1` directly. The later working arrays are allocated once the position count is known.
- Arrays of length `n` keep group-root ids and position ids in the same index space. Only root entries of group-count arrays are meaningful, but direct indexing needs no separate group-id translation.
- The deletion mask is the common state for lazy heap skipping and reconstruction. Keeping candidate marks separate records readiness independently of whether deletion has already happened.

## Group construction

- Build group membership and links during one input-order pass.
- Key `groupsByX` by numeric `x`. Store a root index while that `x` has one distinct `y`.
- Allocate the nested numeric `y` map only when the same `x` has a second distinct `y`.
- Populate that map with two `set(...)` calls, without temporary entry-array literals.
- Use the first matching position index as the stable group id.
- Append members through `groupTail`; member traversal follows input order and ends at sentinel `n`.
- Keep map lookups in the construction phase. Deletion uses the returned typed arrays.

Rationale:

- Numeric keys use the coordinate values directly, without serializing coordinate pairs. Both axes participate in group identity.
- Lazy nested maps allocate `y` lookup state only for `x` values that actually need it. Repetitions of the same coordinate reuse their group root.
- Two `set(...)` calls populate a promoted map without allocating entry-array literals in source code.
- The first member is already a valid array index, so the group id needs no additional group record. `groupTail` makes each append a fixed number of index writes and preserves input order.
- Separating coordinate lookup from group traversal keeps the repeated deletion-phase reads on typed arrays. Input-order traversal is a behavior constraint because group members can change candidate readiness while they are processed.

The grouping arrays allocate `16 * n` bytes of element storage during construction; the three returned arrays account for `12 * n` bytes. Map storage and object overhead are additional. The maps and `groupTail` are local construction state; reclamation timing depends on garbage collection.

Memory use depends on both the position count and the distribution of distinct `x` and `y` values. Evaluate grouping changes on geometries with different coordinate-sharing patterns.

## Heap layout and maintenance

- Use a one-indexed binary min-heap: `heap[0]` is its active size, and active entries occupy indexes `1` through `heap[0]`.
- Preserve the active-entry invariant `heapRev[heap[slot]] === slot` whenever heap maintenance completes.
- Build the initial heap once from positions with both neighbors, then apply bottom-up `heapify(...)`.
- In `heapsink(...)`, move selected children upward while maintaining their reverse indexes; write the saved value and its reverse index at the final slot.
- Keep `heapswap(...)` updates consistent between `heap` and `heapRev`.
- Repair affected neighbor entries locally with `heapupdate(...)`, which sinks and then bubbles from the resulting slot.
- Skip indirectly deleted entries when popped. Their deletion flags make separate eager heap removal unnecessary.

Rationale:

- The one-indexed layout supports parent and child arithmetic directly: `slot >>> 1`, `slot << 1`, and `(slot << 1) + 1`. The array's first element holds the active size.
- Bottom-up heap construction processes the initial eligible positions in linear heap-build time.
- `heapRev` locates an active position's slot directly. A changed neighbor can then be repaired along a heap path rather than searched for by coordinate or position id.
- Sinking moves each selected child once and places the saved value at the end of the path. Every moved entry must receive its matching reverse index.
- Neighbor area changes can require movement in either direction. Sink-then-bubble handles both directions while limiting work to the affected entry.
- Lazy skipping postpones heap work for indirectly deleted positions until they are encountered. Some of those entries may never be popped because the simplification stop condition is reached first.

`heapcompare(...)` orders entries by triangle area, `x`, and `y`. Equal comparison keys retain the ordering determined by input and heap operations. Preserve this comparator and input-order group traversal when changing heap internals.

Coordinate tie-breaking resolves equal-area choices using data already present in the working set. Exact ties do not introduce an additional position-id comparison; deterministic behavior is defined for the same input order and options.

## Grouped deletion

- Track deletions and candidate marks with byte arrays.
- Increment a group counter only when a position first becomes a candidate.
- Cache the current group id for readiness checks and traversal restart.
- Process ordinary deletions through local neighbor-index updates and area recalculation.
- Handle a remaining three-position ring directly: check neighboring group readiness, mark its three positions deleted, and subtract `3` from the budget.
- Restart the current group after whole-ring removal so earlier members observe updated candidate counts.
- Retain the boundary between group processing and the next heap-pop stop check.

Rationale:

- Candidate flags prevent duplicate contributions to counters. Root-indexed counters determine readiness without scanning every member on each heap pop.
- The cached group id remains fixed while the member index advances or restarts. It identifies the same counter and traversal head throughout that operation.
- An ordinary deletion changes only its immediate neighbors' areas, so those are the entries that need recalculation and heap repair.
- Direct three-position ring removal represents the ring's disappearance in one operation. It accounts for three deletions and avoids constructing a live ring with fewer than three working positions.
- Neighbor candidate marks made later in group traversal can unblock an earlier ring. Restart is required to reconsider that ring before leaving the group.
- Checking the fraction budget between heap pops allows a started group operation to finish according to its readiness rules. Moving that check inside traversal would change shared-position behavior.

## Reconstruction

- Compact surviving coordinates forward in their existing arrays with an offset.
- Truncate changed arrays with a final `splice(...)` and restore ring closure when needed.
- Compact interior-ring and polygon arrays in place when components disappear.
- When an exterior ring disappears, advance the deletion-mask index over its interior rings without reconstructing them.

Rationale:

- Forward compaction writes at or behind the current read position, so surviving positions retain their order and unread positions remain available.
- A final truncation limits repeated array shifting and preserves the existing coordinate containers for surviving geometries.
- Compaction needs the deletion mask and an offset, without allocating a separate survivor collection.
- Once an exterior ring is removed, its interior rings cannot survive in that polygon. Advancing their mask indexes preserves alignment for the next geometry while avoiding unnecessary reconstruction work.

## Measurement requirements

- Compare matching inputs, options, output hashes, position counts, harness settings, runtime versions, and hardware.
- Use independent process repeats, inspect their spread, and reverse version order when evaluating small differences.
- Measure the compiled public API. Input generation and per-call cloning for mutating scenarios stay outside the timed interval.
- Measure memory separately from timing. Peak RSS covers the whole process; before/after memory snapshots do not measure transient peaks or total allocations.
- Include representative workloads with sparse and dense coordinate sharing. Report timing and memory effects together.
- Keep performance measurements separate from profiling; profiling identifies where time is spent but changes execution overhead.

Rationale:

- Matching outputs establishes that timings describe the same simplification result. Whole-call measurements include interactions between grouping, heap work, reconstruction, and garbage collection.
- Process repeats and reversed version order help distinguish an implementation effect from warmup variation and changing system load. A small percentage difference alone is insufficient evidence.
- Separate memory runs avoid timing-loop allocation history dominating the observation. RSS and memory snapshots answer different questions and must not be interpreted as isolated algorithm allocation totals.
- Coordinate-sharing patterns determine nested-map allocation and group traversal work; position count alone does not characterize the workload.

Commands, scenario definitions, and measurement boundaries are documented in `bench/README.md`.
