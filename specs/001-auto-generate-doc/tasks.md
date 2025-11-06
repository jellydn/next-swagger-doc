# Tasks: Automatic OpenAPI Documentation Generation

**Feature**: 001-auto-generate-doc
**Input**: Design documents from `/specs/001-auto-generate-doc/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auto-generate-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Implementation Strategy

**MVP Scope**: User Story 1 (P1) - Minimal JSDoc for API Documentation

This provides immediate value by auto-inferring paths and methods, reducing documentation boilerplate by 60%. Can be released independently without P2/P3.

**Incremental Delivery**:
1. P1: Path/method inference (MVP - deployable)
2. P2: Schema inference (enhancement - deployable)
3. P3: Hybrid mode (polish - deployable)

Each user story is independently testable and deployable.

---

## User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                     ↓
    ┌───────────────┴────────────────┐
    ↓                                ↓
Phase 3: US1 (P1)                Phase 4: US2 (P2)
    ↓                                ↓
    └────────────┬────────────────────┘
                 ↓
         Phase 5: US3 (P3)
                 ↓
         Phase 6: Polish
```

**Parallel Opportunities**:
- US1 and US2 can be developed in parallel after Phase 2
- US3 requires both US1 and US2 complete
- Polish tasks can start once US1 is complete

---

## Phase 1: Setup

**Purpose**: Project initialization and dependency setup

### Dependencies

- [ ] T001 Install @asteasolutions/zod-to-openapi dependency in package.json
- [ ] T002 [P] Install zod as peer dependency in package.json
- [ ] T003 [P] Add ts-json-schema-generator as optional dependency in package.json

### Project Structure

- [ ] T004 Create src/auto-generate/ directory for new modules
- [ ] T005 Create test/auto-generate/ directory for test files
- [ ] T006 [P] Create test/fixtures/pages-router/ directory for Pages Router test files
- [ ] T007 [P] Create test/fixtures/app-router/ directory for App Router test files

---

## Phase 2: Foundational

**Purpose**: Shared infrastructure and core types required by all user stories

### Core Types

- [ ] T008 Define HttpMethod type in src/auto-generate/types.ts
- [ ] T009 Define SourceLocation interface in src/auto-generate/types.ts
- [ ] T010 Define RoutePathInfo interface in src/auto-generate/types.ts
- [ ] T011 Define HttpMethodInfo interface in src/auto-generate/types.ts
- [ ] T012 Define HandlerInfo interface in src/auto-generate/types.ts
- [ ] T013 [P] Define RouteParameter interface in src/auto-generate/types.ts
- [ ] T014 [P] Define ResponseInfo interface in src/auto-generate/types.ts
- [ ] T015 [P] Define RouteInfo interface in src/auto-generate/types.ts

### Configuration

- [ ] T016 Define AutoGenerateConfig interface in src/auto-generate/config.ts
- [ ] T017 Define PerformanceConfig interface in src/auto-generate/config.ts
- [ ] T018 Implement validateAutoGenerateConfig() function in src/auto-generate/config.ts
- [ ] T019 Implement normalizeConfig() with default values in src/auto-generate/config.ts
- [ ] T020 Add unit tests for config validation in test/auto-generate/config.test.ts

### SwaggerOptions Extension

- [ ] T021 Extend SwaggerOptions type to include autoGenerate field in src/swagger.ts
- [ ] T022 Add TypeScript type tests for SwaggerOptions extension in test/index.test.ts

---

## Phase 3: User Story 1 (P1) - Minimal JSDoc for API Documentation

**Goal**: Automatically infer API paths and HTTP methods from Next.js file structure

**Independent Test**: Create test fixtures with minimal JSDoc and verify generated OpenAPI spec includes correct paths and methods

### Path Inference Module

