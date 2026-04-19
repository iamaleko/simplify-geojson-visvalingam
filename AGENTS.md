# Repository Guidelines

## Project structure and module organization
The main library code lives in `src/`: the public entrypoint is `src/index.ts`, and helper type guards are placed in `src/lib/`. Automated tests live in `test/`, input fixtures are in `test/geojson/in/`, and expected outputs are in `test/geojson/out/`. For manual inspection use `playground/`: `playground/index.ts` for local runs and `playground/generate.py` for generating data. The `dist/` directory contains build artifacts and must not be edited manually.

## Build, test, and development commands
- `npm test`: run the Mocha test suite.
- `npm run lint`: check the code with ESLint using `--max-warnings=0`.
- `npm run lint:fix`: apply safe lint autofixes.
- `npm run format`: format `ts`, `js`, and `json` files with Prettier.
- `npm run build`: run lint, tests, and the `tsup` build in sequence.
- `npm run watch`: rebuild the library on file changes.
- `npm run playground`: start the local playground with `tsx watch`.

## Code style and naming conventions
The project uses TypeScript in ESM mode. Follow the existing style in `src/` and `test/`: 2-space indentation, single quotes, and omit semicolons unless tooling inserts them. Keep the public API in `src/index.ts`, and move helper logic into small files inside `src/lib/`. Use `camelCase` for variables and functions, and `PascalCase` for GeoJSON types. Fixture names should describe the scenario explicitly, for example `smallPolygonNoCommonPositions.json`. When changing the simplification algorithm in `src/`, preserve the performance-first approach: do not add extra coordinate passes, extra allocations, or more expensive data structures unless there is a clear need and a measurable correctness gain.

## Agent-facing documentation
Agent-facing Markdown files such as `AGENTS.md` and files under `docs/memory/` must be written in English only.

Use a compact technical reference style:
- prefer precise statements over conversational explanation
- keep sections easy to scan
- avoid storytelling, marketing language, and unnecessary repetition
- describe current behavior, constraints, invariants, and rationale directly
- separate verified behavior from assumptions or future work

When documenting implementation details:
- anchor statements in the current code, tests, README, or changelog
- keep design rationale explicit when it affects performance or behavior
- avoid speculative bug reports or unsupported interpretations
- update agent-facing files together with tests or algorithm changes when the documented behavior changes
- treat synchronization as mandatory: if code, tests, invariants, API semantics, or performance rationale change, update the relevant agent-facing files in the same work so they do not drift out of date

## Testing rules
Tests use Mocha with Node.js `assert`. Place new coverage by concern: validation and options go in `test/simplify.validation.test.ts`, behavioral and invariant scenarios in `test/simplify.behavior.test.ts`, simplification without shared positions in `test/simplify.no-common-positions.test.ts`, and simplification with shared positions in `test/simplify.common-positions.test.ts`. If library behavior changes, keep the input and expected JSON fixtures in `test/geojson/in/` and `test/geojson/out/` in sync. For new non-trivial GeoJSON scenarios, do not inline large objects in tests: create named fixtures following the existing pattern, for example `polygonWithSmallInteriorRing.json` and `polygonWithSmallInteriorRingFraction0Tolerance1.json`. Prefer one asserted scenario per `it(...)`, with names in the `should ...` style. Always run `npm test` before opening a pull request; use `npm run build` for full verification.

## Commits and pull requests
The repository history uses short imperative commit titles such as `Bump version`, `Update README.md`, and `Fix package.json and bump version`. Keep the same concise and specific style. In pull requests, describe the visible behavior change, call out API or fixture changes, and link related issues when available. If the simplification logic changes, include a short GeoJSON before/after example.
