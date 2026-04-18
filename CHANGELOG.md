# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.5] - 2026-04-19

### Fixed
- Corrected `fraction` accounting when an entire triangular ring is removed so the deletion is counted as three removed positions instead of one
- This changes simplification output for some polygon and multipolygon cases where rings collapse during fraction-based simplification

## [1.3.4] - 2025-05-12

### Added
- Simplification by removing fraction of all points using `options.fraction`
