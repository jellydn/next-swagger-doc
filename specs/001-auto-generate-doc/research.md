# Research: Automatic OpenAPI Documentation Generation

**Date**: 2025-11-05
**Feature**: 001-auto-generate-doc
**Purpose**: Technology decisions and implementation patterns for auto-generating OpenAPI specs from Next.js routes

---

## 1. Zod Schema Detection & Conversion

### Decision: Use @asteasolutions/zod-to-openapi

**Rationale**:
- Most mature and actively maintained Zod-to-OpenAPI library
- Used in production by major projects
- Supports OpenAPI 3.0 and 3.1
- Handles complex Zod schemas (unions, intersections, refinements)
- Provides schema registry for component reuse

**Integration Pattern**:
```typescript
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Create registry for schema components
const registry = new OpenAPIRegistry();

// Register schema with name for reuse
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

registry.register('User', UserSchema);

// Generate OpenAPI components
const generator = new OpenApiGeneratorV3(registry.definitions);
const openApiSpec = generator.generateDocument({
  openapi: '3.0.0',
  info: { title: 'API', version: '1.0' }
});
```

**Schema Detection Strategy**:
- Use TypeScript Compiler API to parse source files
- Look for `z.object()`, `z.string()`, etc. calls
- Track variable declarations assigned to Zod schemas
- Follow imports to find schema definitions in other files

**Alternatives Considered**:
- `zod-openapi`: Less actively maintained, fewer features
- Manual conversion: Too error-prone, doesn't handle complex schemas
- `zodios`: Opinionated framework, not just conversion

**Limitations**:
- Refinements (`.refine()`) may not translate to OpenAPI constraints
- Custom Zod types need manual OpenAPI schema mapping
- Recursive schemas need careful handling to avoid circular refs

---

## 2. TypeScript Type Extraction

### Decision: Use TypeScript Compiler API + ts-json-schema-generator (optional)

**Rationale**:
- TypeScript Compiler API provides full AST access
- Can extract return type annotations from functions
- `ts-json-schema-generator` can convert TS types to JSON Schema
- Fallback when Zod schemas not present

**Implementation Pattern**:
```typescript
import ts from 'typescript';
import { createGenerator } from 'ts-json-schema-generator';

// Parse file and get AST
const program = ts.createProgram([filePath], {});
const sourceFile = program.getSourceFile(filePath);

// Visit nodes to find exported functions
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name) {
    const signature = typeChecker.getSignatureFromDeclaration(node);
    const returnType = signature.getReturnType();
    // Convert return type to JSON Schema
  }
}

ts.forEachChild(sourceFile, visit);
```

**Alternatives Considered**:
- `@typescript-eslint/typescript-estree`: Good for linting, less suited for type extraction
- `typescript-json-schema`: Older, less maintained
- Runtime type reflection: Not available in TypeScript

**Limitations**:
- Complex generic types may not convert cleanly
- Conditional types are challenging
- Need type information, not just AST (requires full TS program)
- Performance cost of running TS compiler

**Fallback Strategy**:
1. Try Zod schema extraction first
2. If no Zod schema found, try TypeScript type annotation
3. If type too complex, generate basic object schema with warning
4. Allow manual override with JSDoc

---

## 3. Next.js Router Pattern Detection

### Decision: File path + AST-based export detection (inspired by next-lens)

**Rationale**:
- next-lens demonstrates reliable pattern for App Router parsing
- File path patterns are deterministic
- Export names directly map to HTTP methods
- Works without Next.js runtime

**Pages Router Detection**:
```typescript
// Pattern: pages/api/**/*.{ts,tsx,js,jsx}
// Export: default function handler(req, res) { }

function isPagesRouter(filePath: string): boolean {
  return filePath.includes('/pages/api/');
}

function extractPagesRouterHandler(sourceFile: ts.SourceFile) {
  // Look for default export
  // Analyze function parameters to determine handler type
  // Default to GET method unless req.method is checked
}
```

**App Router Detection**:
```typescript
// Pattern: app/api/**/route.{ts,tsx,js,jsx}
// Exports: export async function GET(request: Request) { }

function isAppRouter(filePath: string): boolean {
  return filePath.includes('/app/api/') && filePath.endsWith('route.ts');
}

function extractAppRouterHandlers(sourceFile: ts.SourceFile) {
  // Look for named exports: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
  // Each export is a separate method for the same path
}
```