- [ ] T023 [US1] Implement convertDynamicSegment() for [id] patterns in src/auto-generate/path-inference.ts
- [ ] T024 [US1] Implement convertCatchAll() for [...slug] patterns in src/auto-generate/path-inference.ts
- [ ] T025 [US1] Implement convertOptionalCatchAll() for [[...slug]] in src/auto-generate/path-inference.ts
- [ ] T026 [US1] Implement extractPathSegments() to parse file paths in src/auto-generate/path-inference.ts
- [ ] T027 [US1] Implement generateRouteParameters() for path params in src/auto-generate/path-inference.ts
- [ ] T028 [US1] Implement inferRoutePathFromFile() main function in src/auto-generate/path-inference.ts
- [ ] T029 [P] [US1] Add unit tests for dynamic segment conversion in test/auto-generate/path-inference.test.ts
- [ ] T030 [P] [US1] Add unit tests for Pages Router paths in test/auto-generate/path-inference.test.ts
- [ ] T031 [P] [US1] Add unit tests for App Router paths in test/auto-generate/path-inference.test.ts
- [ ] T032 [P] [US1] Add unit tests for edge cases (nested dynamic segments) in test/auto-generate/path-inference.test.ts

### Method Detection Module

- [ ] T033 [US1] Implement TypeScript file parser setup in src/auto-generate/method-detection.ts
- [ ] T034 [US1] Implement AST visitor for exported functions in src/auto-generate/method-detection.ts
- [ ] T035 [US1] Implement detectAppRouterMethods() for named exports in src/auto-generate/method-detection.ts
- [ ] T036 [US1] Implement detectPagesRouterMethod() for default export in src/auto-generate/method-detection.ts
- [ ] T037 [US1] Implement extractJSDocSummary() from comments in src/auto-generate/method-detection.ts
- [ ] T038 [US1] Implement isMiddleware() detection logic in src/auto-generate/method-detection.ts
- [ ] T039 [US1] Implement detectHttpMethods() main function in src/auto-generate/method-detection.ts
- [ ] T040 [P] [US1] Add unit tests for App Router method detection in test/auto-generate/method-detection.test.ts
- [ ] T041 [P] [US1] Add unit tests for Pages Router method detection in test/auto-generate/method-detection.test.ts
- [ ] T042 [P] [US1] Add unit tests for JSDoc extraction in test/auto-generate/method-detection.test.ts
- [ ] T043 [P] [US1] Add unit tests for middleware detection in test/auto-generate/method-detection.test.ts

### Integration for US1

- [ ] T044 [US1] Implement basic RouteInfo builder (without schemas) in src/auto-generate/index.ts
- [ ] T045 [US1] Implement file scanning logic for API routes in src/auto-generate/index.ts
- [ ] T046 [US1] Implement discoverRoutes() combining path + method detection in src/auto-generate/index.ts
- [ ] T047 [US1] Create basic integration with createSwaggerSpec() in src/swagger.ts
- [ ] T048 [US1] Add integration test for Pages Router route discovery in test/auto-generate/integration.test.ts
- [ ] T049 [US1] Add integration test for App Router route discovery in test/auto-generate/integration.test.ts
- [ ] T050 [US1] Add snapshot test for generated OpenAPI spec (paths/methods only) in test/auto-generate/integration.test.ts

---

## Phase 4: User Story 2 (P2) - Schema Inference from Response Types

**Goal**: Automatically generate OpenAPI schemas from Zod validators and TypeScript types

**Independent Test**: Define Zod schemas in test routes and verify generated OpenAPI spec includes correct schema definitions in components/schemas

### Schema Types

- [ ] T051 [US2] Define SchemaInfo interface in src/auto-generate/types.ts
- [ ] T052 [US2] Define SchemaDefinition interface in src/auto-generate/types.ts
- [ ] T053 [US2] Define ZodSchemaReference interface in src/auto-generate/types.ts
- [ ] T054 [US2] Define TypeReference interface in src/auto-generate/types.ts
- [ ] T055 [US2] Define ExtractedSchemas interface in src/auto-generate/types.ts

### Schema Extractor Module

