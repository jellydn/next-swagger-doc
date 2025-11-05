# Feature Specification: Automatic OpenAPI Documentation Generation

**Feature Branch**: `001-auto-generate-doc`
**Created**: 2025-11-05
**Status**: Draft
**Input**: User description: "auto generate doc https://github.com/jellydn/next-swagger-doc/issues/809"

## User Scenarios & Testing

### User Story 1 - Minimal JSDoc for API Documentation (Priority: P1)

As a Next.js developer, I want to document my API routes with minimal JSDoc comments (just descriptions and response schemas) without manually specifying HTTP methods and paths, so that I can reduce boilerplate and maintain documentation more easily.

**Why this priority**: This is the core value proposition from issue #809. Developers spend significant time writing verbose JSDoc annotations that duplicate information already present in the code structure (file paths, exported function names). Automating this reduces maintenance burden and potential for documentation drift.

**Independent Test**: Can be fully tested by creating a Next.js API route with minimal JSDoc (description only) and verifying the generated OpenAPI spec includes the correct path, method, and description without explicit annotations.

**Acceptance Scenarios**:

1. **Given** a Next.js API route at `pages/api/users/index.ts` with a GET handler and minimal JSDoc, **When** spec generation runs, **Then** the OpenAPI spec includes path `/api/users` with GET method
2. **Given** a Next.js App Router route at `app/api/products/route.ts` with exported GET and POST functions, **When** spec generation runs, **Then** the OpenAPI spec includes both methods for `/api/products`
3. **Given** an API route with only a description in JSDoc, **When** spec generation runs, **Then** the path and method are automatically inferred from file location and function name
4. **Given** a Next.js API route with no JSDoc at all, **When** spec generation runs, **Then** a basic OpenAPI entry is created with inferred path and method

---

### User Story 2 - Schema Inference from Response Types (Priority: P2)

As a developer using TypeScript with Next.js, I want response schemas to be automatically generated from my return types and validation schemas (like Zod), so that I don't need to manually write schema definitions in JSDoc.

**Why this priority**: Manual schema documentation is error-prone and becomes outdated quickly. Developers already define schemas in code (TypeScript types, Zod schemas). Automatically deriving OpenAPI schemas from these definitions ensures accuracy and reduces duplication.

**Independent Test**: Can be tested by defining a Zod schema for an API response, using it in the handler, and verifying the generated OpenAPI spec includes the correct schema definition without manual JSDoc schema annotations.

**Acceptance Scenarios**:

1. **Given** an API route that returns a response validated by a Zod schema, **When** spec generation runs, **Then** the OpenAPI spec includes the schema converted to JSON Schema format
2. **Given** an API route with TypeScript return type annotation, **When** spec generation runs, **Then** the OpenAPI spec includes a schema derived from the TypeScript type
3. **Given** an API route using Zod schema for both request and response, **When** spec generation runs, **Then** both request body and response schemas are automatically included in the spec
4. **Given** multiple API routes sharing a common Zod schema, **When** spec generation runs, **Then** the schema is defined once in OpenAPI components and referenced by all routes

---

### User Story 3 - Hybrid Documentation Mode (Priority: P3)

As a developer with existing JSDoc-annotated APIs, I want the auto-generation feature to work alongside my existing explicit annotations, so that I can gradually adopt the new approach without breaking existing documentation.

**Why this priority**: Backward compatibility is essential for adoption. Existing projects have invested time in manual JSDoc annotations. The feature should enhance rather than replace existing workflows, allowing teams to migrate incrementally.

**Independent Test**: Can be tested by creating a mix of APIs - some with full JSDoc annotations and some with minimal annotations - and verifying all are correctly represented in the generated spec without conflicts.

**Acceptance Scenarios**:

1. **Given** an API route with explicit `@swagger` path and method annotations, **When** auto-generation is enabled, **Then** the explicit annotations take precedence over inferred values
2. **Given** an API route with partial JSDoc (method specified, path inferred), **When** spec generation runs, **Then** the spec combines explicit and inferred information correctly
3. **Given** a project with both old-style and new-style documented routes, **When** spec generation runs, **Then** both styles coexist in the generated OpenAPI spec
4. **Given** an API route with `@auto-generate: false` annotation, **When** spec generation runs, **Then** that route is skipped by auto-generation and only uses explicit JSDoc

---

