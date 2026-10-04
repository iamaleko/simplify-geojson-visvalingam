# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.9] - 2026-10-04

### Changed
- Replaced coordinate sorting with input-order grouping; 7.5–30.5% lower median runtime and 2.4–17.2% higher peak RSS across mutating benchmarks with 100,000 positions

## [1.3.8] - 2026-10-04

### Changed
- Optimized heap sifting; 5.6% lower geometric-mean runtime and 1.6% lower geometric-mean peak RSS across six mutating benchmark scenarios with 100,000 positions

## [1.3.7] - 2026-10-04

### Changed
- Optimized the position-grouping comparator; 13.1% lower median runtime and 4.7% lower median peak RSS across benchmark scenarios with 100,000 positions

## [1.3.6] - 2026-04-19

### Fixed
- Corrected position grouping for the last sorted coordinate so shared-position ranges are computed consistently
- This changes simplification output for some multipolygon and shared-boundary cases

## [1.3.5] - 2026-04-19

### Fixed
- Corrected `fraction` accounting when an entire triangular ring is removed so the deletion is counted as three removed positions instead of one
- This changes simplification output for some polygon and multipolygon cases where rings collapse during fraction-based simplification

## [1.3.4] - 2025-05-12

### Added
- Simplification by removing fraction of all points using `options.fraction`