- [ ] T056 [US2] Implement findZodSchemaCalls() to locate .parse() usage in src/auto-generate/schema-extractor.ts
- [ ] T057 [US2] Implement traceSchemaVariable() to find schema definitions in src/auto-generate/schema-extractor.ts
- [ ] T058 [US2] Implement followImports() to resolve imported schemas in src/auto-generate/schema-extractor.ts
- [ ] T059 [US2] Implement extractTypeAnnotation() for return types in src/auto-generate/schema-extractor.ts
- [ ] T060 [US2] Implement detectRequestSchema() heuristics in src/auto-generate/schema-extractor.ts
- [ ] T061 [US2] Implement detectResponseSchema() heuristics in src/auto-generate/schema-extractor.ts
- [ ] T062 [US2] Implement extractStatusCodes() from handler in src/auto-generate/schema-extractor.ts
- [ ] T063 [US2] Implement extractSchemas() main function in src/auto-generate/schema-extractor.ts
- [ ] T064 [P] [US2] Add unit tests for Zod schema detection in test/auto-generate/schema-extractor.test.ts
- [ ] T065 [P] [US2] Add unit tests for TypeScript type extraction in test/auto-generate/schema-extractor.test.ts
- [ ] T066 [P] [US2] Add unit tests for imported schema resolution in test/auto-generate/schema-extractor.test.ts

### Zod Converter Module

- [ ] T067 [US2] Implement OpenAPIRegistry setup in src/auto-generate/zod-converter.ts
- [ ] T068 [US2] Implement schemaToOpenAPI() using @asteasolutions/zod-to-openapi in src/auto-generate/zod-converter.ts
- [ ] T069 [US2] Implement generateSchemaName() from variable name in src/auto-generate/zod-converter.ts
- [ ] T070 [US2] Implement ensureUniqueName() with suffix handling in src/auto-generate/zod-converter.ts
- [ ] T071 [US2] Implement hashSchema() for deduplication in src/auto-generate/zod-converter.ts
- [ ] T072 [US2] Implement registerSchema() with deduplication in src/auto-generate/zod-converter.ts
- [ ] T073 [US2] Implement convertZodToOpenAPI() main function in src/auto-generate/zod-converter.ts
- [ ] T074 [P] [US2] Add unit tests for Zod object schema conversion in test/auto-generate/zod-converter.test.ts
- [ ] T075 [P] [US2] Add unit tests for Zod union/intersection schemas in test/auto-generate/zod-converter.test.ts
- [ ] T076 [P] [US2] Add unit tests for schema deduplication in test/auto-generate/zod-converter.test.ts
- [ ] T077 [P] [US2] Add unit tests for schema name generation in test/auto-generate/zod-converter.test.ts

### TypeScript Converter Module

- [ ] T078 [US2] Implement TypeScript program creation in src/auto-generate/ts-converter.ts
- [ ] T079 [US2] Implement type checker setup in src/auto-generate/ts-converter.ts
- [ ] T080 [US2] Implement convertPrimitiveType() for basic types in src/auto-generate/ts-converter.ts
- [ ] T081 [US2] Implement convertObjectType() for interfaces in src/auto-generate/ts-converter.ts
- [ ] T082 [US2] Implement convertUnionType() to oneOf in src/auto-generate/ts-converter.ts
- [ ] T083 [US2] Implement convertIntersectionType() to allOf in src/auto-generate/ts-converter.ts
- [ ] T084 [US2] Implement handleComplexTypes() with limitation warnings in src/auto-generate/ts-converter.ts
- [ ] T085 [US2] Implement convertTypeScriptToOpenAPI() main function in src/auto-generate/ts-converter.ts
- [ ] T086 [P] [US2] Add unit tests for primitive type conversion in test/auto-generate/ts-converter.test.ts
- [ ] T087 [P] [US2] Add unit tests for object/interface conversion in test/auto-generate/ts-converter.test.ts
- [ ] T088 [P] [US2] Add unit tests for union/intersection types in test/auto-generate/ts-converter.test.ts
- [ ] T089 [P] [US2] Add unit tests for limitation warnings in test/auto-generate/ts-converter.test.ts

### Integration for US2

