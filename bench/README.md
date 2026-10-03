# Performance benchmarks

Synthetic data only. No downloads or real GeoJSON datasets are used. Run commands from the repository root with Node.js 24; use the same exact Node version and machine for both versions.

## First run

```bash
npm ci
npm run bench -- --out .bench-results/baseline-time.json
npm run bench:memory -- --out .bench-results/baseline-memory.json
```

Both commands rebuild the library and native JavaScript benchmark workers. The default `quick` suite contains 12 scenarios: six geometry families, 10,000 requested positions, `fraction: 0.5`, and both mutation modes. Each scenario runs in three independent child processes, sequentially. Timing uses a 300 ms warmup and a 1,000 ms measurement budget, with at least four warmup calls and 16 measured calls. These are minimum budgets, not deadlines; large geometries can take longer.

For a short infrastructure check:

```bash
npm run bench -- --size 128 --repeats 1 --time 50 --warmup 20 --out .bench-results/smoke-time.json
npm run bench:memory -- --size 128 --repeats 1 --out .bench-results/smoke-memory.json
```

Smoke results are useful for checking the harness, not for accepting small optimizations.

## Compare an optimization

Save baseline reports, change the implementation, then run the same commands with candidate output paths:

```bash
npm run bench -- --out .bench-results/candidate-time.json
npm run bench:memory -- --out .bench-results/candidate-memory.json
npm run bench:compare -- .bench-results/baseline-time.json .bench-results/candidate-time.json --out .bench-results/comparison-time.json
npm run bench:compare -- .bench-results/baseline-memory.json .bench-results/candidate-memory.json --out .bench-results/comparison-memory.json
```

Negative changes indicate lower elapsed time or lower peak RSS. Each comparison value is the median of the independent process measurements. Inspect individual repeat results and their spread in the JSON report; the percentage change alone is not evidence of statistical significance.

The comparator rejects different environments, harnesses, generators, measurement settings, scenario definitions, inputs, outputs, position counts, missing repeats, and invalid primary measurements. A change in output must be investigated before a performance comparison is accepted. Behavioral fixes may require a new baseline.

If you edit the harness or update Tinybench, regenerate both reports. The runner hashes its own compiled code, the compiled worker, and Tinybench's entrypoint. It also records the target module hash, commit, dirty status, Node/V8 versions, CPU model, architecture, and OS platform. The target hash is authoritative when using a copied build; its commit can be unavailable outside a Git checkout.

To compare two checkouts using exactly the same harness, build the baseline checkout, then run from the candidate checkout:

```bash
npm run bench -- --module ../baseline/dist/index.js --out .bench-results/baseline-time.json
npm run bench -- --module dist/index.js --out .bench-results/candidate-time.json
```

`--module` selects an ESM build with a default `simplify` export. `bench:prepare` rebuilds this checkout's `dist`, so keep the baseline build in a separate checkout or directory. The alternate module's imports must resolve normally from its own location.

For small improvements, repeat the comparison with the version order reversed. Run on an idle machine with a stable power mode. Do not run baseline and candidate concurrently. Percentiles describe local benchmark samples, not production request latency.

## Scenarios

| Family | Geometry and purpose |
| --- | --- |
| `noisy-line` | Long line with sinusoidal bends and seeded noise |
| `short-lines` | Many independent lines of about 32 positions |
| `polygon-holes` | One polygon with two interior rings |
| `shared-boundary` | Two adjacent polygons with an exactly identical curved boundary in opposite traversal directions |
| `collinear-line` | Collinear positions, zero areas, and equal-priority candidates |
| `feature-collection` | Many small polygon features with properties |

The seed is fixed at `20261002`. Noisy geometries use an explicit deterministic integer PRNG. Shared coordinates have equal numeric values but are separate objects, as with parsed JSON. Ring closures are explicitly repeated. Position counts exclude ring closure and match the algorithm's collected working set. Shared-boundary sizes round down to a multiple of eight; reports include actual counts.

