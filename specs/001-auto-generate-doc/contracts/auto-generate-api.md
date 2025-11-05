# API Contracts: Auto-Generation Internal APIs

**Feature**: 001-auto-generate-doc
**Date**: 2025-11-05
**Purpose**: Define internal API contracts for auto-generation modules

---

## Module: path-inference.ts

### Purpose
Extract OpenAPI paths from Next.js file structure, handling both Pages Router and App Router patterns.

### Public API

#### `inferRoutePathFromFile(filePath: string): RoutePathInfo`

Converts a Next.js route file path to an OpenAPI path.

**Input**:
```typescript
{
  filePath: string; // e.g., "/project/pages/api/users/[id].ts"
}
```

**Output**:
```typescript
{
  routePath: string;         // e.g., "/api/users/{id}"
  parameters: RouteParameter[]; // Inferred path parameters
  routerType: 'pages' | 'app';
  isValid: boolean;          // false if not a valid route file
  error?: string;            // Error message if invalid
}
```

**Logic**:
1. Determine router type from file path (`pages/api/` vs `app/api/`)
2. Extract path segments after `/api/`
3. Convert dynamic segments: `[id]` → `{id}`, `[...slug]` → `{slug}`
4. Generate parameter definitions for each dynamic segment
5. Return normalized OpenAPI path

**Examples**:
```typescript
// Pages Router
inferRoutePathFromFile("/project/pages/api/users.ts")
// → { routePath: "/api/users", parameters: [], routerType: "pages" }

// App Router with dynamic segment
inferRoutePathFromFile("/project/app/api/users/[id]/route.ts")
// → { routePath: "/api/users/{id}", parameters: [{ name: "id", in: "path", ... }] }

// Catch-all
inferRoutePathFromFile("/project/pages/api/docs/[...slug].ts")
// → { routePath: "/api/docs/{slug}", parameters: [{ name: "slug", in: "path", schema: { type: "array" } }] }
```

**Error Cases**:
- File not in `pages/api/` or `app/api/`: `{ isValid: false, error: "Not an API route" }`
- Invalid dynamic segment syntax: `{ isValid: false, error: "Malformed dynamic segment" }`

---

## Module: method-detection.ts

### Purpose
Detect HTTP methods from exported functions in route files using AST parsing.

### Public API

#### `detectHttpMethods(filePath: string): MethodDetectionResult`

Parses a route file and extracts all exported HTTP method handlers.

**Input**:
```typescript
{
  filePath: string; // Absolute path to route file
}
```

**Output**:
```typescript
{
  methods: HttpMethodInfo[];
  routerType: 'pages' | 'app';
  parseError?: string;
}

interface HttpMethodInfo {
  method: HttpMethod;
  handler: HandlerInfo;
  hasJSDoc: boolean;        // Whether handler has JSDoc comment
  jsdocSummary?: string;    // Extracted JSDoc summary
}
```

**Logic**:
1. Parse file with TypeScript Compiler API
2. Find all exported functions
3. **Pages Router**: Default export → analyze req.method checks or default to GET
4. **App Router**: Named exports (GET, POST, etc.) → method from export name
5. Extract JSDoc comments if present
6. Return list of detected methods

**Examples**:
```typescript
// App Router
detectHttpMethods("/project/app/api/users/route.ts")
// File exports: export async function GET() {...}, export async function POST() {...}
// → { methods: [{ method: "GET", ... }, { method: "POST", ... }], routerType: "app" }

// Pages Router
detectHttpMethods("/project/pages/api/user.ts")
// File exports: export default function handler(req, res) {...}
// → { methods: [{ method: "GET", ... }], routerType: "pages" }
```

**Error Cases**:
- Syntax error in file: `{ methods: [], parseError: "TS parsing failed: ..." }`
- No exports found: `{ methods: [] }` (not an error, just skip file)
- Middleware file: `{ methods: [] }` (detected and skipped)

---

## Module: schema-extractor.ts

### Purpose
Extract Zod schemas and TypeScript types from route handler source code.

### Public API

#### `extractSchemas(filePath: string, handler: HandlerInfo): ExtractedSchemas`

Analyzes handler code to find request/response schemas.

**Input**:
```typescript
{
  filePath: string;
  handler: HandlerInfo; // From method-detection
}
```

**Output**:
```typescript
{
  requestSchema?: SchemaInfo;
  responseSchemas: Map<number, SchemaInfo>; // Status code → schema
  zodReferences: ZodSchemaReference[];
  typeReferences: TypeReference[];
}
```

**Logic**:
1. Parse handler function AST
2. Look for Zod schema usage (`.parse()`, `.safeParse()`)
3. Track variable containing Zod schema (trace back to definition)
4. Extract TypeScript return type annotation
5. Find response status codes (res.status(200), NextResponse with status)
6. Map schemas to appropriate request/response slots

**Heuristics**:
- Request schema: Zod schema used on `req.body` or `request.json()`
- Response schema: Return type annotation or Zod schema in response
- Status codes: Literal values in `res.status()` or `NextResponse` constructor