### Edge Cases

- What happens when file-based routing path contains dynamic segments (e.g., `[id].ts`)?
- How does the system handle API routes in different routing systems (Pages Router vs App Router)?
- What happens when a route file exports multiple HTTP method handlers (GET, POST, PUT, DELETE)?
- How are nested route folders translated to API paths?
- What happens when a Zod schema contains complex types (unions, intersections, recursive types)?
- How does the system handle middleware functions vs actual route handlers?
- What happens when TypeScript types are too complex to convert to JSON Schema?
- How are route handlers with multiple response codes documented (200, 404, 500)?

## Requirements

### Functional Requirements

- **FR-001**: System MUST automatically infer API endpoint paths from Next.js file structure (both Pages Router and App Router patterns)
- **FR-002**: System MUST automatically detect HTTP methods from exported function names (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- **FR-003**: System MUST support Zod schema integration via zod-to-openapi for automatic schema generation
- **FR-004**: System MUST maintain backward compatibility with existing explicit JSDoc `@swagger` annotations
- **FR-005**: System MUST allow explicit annotations to override automatically inferred values
- **FR-006**: System MUST generate response schemas from Zod validators when present in API route code
- **FR-007**: System MUST extract JSDoc description comments even when path and method are not specified
- **FR-008**: System MUST handle dynamic route segments (e.g., `[id]`, `[...slug]`) in path generation
- **FR-009**: System MUST provide a configuration option to enable/disable auto-generation (opt-in for backward compatibility)
- **FR-010**: System MUST support TypeScript type inference as a fallback when Zod schemas are not present
- **FR-011**: System MUST handle Next.js middleware functions without treating them as API endpoints
- **FR-012**: System MUST generate appropriate OpenAPI parameter definitions for path parameters from dynamic segments
- **FR-013**: System MUST support per-route opt-out of auto-generation via annotation or configuration
- **FR-014**: System MUST aggregate reusable schemas in OpenAPI components section to avoid duplication

### Key Entities

- **API Route**: A Next.js file exporting HTTP handlers, located in `pages/api/` or `app/api/` directories
- **HTTP Method Handler**: An exported function (GET, POST, etc.) or default export handler in an API route file
- **Zod Schema**: A runtime validation schema defined using the Zod library, used for request/response validation
- **OpenAPI Path**: The URL path extracted from file system structure (/api/users/[id] becomes /api/users/{id})
- **Schema Definition**: A reusable OpenAPI schema component generated from Zod schemas or TypeScript types
- **JSDoc Override**: An explicit `@swagger` annotation that takes precedence over auto-generated values

## Success Criteria

### Measurable Outcomes

- **SC-001**: Developers can create fully documented APIs with only JSDoc descriptions (no manual path/method annotations), reducing documentation code by at least 60%
- **SC-002**: API routes using Zod schemas automatically generate accurate OpenAPI schemas without manual schema definitions
- **SC-003**: Existing projects with manual JSDoc annotations continue to work without modifications when auto-generation is enabled
- **SC-004**: Generated OpenAPI specifications pass OpenAPI 3.0 validation for both auto-generated and manually annotated routes
- **SC-005**: Documentation generation time remains under 1 second for projects with up to 100 API endpoints
- **SC-006**: 90% of common API patterns (CRUD operations with standard responses) require zero manual schema documentation

## Assumptions

- Developers using this feature will have Zod schemas defined in their codebase or use TypeScript types
- The feature will be opt-in initially to avoid breaking existing workflows
- Projects follow standard Next.js routing conventions (no custom server implementations with non-standard routing)
- API route files follow naming conventions (exported functions match HTTP methods, or use Next.js handler export patterns)
- The zod-to-openapi library will be used for Zod schema conversion (as suggested in issue #809)
- Projects using this feature are on Next.js >= 9 as per the project's compatibility requirements
- Most APIs have relatively simple response schemas that can be represented in OpenAPI format

## Out of Scope

- Automatic generation of request body schemas from validation middleware other than Zod
- Support for GraphQL endpoints (only REST APIs via Next.js routes)
- Automatic generation of API examples or mock data
- Runtime request/response validation (only documentation generation)
- Support for custom HTTP methods beyond standard REST methods
- Automatic detection of authentication requirements (must still be annotated manually or configured globally)
- Migration tooling to convert existing verbose JSDoc to minimal format