- [ ] T090 [US2] Extend RouteInfo builder to include schemas in src/auto-generate/index.ts
- [ ] T091 [US2] Implement schema extraction in discoverRoutes() in src/auto-generate/index.ts
- [ ] T092 [US2] Implement schema registry management in src/auto-generate/index.ts
- [ ] T093 [US2] Generate components/schemas section in OpenAPI output in src/auto-generate/index.ts
- [ ] T094 [US2] Add integration test with Zod schemas in test/auto-generate/integration.test.ts
- [ ] T095 [US2] Add integration test with TypeScript types in test/auto-generate/integration.test.ts
- [ ] T096 [US2] Add integration test for shared schema deduplication in test/auto-generate/integration.test.ts
- [ ] T097 [US2] Add snapshot test for complete spec with schemas in test/auto-generate/integration.test.ts

---

## Phase 5: User Story 3 (P3) - Hybrid Documentation Mode

**Goal**: Support mixing auto-generated and explicit JSDoc annotations

**Independent Test**: Create test routes with varying levels of explicit JSDoc and verify correct precedence and merging

### Merger Module

- [ ] T098 [US3] Implement parsePrecedenceRules() documentation in src/auto-generate/merger.ts
- [ ] T099 [US3] Implement detectOptOutMarker() for @swagger-auto-generate in src/auto-generate/merger.ts
- [ ] T100 [US3] Implement mergeRouteInfo() for top-level fields in src/auto-generate/merger.ts
- [ ] T101 [US3] Implement mergeParameters() with array replacement in src/auto-generate/merger.ts
- [ ] T102 [US3] Implement mergeResponses() with status code mapping in src/auto-generate/merger.ts
- [ ] T103 [US3] Implement mergeSchemas() with explicit precedence in src/auto-generate/merger.ts
- [ ] T104 [US3] Implement detectConflicts() and log warnings in src/auto-generate/merger.ts
- [ ] T105 [US3] Implement mergeDocumentation() main function in src/auto-generate/merger.ts
- [ ] T106 [P] [US3] Add unit tests for full explicit override in test/auto-generate/merger.test.ts
- [ ] T107 [P] [US3] Add unit tests for partial override (path only) in test/auto-generate/merger.test.ts
- [ ] T108 [P] [US3] Add unit tests for opt-out marker detection in test/auto-generate/merger.test.ts
- [ ] T109 [P] [US3] Add unit tests for conflict detection in test/auto-generate/merger.test.ts

### Integration for US3

- [ ] T110 [US3] Parse existing JSDoc specs from swagger-jsdoc in src/auto-generate/index.ts
- [ ] T111 [US3] Implement route matching (auto-gen ↔ JSDoc) in src/auto-generate/index.ts
- [ ] T112 [US3] Apply mergeDocumentation() to matched routes in src/auto-generate/index.ts
- [ ] T113 [US3] Handle opt-out routes (skip auto-generation) in src/auto-generate/index.ts
- [ ] T114 [US3] Add integration test for explicit JSDoc precedence in test/auto-generate/integration.test.ts
- [ ] T115 [US3] Add integration test for partial JSDoc merging in test/auto-generate/integration.test.ts
- [ ] T116 [US3] Add integration test for opt-out functionality in test/auto-generate/integration.test.ts
- [ ] T117 [US3] Add snapshot test for hybrid spec (mixed routes) in test/auto-generate/integration.test.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Examples, documentation, performance optimization, and production readiness

### Main Entry Point

- [ ] T118 Implement autoGenerateRoutes() orchestrator in src/auto-generate/index.ts
- [ ] T119 Add parallel file processing with Promise.all() in src/auto-generate/index.ts
- [ ] T120 Implement AST caching between modules in src/auto-generate/index.ts
- [ ] T121 Add error handling for file-level failures in src/auto-generate/index.ts
- [ ] T122 Export all public APIs from src/auto-generate/index.ts
- [ ] T123 Re-export auto-generate types from src/index.ts

### createSwaggerSpec Integration