**Examples**:
```typescript
// File content:
// const UserSchema = z.object({ name: z.string() });
// export async function POST(request: Request) {
//   const body = UserSchema.parse(await request.json());
//   return NextResponse.json(body, { status: 201 });
// }

extractSchemas("/project/app/api/users/route.ts", postHandler)
// → {
//     requestSchema: { source: "zod", zodSchema: UserSchema ref },
//     responseSchemas: Map { 201 => { source: "zod", zodSchema: UserSchema ref } },
//     zodReferences: [{ variableName: "UserSchema", ... }]
//   }
```

**Edge Cases**:
- No schemas found: Return empty arrays/maps (not an error)
- Imported schemas: Follow imports to other files
- Complex expressions: Best-effort extraction, may miss some schemas

---

## Module: zod-converter.ts

### Purpose
Convert Zod schemas to OpenAPI schemas using @asteasolutions/zod-to-openapi.

### Public API

#### `convertZodToOpenAPI(zodRef: ZodSchemaReference, registry: OpenAPIRegistry): SchemaDefinition`

Converts a Zod schema reference to an OpenAPI schema definition.

**Input**:
```typescript
{
  zodRef: ZodSchemaReference;
  registry: OpenAPIRegistry; // For component registration
}
```

**Output**:
```typescript
{
  name: string;              // Unique component name
  schema: OpenAPISchema;     // OpenAPI schema object
  ref: string;               // $ref path
  sourceHash: string;        // For deduplication
}
```

**Logic**:
1. Load Zod schema from file (eval or static analysis)
2. Use @asteasolutions/zod-to-openapi to convert
3. Generate unique name (from variable name or structure)
4. Register in OpenAPIRegistry
5. Return schema definition with $ref

**Examples**:
```typescript
const zodRef = {
  variableName: "UserSchema",
  schemaExpression: "z.object({ id: z.string(), name: z.string() })"
};

convertZodToOpenAPI(zodRef, registry)
// → {
//     name: "User",
//     schema: { type: "object", properties: { id: { type: "string" }, ... } },
//     ref: "#/components/schemas/User",
//     sourceHash: "abc123..."
//   }
```

**Error Handling**:
- Invalid Zod schema: Throw with helpful error message
- Duplicate names: Append suffix (User2, User3)
- Unsupported Zod features: Log warning, generate basic schema

---

## Module: ts-converter.ts

### Purpose
Convert TypeScript types to OpenAPI schemas (fallback when Zod not available).

### Public API

#### `convertTypeScriptToOpenAPI(typeRef: TypeReference, program: ts.Program): SchemaDefinition`

Converts a TypeScript type to an OpenAPI schema.

**Input**:
```typescript
{
  typeRef: TypeReference;
  program: ts.Program; // TS compiler program for type information
}
```

**Output**:
```typescript
{
  name: string;
  schema: OpenAPISchema;
  ref: string;
  sourceHash: string;
  limitations?: string[]; // Warnings about conversion limitations
}
```

**Logic**:
1. Use TypeScript Compiler API to get type information
2. Convert primitive types directly
3. Convert object types to OpenAPI object schemas
4. Handle unions as oneOf, intersections as allOf
5. Record limitations for complex types (generics, conditionals)

**Examples**:
```typescript
// Type: { id: string; count: number; }
convertTypeScriptToOpenAPI(typeRef, program)
// → {
//     name: "InferredType1",
//     schema: { type: "object", properties: { id: { type: "string" }, count: { type: "number" } } },
//     ...
//   }
```

**Limitations**:
- Generic types: May lose type parameters
- Conditional types: Cannot represent in OpenAPI
- Complex unions: May require manual documentation
- Function types: Cannot convert (error thrown)

---

## Module: merger.ts

### Purpose
Merge auto-generated documentation with explicit JSDoc annotations.

### Public API

#### `mergeDocumentation(autoGen: RouteInfo, explicit: Partial<RouteInfo>): RouteInfo`

Combines auto-generated and explicit documentation with correct precedence.

**Input**:
```typescript
{
  autoGen: RouteInfo;         // From auto-generation
  explicit: Partial<RouteInfo>; // From JSDoc parsing
}
```

**Output**:
```typescript
RouteInfo // Merged result
```

**Precedence Rules**:
1. Explicit values always override auto-generated
2. Missing explicit fields use auto-generated values
3. Partial overrides supported (e.g., explicit path, auto-generated schemas)
4. Arrays/objects are replaced entirely, not merged element-wise

**Examples**:
```typescript
const autoGen = {
  routePath: "/api/users/{id}",
  method: "GET",
  responses: { 200: { ... } }
};

const explicit = {
  summary: "Get user by ID",
  responses: { 200: { description: "User object" } }
};

mergeDocumentation(autoGen, explicit)
// → {
//     routePath: "/api/users/{id}",  // from auto-gen
//     method: "GET",                  // from auto-gen
//     summary: "Get user by ID",      // from explicit
//     responses: { 200: { description: "User object" } } // from explicit (entirely replaced)
//   }
```