`full` contains 180 scenarios: the six families, 1,000/10,000/100,000 positions, both mutation modes, fractions 0.1/0.5/0.9, tolerance 0.0001, and combined tolerance/fraction. Coordinates are synthetic Cartesian values; the tolerance is a fixed area threshold, not meters. Actual removal rates vary and are recorded.

```bash
npm run bench -- --list
npm run bench -- --suite full --list
npm run bench -- --suite full --out .bench-results/full-time.json
npm run bench -- --filter shared-boundary --size 1000000 --out .bench-results/shared-million.json
```

`--filter` matches a substring of the scenario ID. `--size` overrides the suite sizes; minimum 32. `--time` and `--warmup` are milliseconds. `--repeats` controls independent process repeats. An empty selection or invalid option fails the command. Each worker has a ten-minute safety timeout.

## Timing boundaries

- Measurement uses the compiled public library, not TypeScript transpilation.
- Generation, file access, hashing, correctness checks, and reporting are outside timed calls.
- `clone`: `mutate: false`; timing includes the library's internal `structuredClone`.
- `mutate`: `mutate: true`; a fresh input clone is prepared before every warmup and measured iteration in Tinybench's untimed `beforeEach` hook.
- Timing workers do not force GC. Preparing inputs still creates allocation pressure and can affect GC during measured calls. Keep the two modes separate; do not subtract clone time from total time.
- A preflight output hash is checked against the last measured output. The shared source must remain unchanged. Independent repeats must produce identical hashes and counts.

Timing reports contain median, mean, p99, standard deviation, relative margin of error, and sample count for each process repeat. Tinybench's error estimate is within one process; it does not account for machine drift between process runs.

## Memory boundaries

Memory workers use `--expose-gc`, generate and hash the input, then force GC once before measuring a single public call. They capture `process.memoryUsage()` before and immediately after the call, and `process.resourceUsage().maxRSS` before hashing the output. They do not run timing warmup or timing loops.

`maxRssKiB` is the whole process's peak RSS, including Node, imports, fixture generation, and input hashing. It is not the isolated allocation size of `simplify`. `before` and `after` are snapshots, not peaks; after-before differences can be affected by collection during the call. The displayed ArrayBuffer delta is a snapshot delta, not cumulative allocations. `arrayBuffers` is already included in `external` and must not be added to it.

For a flag-array optimization, inspect `arrayBuffers` as well as RSS. Exact transient-array byte counts require a separate diagnostic measurement; the harness does not instrument the library's hot path. Tinybench is imported by the memory worker too, so its fixed overhead is included in both versions.

## CPU profiles

```bash
npm run bench -- --filter noisy-line --repeats 1 --time 2000 --cpu-profile --out .bench-results/profile-run.json
```

Native Node CPU profiles are saved under `.bench-results/profiles/`; open them in a profiler supporting `.cpuprofile`. Profiles include startup, generation, preflight, warmup, and measured calls. Profiled reports cannot be compared to unprofiled reports. Use ordinary timing runs for final speed comparisons.

## Repository and CI

Commit generators, seeds, scenarios, runner/comparator code, tests, and methodology. Generated builds, reports, and profiles are ignored. Change `generatorVersion` when generator semantics change. JSON schema changes require a schema version change and corresponding reader updates.

The manual GitHub Actions workflow `Performance benchmarks` builds a selected baseline ref and the selected workflow ref, then runs the same candidate harness against both builds on one runner. It stores time/memory reports and comparison files as artifacts. There is no automatic performance threshold. If comparison fails because outputs or metadata differ, inspect the reports before interpreting timings. Hosted runners are noisy; confirm small gains locally.

Tests for generator reproducibility, topology, mode equivalence, and comparator compatibility live in `test/benchmark.test.ts`. Performance results are not asserted in the Mocha suite.