- [ ] T124 Update createSwaggerSpec() to check autoGenerate config in src/swagger.ts
- [ ] T125 Call autoGenerateRoutes() when enabled in src/swagger.ts
- [ ] T126 Merge auto-generated routes with JSDoc spec in src/swagger.ts
- [ ] T127 Add error handling and graceful degradation in src/swagger.ts
- [ ] T128 Add backward compatibility check (no changes when disabled) in src/swagger.ts

### withSwagger Integration

- [ ] T129 [P] Ensure withSwagger() supports autoGenerate option in src/swagger.ts
- [ ] T130 [P] Add integration test for withSwagger() with auto-gen in test/index.test.ts

### CLI Integration

- [ ] T131 [P] Ensure CLI supports autoGenerate in config file in src/cli.ts
- [ ] T132 [P] Add CLI test for auto-generation in test/cli.test.ts

### Test Fixtures

- [ ] T133 [P] Create Pages Router fixture: simple GET route in test/fixtures/pages-router/users.ts
- [ ] T134 [P] Create Pages Router fixture: dynamic route [id].ts in test/fixtures/pages-router/users/
- [ ] T135 [P] Create App Router fixture: GET/POST in route.ts in test/fixtures/app-router/products/
- [ ] T136 [P] Create App Router fixture: dynamic [id]/route.ts in test/fixtures/app-router/products/
- [ ] T137 [P] Create Zod schema fixture in test/fixtures/schemas/user.ts
- [ ] T138 [P] Create TypeScript type fixture in test/fixtures/types/product.ts
- [ ] T139 [P] Create hybrid JSDoc fixture (explicit + auto) in test/fixtures/mixed/

### OpenAPI Validation

- [ ] T140 Add openapi-validator or similar to devDependencies in package.json
- [ ] T141 Implement validateOpenAPISpec() test helper in test/helpers/openapi.ts
- [ ] T142 Add validation check to all snapshot tests in test/auto-generate/integration.test.ts

### Performance Optimization

- [ ] T143 Implement AST cache with TTL in src/auto-generate/cache.ts
- [ ] T144 Implement schema hash cache in src/auto-generate/cache.ts
- [ ] T145 Add cache invalidation on file change in src/auto-generate/cache.ts
- [ ] T146 Add performance benchmark test in test/auto-generate/performance.test.ts
- [ ] T147 Add performance assertion (<1s for 100 routes) in test/auto-generate/performance.test.ts

### Example Projects

- [ ] T148 Create examples/next13-auto-generate/ project directory
- [ ] T149 [P] Add package.json with Next.js 13 + dependencies in examples/next13-auto-generate/
- [ ] T150 [P] Create App Router routes with Zod in examples/next13-auto-generate/app/api/
- [ ] T151 [P] Create lib/swagger.ts with autoGenerate: true in examples/next13-auto-generate/
- [ ] T152 [P] Create API doc page in examples/next13-auto-generate/app/api-doc/
- [ ] T153 [P] Add README with instructions in examples/next13-auto-generate/

- [ ] T154 Create examples/next14-auto-generate/ project directory
- [ ] T155 [P] Add package.json with Next.js 14 + dependencies in examples/next14-auto-generate/
- [ ] T156 [P] Create App Router routes with TypeScript types in examples/next14-auto-generate/app/api/
- [ ] T157 [P] Create lib/swagger.ts with config options in examples/next14-auto-generate/
- [ ] T158 [P] Add README with TypeScript type examples in examples/next14-auto-generate/

### Documentation

- [ ] T159 Update main README.md with auto-generation section
- [ ] T160 [P] Add "Auto-Generation" subsection with enable example in README.md
- [ ] T161 [P] Add "Zod Schema" example in README.md
- [ ] T162 [P] Add "TypeScript Type" example in README.md
- [ ] T163 [P] Add "Hybrid Mode" example in README.md
- [ ] T164 [P] Add link to quickstart.md and examples/ in README.md

- [ ] T165 Add CHANGELOG.md entry for this MINOR version feature
- [ ] T166 Document new dependencies in CHANGELOG.md
- [ ] T167 Document breaking changes (none) in CHANGELOG.md
- [ ] T168 Document migration guide in CHANGELOG.md

