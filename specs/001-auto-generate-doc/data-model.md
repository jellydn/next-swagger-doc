# Data Model: Automatic OpenAPI Documentation Generation

**Feature**: 001-auto-generate-doc
**Date**: 2025-11-05
**Purpose**: Define core entities, their attributes, relationships, and validation rules

---

## Core Entities

### 1. RouteInfo

Represents a discovered Next.js API route with inferred or explicit documentation.

**Attributes**:
- `filePath: string` - Absolute path to the route file
- `routePath: string` - OpenAPI path (e.g., "/api/users/{id}")
- `method: HttpMethod` - HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- `routerType: 'pages' | 'app'` - Which Next.js router pattern
- `handler: HandlerInfo` - Information about the handler function
- `parameters: RouteParameter[]` - Path/query/header parameters
- `requestBody?: SchemaInfo` - Request body schema (if applicable)
- `responses: Record<number, ResponseInfo>` - Response definitions by status code
- `security?: SecurityRequirement[]` - Security requirements (if any)
- `tags?: string[]` - OpenAPI tags for grouping
- `summary?: string` - Brief description
- `description?: string` - Detailed description
- `deprecated?: boolean` - Whether route is deprecated

**Relationships**:
- Has one HandlerInfo
- Has many RouteParameter
- Has one optional SchemaInfo for request body
- Has many ResponseInfo
- References SchemaDefinition entities via SchemaInfo

**Validation Rules**:
- filePath must be absolute and exist
- routePath must start with /api
- method must be valid HTTP method
- At least one response (typically 200) must be defined
- Parameters with `in: 'path'` must appear in routePath

**State Transitions**:
1. Discovered (file found, not yet parsed)
2. Parsed (AST analyzed, handler extracted)
3. Documented (schemas extracted, OpenAPI generated)
4. Merged (combined with explicit JSDoc if present)

---

### 2. HandlerInfo

Represents the actual handler function in a route file.

**Attributes**:
- `exportType: 'default' | 'named'` - How handler is exported
- `functionName: string` - Name of the handler function
- `isAsync: boolean` - Whether handler is async
- `sourceLocation: SourceLocation` - Line/column in file
- `zodSchemas: ZodSchemaReference[]` - Zod schemas used in handler
- `typeAnnotations: TypeReference[]` - TypeScript type references

**Relationships**:
- Belongs to one RouteInfo
- References many ZodSchemaReference
- References many TypeReference

**Validation Rules**:
- Named exports must match HTTP method names (GET, POST, etc.)
- Default exports only valid for Pages Router

---

### 3. SchemaInfo

Represents a schema (request body or response body) with its source.

**Attributes**:
- `source: 'zod' | 'typescript' | 'explicit' | 'inferred'` - How schema was determined
- `schemaRef?: string` - OpenAPI $ref if reusable component
- `inlineSchema?: OpenAPISchema` - Inline schema object
- `zodSchema?: ZodSchemaReference` - Reference to Zod schema (if source is 'zod')
- `typeReference?: TypeReference` - Reference to TS type (if source is 'typescript')
- `contentType: string` - Media type (e.g., "application/json")

**Relationships**:
- May reference one SchemaDefinition (if reusable)
- May reference one ZodSchemaReference
- May reference one TypeReference
- Used by RouteInfo for requestBody
- Used by ResponseInfo for response body

**Validation Rules**:
- Must have either schemaRef OR inlineSchema, not both
- If source is 'zod', must have zodSchema
- If source is 'typescript', must have typeReference
- contentType must be valid MIME type

---

### 4. SchemaDefinition

Represents a reusable schema registered in OpenAPI components/schemas.

**Attributes**:
- `name: string` - Unique name in components/schemas
- `schema: OpenAPISchema` - The actual OpenAPI schema object
- `sourceHash: string` - Hash of source schema for deduplication
- `usageCount: number` - How many routes reference this schema
- `sourceType: 'zod' | 'typescript' | 'explicit'` - Origin of schema
- `zodSchemaName?: string` - Original Zod variable name (if from Zod)
- `typeScriptTypeName?: string` - Original TS type name (if from TS)

