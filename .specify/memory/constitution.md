<!--
Sync Impact Report:
- Version change: none → 1.0.0 (initial constitution)
- Added sections: All core principles and governance
- Templates requiring updates: ⚠ Pending validation of all templates
- Follow-up TODOs: None
-->

# next-swagger-doc Constitution

## Core Principles

### I. OpenAPI Standards Compliance

next-swagger-doc MUST generate valid OpenAPI 3.0+ specifications from JSDoc annotations. All generated specs must pass OpenAPI validation. Breaking changes to OpenAPI support require MAJOR version bump.

**Rationale**: Users depend on standards-compliant output for tooling integration. Invalid specs break downstream consumers (Swagger UI, code generators, validators).

### II. Next.js Version Compatibility

The library MUST support all Next.js versions >= 9, including both Pages Router and App Router patterns. Compatibility with latest Next.js versions takes priority. Breaking support for major Next.js versions requires MAJOR version bump.

**Rationale**: Next.js ecosystem evolves rapidly. Users expect the library to work across Next.js major versions without constant upgrades.

### III. JSDoc-First Documentation

API documentation MUST be derived from JSDoc comments in source code. No external configuration files should be required for basic documentation. The library should support standard swagger-jsdoc syntax and patterns.

**Rationale**: Co-locating documentation with code reduces maintenance burden and keeps docs in sync with implementation. Developers already familiar with JSDoc can adopt quickly.

### IV. Zero-Config Defaults with Flexible Configuration

The library MUST work with minimal configuration (apiFolder + basic definition). Advanced features (schema folders, custom definitions, security schemes) must be opt-in. Configuration should be declarative and type-safe.

**Rationale**: Low barrier to entry for basic use cases while supporting enterprise requirements. Progressive disclosure of complexity.

### V. Multi-Interface Support

The library MUST provide three integration patterns:
1. Programmatic API (`createSwaggerSpec`)
2. HTTP endpoint via Next.js API route (`withSwagger`)
3. CLI for static spec generation (`next-swagger-doc-cli`)

**Rationale**: Different deployment patterns have different needs. Static generation for CI/CD, runtime for dev environments, programmatic for custom integrations.

### VI. Test Coverage and Quality

All exported functions MUST have unit tests with snapshot testing for spec generation. Breaking changes must be caught by failing tests. Test coverage should remain above 80%. Use Vitest for testing framework.

**Rationale**: Spec generation is deterministic and snapshot-testable. Regression prevention is critical since consumers depend on stable output formats.

### VII. TypeScript-First Development

Source code MUST be written in TypeScript with full type definitions exported. No `any` types in public API. Type definitions must match OpenAPI specification types where applicable.

**Rationale**: Next.js and modern JavaScript ecosystem is TypeScript-first. Type safety prevents common configuration errors.

## Quality Standards

### Code Quality

- Biome for linting and formatting (single tool for consistency)
- No warnings allowed in CI builds
- Bundle size monitoring via size-limit
- Dependencies must be production-ready (no alpha/beta in dependencies)

### Documentation Quality

- README must include all four usage patterns with working examples
- Breaking changes must be documented in CHANGELOG.md
- Examples folder must have working Next.js projects for each major use case
- API documentation generated via TypeDoc published to docs site

### Performance Standards

- Spec generation must complete in <1s for typical projects (<100 endpoints)
- CLI must support incremental builds
- Memory usage must stay reasonable for large projects (1000+ endpoints)

## Development Workflow

### Testing Requirements

- All PRs must include tests for new functionality
- Tests must pass in CI before merge
- Snapshot tests must be reviewed for unintended changes
- Coverage must not decrease

### Release Process

- Use semantic versioning strictly (MAJOR.MINOR.PATCH)
- MAJOR: Breaking API changes, Next.js compatibility drops, Node.js version bumps
- MINOR: New features, new Next.js version support
- PATCH: Bug fixes, documentation updates, dependency patches
- Pre-commit hooks enforce code quality (linting, formatting)

### Dependency Management

- Peer dependencies: Only Next.js (flexible version range)
- Direct dependencies: Swagger-jsdoc (core), CLI framework, type utilities
- Dev dependencies: Testing, building, linting tooling
- Minimize dependency count to reduce supply chain risk
- Use Renovate/Dependabot for automated updates

## Governance

This constitution establishes the foundational principles for next-swagger-doc development. All contributions must align with these principles.

### Amendment Process

1. Constitution changes require discussion in GitHub Issues
2. MAJOR principle changes need maintainer consensus
3. All amendments documented with rationale
4. Version bump reflects significance of change

### Compliance

- All PRs reviewed against constitution principles
- Automated checks enforce quality standards (tests, linting, types)
- Maintainers have authority to reject non-compliant contributions
- Community feedback shapes principle evolution

### Runtime Guidance

Developers and AI agents should consult this constitution before planning features. When principles conflict, discuss in issue tracker before proceeding.

**Version**: 1.0.0 | **Ratified**: 2025-11-05 | **Last Amended**: 2025-11-05