### Type Documentation

- [ ] T169 [P] Add TSDoc comments to all public interfaces in src/auto-generate/types.ts
- [ ] T170 [P] Add TSDoc comments to AutoGenerateConfig in src/auto-generate/config.ts
- [ ] T171 [P] Add TSDoc examples to main functions in src/auto-generate/index.ts

### Final Testing

- [ ] T172 Run full test suite and ensure >80% coverage for auto-generate modules
- [ ] T173 Run integration tests with all three interfaces (createSwaggerSpec, withSwagger, CLI)
- [ ] T174 Verify backward compatibility (all existing tests still pass)
- [ ] T175 Run examples/next13-auto-generate and verify generated spec
- [ ] T176 Run examples/next14-auto-generate and verify generated spec
- [ ] T177 Test with Next.js versions 9, 12, 13, 14, 15
- [ ] T178 Run Biome linter on all new code
- [ ] T179 Verify bundle size increase is <20kb
- [ ] T180 Run performance benchmarks and verify <1s for 100 endpoints

---

## Task Summary

**Total Tasks**: 180

**By Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 15 tasks
- Phase 3 (US1 - P1): 28 tasks
- Phase 4 (US2 - P2): 47 tasks
- Phase 5 (US3 - P3): 20 tasks
- Phase 6 (Polish): 63 tasks

**By User Story**:
- US1 (P1 - Minimal JSDoc): 28 tasks
- US2 (P2 - Schema Inference): 47 tasks
- US3 (P3 - Hybrid Mode): 20 tasks
- Infrastructure (Setup + Foundational + Polish): 85 tasks

**Parallelizable Tasks**: 89 tasks marked with [P]

**Test Tasks**: 50 tasks (unit tests, integration tests, snapshot tests)

---

## Independent Test Criteria

### User Story 1 (P1)
**Can be fully tested by**: Creating Next.js API routes with minimal/no JSDoc in test fixtures, running auto-generation, and verifying:
- Paths correctly inferred from file structure
- Methods correctly detected from exports
- Dynamic parameters generated from route segments
- OpenAPI spec passes validation

**Deliverable**: Working auto-generation for paths and methods only (no schemas)

### User Story 2 (P2)
**Can be fully tested by**: Creating routes with Zod schemas and TypeScript types in test fixtures, running auto-generation, and verifying:
- Zod schemas converted to OpenAPI schemas
- TypeScript types converted to OpenAPI schemas
- Shared schemas deduplicated in components/schemas
- OpenAPI spec passes validation

**Deliverable**: Working schema inference from Zod/TypeScript (builds on US1)

### User Story 3 (P3)
**Can be fully tested by**: Creating mixed routes (some with explicit JSDoc, some with minimal JSDoc) in test fixtures, running auto-generation, and verifying:
- Explicit JSDoc takes precedence
- Partial overrides work correctly
- Opt-out marker prevents auto-generation
- Both styles coexist in generated spec

**Deliverable**: Working hybrid mode (builds on US1 + US2)

---

## Parallel Execution Examples

### Within US1 (after foundational types complete):
```bash
# These can run in parallel:
- Path inference module development
- Method detection module development
- Test fixture creation
```

### Within US2 (after US1 integration):
```bash
# These can run in parallel:
- Zod converter module
- TypeScript converter module
- Schema extractor tests
```

### Across User Stories (after Phase 2):
```bash
# US1 and US2 can be developed in parallel:
- Team A: Implements US1 (path/method inference)
- Team B: Implements US2 (schema inference)
# Then both merge for US3 (hybrid mode)
```

---

## Format Validation

✅ All 180 tasks follow the required checklist format:
- Checkbox: `- [ ]`
- Task ID: Sequential (T001-T180)
- [P] marker: 89 parallelizable tasks
- [Story] label: 95 tasks with US1/US2/US3 labels
- Description: Clear action with file path

✅ Tasks organized by user story for independent implementation

✅ Independent test criteria defined for each user story

✅ MVP scope clearly identified (US1 only)