**Relationships**:
- Referenced by many SchemaInfo entities via $ref
- May originate from ZodSchemaReference
- May originate from TypeReference

**Validation Rules**:
- name must be unique within components/schemas
- name must be valid OpenAPI component name (no special chars except _ and -)
- schema must be valid OpenAPI 3.0 schema object
- usageCount >= number of actual references

**Deduplication**:
- Schemas with same sourceHash are consolidated
- First registered name is kept
- Subsequent duplicates get $ref to first

---

### 5. ZodSchemaReference

Represents a reference to a Zod schema found in source code.

**Attributes**:
- `variableName: string` - Name of variable holding Zod schema
- `filePath: string` - File where schema is defined
- `sourceLocation: SourceLocation` - Location in file
- `schemaExpression: string` - Source code of schema definition
- `zodObject: any` - Actual Zod schema object (if evaluatable)
- `isImported: boolean` - Whether imported from another file
- `importPath?: string` - Import path if isImported is true

**Relationships**:
- Used by HandlerInfo to track Zod usage
- Used by SchemaInfo to generate OpenAPI schema
- May result in SchemaDefinition

**Validation Rules**:
- variableName must be valid JS identifier
- If isImported, must have importPath
- schemaExpression must be parseable Zod code

---

### 6. TypeReference

Represents a TypeScript type annotation found in source code.

**Attributes**:
- `typeName: string` - Name of the type
- `filePath: string` - File where type is defined
- `sourceLocation: SourceLocation` - Location in file
- `typeDefinition: string` - Source code of type definition
- `isImported: boolean` - Whether imported from another file
- `importPath?: string` - Import path if isImported is true
- `typeKind: 'interface' | 'type' | 'class' | 'inferred'` - Kind of type

**Relationships**:
- Used by HandlerInfo to track type annotations
- Used by SchemaInfo to generate OpenAPI schema
- May result in SchemaDefinition

**Validation Rules**:
- typeName must be valid TypeScript identifier
- If isImported, must have importPath
- typeDefinition must be valid TypeScript code

---

### 7. RouteParameter

Represents a parameter (path, query, header, cookie) for a route.

**Attributes**:
- `name: string` - Parameter name
- `in: 'path' | 'query' | 'header' | 'cookie'` - Parameter location
- `required: boolean` - Whether parameter is required
- `schema: OpenAPISchema` - Parameter schema
- `description?: string` - Parameter description
- `example?: any` - Example value
- `deprecated?: boolean` - Whether parameter is deprecated

**Relationships**:
- Belongs to one RouteInfo
- May be auto-generated from dynamic path segments

**Validation Rules**:
- name must not be empty
- Path parameters (in: 'path') must be required
- Path parameters must appear in the route path as {name}
- schema must be valid OpenAPI schema

---

### 8. ResponseInfo

Represents a response definition for a specific status code.

**Attributes**:
- `statusCode: number` - HTTP status code (200, 404, 500, etc.)
- `description: string` - Response description
- `content?: Record<string, SchemaInfo>` - Response body schemas by content type
- `headers?: Record<string, HeaderInfo>` - Response headers

**Relationships**:
- Belongs to one RouteInfo
- Has many SchemaInfo (one per content type)
- Has many HeaderInfo

**Validation Rules**:
- statusCode must be valid HTTP status code (100-599)
- description must not be empty
- At least one content type should be defined for success responses

---

### 9. AutoGenerateConfig

Represents configuration options for auto-generation feature.