**Middleware Detection**:
```typescript
// Pages Router: pages/api/_middleware.ts
// App Router: middleware.ts or app/api/**/middleware.ts

function isMiddleware(filePath: string): boolean {
  return filePath.includes('middleware.ts') ||
         filePath.includes('_middleware.ts');
}
```

**Alternatives Considered**:
- Runtime inspection: Requires Next.js running, not feasible for static generation
- Package.json detection: Doesn't tell us about specific files
- next-lens as dependency: Overkill, we only need parsing logic

---

## 4. Dynamic Route Segment Conversion

### Decision: Pattern matching with OpenAPI parameter generation

**Rationale**:
- Next.js dynamic segments have well-defined patterns
- Direct mapping to OpenAPI path parameters
- Catch-all routes need special handling

**Conversion Rules**:

| Next.js Pattern | OpenAPI Path | Parameter Type |
|-----------------|--------------|----------------|
| `[id].ts` | `/{id}` | string parameter (required) |
| `[slug].ts` | `/{slug}` | string parameter (required) |
| `[...segments].ts` | `/{segments}` | array parameter (required) or wildcard |
| `[[...segments]].ts` | `/{segments}` | array parameter (optional) |

**Implementation**:
```typescript
function convertDynamicSegment(segment: string): {
  path: string;
  param?: OpenAPIParameter;
} {
  // [id] -> {id}
  if (/^\[([^\]\.]+)\]$/.test(segment)) {
    const paramName = segment.slice(1, -1);
    return {
      path: `{${paramName}}`,
      param: {
        name: paramName,
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
    };
  }

  // [...slug] -> {slug}
  if (/^\[\.\.\.([^\]]+)\]$/.test(segment)) {
    const paramName = segment.slice(4, -1);
    return {
      path: `{${paramName}}`,
      param: {
        name: paramName,
        in: 'path',
        required: true,
        schema: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    };
  }

  // [[...slug]] -> {slug} (optional)
  if (/^\[\[\.\.\.([^\]]+)\]\]$/.test(segment)) {
    const paramName = segment.slice(5, -2);
    return {
      path: `{${paramName}}`,
      param: {
        name: paramName,
        in: 'path',
        required: false,
        schema: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    };
  }

  // Static segment
  return { path: segment };
}
```

**Edge Cases**:
- Multiple dynamic segments: `/api/[org]/[repo]` → `/api/{org}/{repo}`
- Mixed static/dynamic: `/api/users/[id]/posts` → `/api/users/{id}/posts`
- Nested catch-all: Limited support, document as limitation

---

## 5. JSDoc Merging Strategy

### Decision: Explicit annotations take precedence, partial overrides supported

**Rationale**:
- Users expect explicit JSDoc to override auto-generation
- Hybrid mode essential for gradual migration
- swagger-jsdoc already parses JSDoc, we enhance it

**Precedence Rules**:

1. **Full explicit annotation**: Use JSDoc entirely, skip auto-generation
2. **Partial annotation**: Merge JSDoc (explicit) + auto-gen (inferred)
3. **No annotation**: Use fully auto-generated values
4. **Opt-out marker**: Skip auto-generation for this route

**Implementation Pattern**:
```typescript
interface RouteDocumentation {
  path?: string;        // From JSDoc or auto-gen
  method?: string;      // From JSDoc or auto-gen
  summary?: string;     // From JSDoc
  requestBody?: Schema; // From Zod/TS or JSDoc
  responses?: Record<string, Response>; // From Zod/TS or JSDoc
}

function mergeDocumentation(
  explicit: Partial<RouteDocumentation>,
  autoGen: RouteDocumentation
): RouteDocumentation {
  return {
    path: explicit.path ?? autoGen.path,
    method: explicit.method ?? autoGen.method,
    summary: explicit.summary ?? autoGen.summary,
    requestBody: explicit.requestBody ?? autoGen.requestBody,
    responses: explicit.responses ?? autoGen.responses,
  };
}
```

**Opt-out Annotation**:
```typescript
/**
 * @swagger-auto-generate false
 */
export async function GET(request: Request) {
  // This route will NOT be auto-generated
  // Must have full explicit JSDoc or won't appear in spec
}
```

**Conflict Resolution**:
- If both explicit and auto-gen exist for same field → explicit wins
- Warning logged if auto-gen differs significantly from explicit
- No error, graceful degradation

---

## 6. Schema Component Reuse

### Decision: Use OpenAPI components/schemas with $ref

**Rationale**:
- Reduces spec size
- Maintains consistency
- Standard OpenAPI 3.0 practice
- @asteasolutions/zod-to-openapi supports this natively