**Special Cases**:
- `@swagger-auto-generate false` in JSDoc: Skip auto-generation entirely
- Conflicting values: Log warning, use explicit value
- Empty explicit object: Use all auto-generated

---

## Module: config.ts

### Purpose
Configuration types and validation for auto-generation feature.

### Public API

#### `validateAutoGenerateConfig(config: Partial<AutoGenerateConfig>): ValidatedConfig`

Validates and normalizes configuration options.

**Input**:
```typescript
{
  enabled?: boolean;
  zodSchemaFolders?: string[];
  // ... other config options
}
```

**Output**:
```typescript
{
  config: AutoGenerateConfig; // Normalized with defaults
  errors: string[];           // Validation errors
  warnings: string[];         // Non-fatal warnings
}
```

**Validation Rules**:
- Paths must exist and be absolute
- Glob patterns must be valid
- Numeric values must be in acceptable ranges
- Boolean flags have no validation

**Defaults Applied**:
```typescript
{
  enabled: false,
  includeTypeScript: true,
  routerTypes: ['pages', 'app'],
  inferDescriptions: true,
  componentReuse: true,
  defaultResponses: false,
  performance: {
    cacheEnabled: true,
    cacheTTL: 5000,
    parallelism: 4,
    maxFileSize: 1024 * 1024, // 1MB
    timeoutPerFile: 5000
  }
}
```

---

## Module: index.ts (auto-generate/)

### Purpose
Main entry point coordinating all auto-generation modules.

### Public API

#### `autoGenerateRoutes(apiFolder: string, config: AutoGenerateConfig): RouteInfo[]`

Main orchestration function that generates documentation for all routes in a folder.

**Input**:
```typescript
{
  apiFolder: string;            // e.g., "pages/api" or "app/api"
  config: AutoGenerateConfig;   // Validated configuration
}
```

**Output**:
```typescript
RouteInfo[] // All discovered and documented routes
```

**Orchestration Flow**:
1. Scan apiFolder for route files (recursively)
2. Filter out excluded files (middleware, etc.)
3. For each file in parallel:
   a. Infer path (path-inference)
   b. Detect methods (method-detection)
   c. Extract schemas (schema-extractor)
   d. Convert schemas (zod-converter, ts-converter)
4. Deduplicate schemas across routes
5. Generate final RouteInfo objects
6. Return array of all routes

**Performance Optimizations**:
- Parallel file processing
- AST caching between method detection and schema extraction
- Schema deduplication to reduce registry size
- Early bailout for excluded patterns

**Error Handling**:
- File-level errors: Log warning, skip file, continue
- Parse errors: Log with file location, skip file
- Schema conversion errors: Use fallback schema, log warning

---

## Integration with Existing API

### SwaggerOptions Extension

```typescript
export type SwaggerOptions = Options & {
  apiFolder?: string;
  schemaFolders?: string[];
  definition: OAS3Definition;
  outputFile?: string;
  autoGenerate?: boolean | AutoGenerateConfig; // NEW
};
```

### createSwaggerSpec Enhancement

```typescript
export function createSwaggerSpec(options: SwaggerOptions) {
  // Existing swagger-jsdoc logic
  const jsdocSpec = swaggerJsdoc(jsdocOptions);

  // NEW: Auto-generation if enabled
  if (options.autoGenerate) {
    const config = normalizeConfig(options.autoGenerate);
    const autoGenRoutes = autoGenerateRoutes(options.apiFolder, config);
    const mergedSpec = mergeSpecs(jsdocSpec, autoGenRoutes);
    return mergedSpec;
  }

  return jsdocSpec;
}
```

---

## Testing Contracts

Each module must have:

1. **Unit tests**: Test individual functions with mocked dependencies
2. **Integration tests**: Test module coordination with real files
3. **Snapshot tests**: Test generated OpenAPI output matches expected format
4. **Error tests**: Test error handling and edge cases

**Test Coverage Targets**:
- path-inference: 95% (critical, simple logic)
- method-detection: 90% (AST parsing, many edge cases)
- schema-extractor: 85% (complex heuristics)
- zod-converter: 90% (library wrapper, test integration)
- ts-converter: 80% (many limitations to document)
- merger: 95% (critical precedence logic)
- index: 80% (orchestration, harder to unit test)

---

## Summary

These API contracts define clear responsibilities for each module:

- **path-inference**: File path → OpenAPI path
- **method-detection**: File → HTTP methods
- **schema-extractor**: Handler → Zod/TS references
- **zod-converter**: Zod → OpenAPI schema
- **ts-converter**: TypeScript type → OpenAPI schema
- **merger**: Auto-gen + JSDoc → Final docs
- **config**: Configuration validation
- **index**: Orchestration

All contracts support:
- ✅ Clear input/output types
- ✅ Error handling specified
- ✅ Examples provided
- ✅ Edge cases documented
- ✅ Integration points defined