**Attributes**:
- `enabled: boolean` - Master switch for auto-generation
- `zodSchemaFolders?: string[]` - Folders to scan for Zod schemas
- `includeTypeScript: boolean` - Whether to extract TypeScript types
- `routerTypes: ('pages' | 'app')[]` - Which router types to process
- `inferDescriptions: boolean` - Whether to infer descriptions from code comments
- `componentReuse: boolean` - Whether to deduplicate schemas
- `defaultResponses: boolean` - Whether to add default error responses (400, 500)
- `excludePatterns?: string[]` - Glob patterns to exclude from scanning
- `performance: PerformanceConfig` - Performance tuning options

**Relationships**:
- Used by auto-generation engine
- Validated at startup

**Validation Rules**:
- If enabled is false, other options are ignored
- zodSchemaFolders must be valid directory paths if specified
- excludePatterns must be valid glob patterns
- At least one routerType must be enabled

**Default Values**:
```typescript
{
  enabled: false, // Opt-in
  includeTypeScript: true,
  routerTypes: ['pages', 'app'],
  inferDescriptions: true,
  componentReuse: true,
  defaultResponses: false,
}
```

---

### 10. PerformanceConfig

Represents performance tuning options for auto-generation.

**Attributes**:
- `cacheEnabled: boolean` - Enable AST caching
- `cacheTTL: number` - Cache time-to-live in milliseconds
- `parallelism: number` - Number of parallel file processors
- `maxFileSize: number` - Maximum file size to parse (bytes)
- `timeoutPerFile: number` - Timeout for parsing single file (ms)

**Validation Rules**:
- parallelism must be > 0 and <= CPU cores
- maxFileSize must be > 0
- timeoutPerFile must be > 0 and < 30000 (30 seconds)

---

## Supporting Types

### SourceLocation
```typescript
{
  line: number;    // Line number (1-indexed)
  column: number;  // Column number (0-indexed)
  endLine?: number;
  endColumn?: number;
}
```

### OpenAPISchema
Standard OpenAPI 3.0 schema object (imported from openapi types).

### HttpMethod
```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
```

### SecurityRequirement
Standard OpenAPI security requirement object.

### HeaderInfo
```typescript
{
  description?: string;
  required: boolean;
  schema: OpenAPISchema;
  deprecated?: boolean;
}
```

---

## Entity Relationships Diagram

```
AutoGenerateConfig
    |
    | configures
    v
[Auto-Generation Engine]
    |
    | discovers
    v
RouteInfo (1) ----has----> (1) HandlerInfo
    |                           |
    | has many                  | uses many
    v                           v
RouteParameter         ZodSchemaReference
    |                           |
    | describes                 | may create
    v                           v
(path/query params)       SchemaDefinition
    |                           ^
RouteInfo                       |
    |                           | references
    | has many                  |
    v                           |
ResponseInfo -------uses------> SchemaInfo
    |                               |
    | has many                      | may reference
    v                               v
HeaderInfo                     SchemaDefinition
                                    ^
                                    |
TypeReference --may create----------+
```

---

## Schema Evolution

### Version 1 (MVP - User Story P1)
- RouteInfo, HandlerInfo, RouteParameter
- Basic auto-generation without schema extraction
- Path and method inference only

### Version 2 (User Story P2)
- SchemaInfo, SchemaDefinition, ZodSchemaReference
- Zod schema extraction and conversion
- Component reuse and deduplication

### Version 3 (User Story P3)
- Merging logic with explicit JSDoc
- Configuration options for hybrid mode
- TypeReference and TypeScript type extraction

---

## Summary

This data model supports all three user stories:

- **P1 (Minimal JSDoc)**: RouteInfo, HandlerInfo, RouteParameter - core path/method inference
- **P2 (Schema Inference)**: SchemaInfo, SchemaDefinition, ZodSchemaReference, TypeReference - schema extraction
- **P3 (Hybrid Mode)**: Merging logic between auto-generated and explicit documentation

All entities support the constitution requirements:
- ✅ Type-safe (all entities are TypeScript interfaces)
- ✅ Testable (clear validation rules)
- ✅ Extensible (can add fields without breaking changes)
- ✅ Performance-aware (caching and lazy loading built into model)