**Deduplication Strategy**:
```typescript
interface SchemaRegistry {
  schemas: Map<string, OpenAPISchema>;
  refs: Map<string, string>; // Hash -> $ref
}

function registerSchema(name: string, schema: ZodSchema) {
  const openApiSchema = zodToOpenApiSchema(schema);
  const hash = hashSchema(openApiSchema);

  if (registry.refs.has(hash)) {
    // Schema already registered, return existing ref
    return registry.refs.get(hash);
  }

  // Register new schema
  const uniqueName = ensureUniqueName(name, registry.schemas);
  registry.schemas.set(uniqueName, openApiSchema);
  registry.refs.set(hash, `#/components/schemas/${uniqueName}`);

  return `#/components/schemas/${uniqueName}`;
}
```

**Naming Strategy**:
- Use Zod schema variable name if available
- Use TypeScript type name if available
- Generate name from structure (e.g., "UserResponse") if unnamed
- Append number suffix for conflicts (e.g., "User2")

**Best Practices**:
- Register all schemas before generating routes
- Use $ref for all non-primitive schemas
- Keep inline schemas for simple types (string, number)
- Document schema naming conventions in quickstart

---

## 7. Performance Optimization

### Decisions for <1s Generation Time

**Caching Strategy**:
- Cache parsed ASTs per file
- Cache Zod schema conversions
- Invalidate cache on file modification time change
- Store cache in memory during generation

**Lazy Loading**:
- Only parse files in apiFolder directories
- Skip parsing if autoGenerate: false
- Parallel file processing with worker threads for large projects

**Incremental Generation** (CLI only):
- Track which files changed since last generation
- Only re-process changed files
- Merge with previous spec for unchanged routes

**Monitoring**:
```typescript
function benchmarkGeneration() {
  const start = performance.now();
  const spec = createSwaggerSpec({ autoGenerate: true });
  const duration = performance.now() - start;

  if (duration > 1000) {
    console.warn(`Spec generation took ${duration}ms (target: <1000ms)`);
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Core Infrastructure
- AST parsing utilities
- Path inference from file structure
- Method detection from exports
- Basic integration with createSwaggerSpec

### Phase 2: Schema Extraction
- Zod schema detection
- TypeScript type extraction
- Schema registry and deduplication
- Integration with @asteasolutions/zod-to-openapi

### Phase 3: Merging & Polish
- JSDoc merging logic
- Configuration options
- Error handling and warnings
- Performance optimization

### Phase 4: Testing & Examples
- Unit tests for all modules
- Integration tests with real Next.js projects
- Example projects (Pages Router + App Router)
- Documentation and migration guide

---

## 9. Key Dependencies

**Production**:
- `@asteasolutions/zod-to-openapi` ^7.0.0 - Zod to OpenAPI conversion
- `zod` (peer dependency) - Schema validation library

**Optional** (for TypeScript type extraction):
- `ts-json-schema-generator` ^2.3.0 - TS types to JSON Schema

**Already Available**:
- `typescript` (devDependency) - Compiler API for AST parsing
- `swagger-jsdoc` - Existing JSDoc parsing

---

## 10. Known Limitations

1. **Complex Zod Refinements**: Custom `.refine()` logic cannot be expressed in OpenAPI
2. **Dynamic Schemas**: Schemas computed at runtime cannot be analyzed statically
3. **Middleware Schema**: Cannot infer schemas modified by middleware transformations
4. **Generic Type Parameters**: Complex generics may not convert to JSON Schema cleanly
5. **Circular References**: Recursive schemas need manual breaking of cycles
6. **Non-Standard Exports**: Custom export patterns not matching Next.js conventions won't be detected
7. **Runtime Validation**: This generates docs only; does not add runtime validation

---

## Summary

This research establishes a clear technical foundation:

1. **Zod Integration**: Use @asteasolutions/zod-to-openapi for schema conversion
2. **AST Parsing**: Use TypeScript Compiler API (pattern proven by next-lens)
3. **Router Detection**: File path patterns + export analysis
4. **Dynamic Routes**: Pattern matching with direct OpenAPI mapping
5. **Merging**: Explicit JSDoc takes precedence over auto-generated
6. **Reuse**: OpenAPI components/schemas with $ref for deduplication
7. **Performance**: Caching, lazy loading, parallel processing for <1s target

All technology decisions support the constitution requirements:
- ✅ OpenAPI 3.0+ compliance
- ✅ Next.js 9+ compatibility
- ✅ Zero-config defaults (single flag)
- ✅ No breaking changes
- ✅ Type-safe TypeScript implementation
