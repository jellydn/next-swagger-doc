# Quickstart: Automatic OpenAPI Documentation Generation

**Feature**: 001-auto-generate-doc
**Date**: 2025-11-05
**Purpose**: Developer guide for using auto-generation feature

---

## Overview

The auto-generation feature reduces JSDoc boilerplate by automatically inferring API paths, HTTP methods, and schemas from your Next.js code structure. You write minimal JSDoc comments (just descriptions), and the library generates the rest.

**Benefits**:
- 60% less documentation code
- No path/method duplication
- Schemas stay in sync with code
- Backward compatible with existing JSDoc

---

## Installation

```bash
npm install next-swagger-doc
# Peer dependencies for schema generation
npm install zod @asteasolutions/zod-to-openapi
```

---

## Basic Usage

### Step 1: Enable Auto-Generation

Add `autoGenerate: true` to your swagger spec configuration:

```typescript
// lib/swagger.ts
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // or 'pages/api'
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'My API',
        version: '1.0',
      },
    },
    autoGenerate: true, // ← Enable auto-generation
  });
  return spec;
};
```

### Step 2: Write Minimal API Routes

**Before** (manual JSDoc):
```typescript
// app/api/users/[id]/route.ts

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  return NextResponse.json(user);
}
```

**After** (with auto-generation):
```typescript
// app/api/users/[id]/route.ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Get user by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  return NextResponse.json(UserSchema.parse(user));
}
```

**Auto-generated**:
- Path: `/api/users/{id}` (from file location)
- Method: `GET` (from export name)
- Parameter: `id` in path (from `[id]` dynamic segment)
- Response schema: `UserSchema` (from Zod schema usage)

---

## Schema Inference

### Option 1: Zod Schemas (Recommended)

Define Zod schemas and use them in your handlers:

```typescript
// app/api/posts/route.ts
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()).optional(),
});

const PostResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
});

/**
 * Create a new blog post
 */
export async function POST(request: Request) {
  const body = CreatePostSchema.parse(await request.json());
  const post = await db.post.create({ data: body });
  return NextResponse.json(PostResponseSchema.parse(post), { status: 201 });
}
```

**Auto-generated**:
- Path: `/api/posts`
- Method: `POST`
- Request body: `CreatePostSchema` → OpenAPI schema
- Response (201): `PostResponseSchema` → OpenAPI schema
- Both schemas registered in `components/schemas` for reuse

### Option 2: TypeScript Types

If you don't use Zod, TypeScript types are used as fallback:

```typescript
// app/api/stats/route.ts

interface StatsResponse {
  totalUsers: number;
  totalPosts: number;
  activeToday: number;
}

/**
 * Get application statistics
 */
export async function GET(): Promise<Response<StatsResponse>> {
  const stats = await getStats();
  return NextResponse.json(stats);
}
```

**Auto-generated**:
- Response schema derived from `StatsResponse` TypeScript type
- May have limitations with complex types (generics, conditionals)

---

## Router Support

### App Router (Next.js 13+)

```typescript
// app/api/products/[id]/route.ts

/**
 * Get product details
 */
export async function GET(request: Request, { params }) {
  // Auto-inferred: GET /api/products/{id}
}

/**
 * Update product
 */
export async function PUT(request: Request, { params }) {
  // Auto-inferred: PUT /api/products/{id}
}

/**
 * Delete product
 */
export async function DELETE(request: Request, { params }) {
  // Auto-inferred: DELETE /api/products/{id}
}
```

### Pages Router (Next.js 9+)

```typescript
// pages/api/products/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Product operations endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Auto-inferred: GET /api/products/{id}
  // Method detected from req.method checks or defaults to GET
  const { id } = req.query;
  const product = await db.product.findUnique({ where: { id } });
  res.json(product);
}
```

---

## Dynamic Routes

All Next.js dynamic route patterns are supported:

```typescript
// [id].ts → /{id} parameter
// [...slug].ts → /{slug} (array or catch-all)
// [[...slug]].ts → /{slug} (optional catch-all)

// Example: app/api/categories/[...segments]/route.ts
/**
 * Get category by path
 */
export async function GET(request, { params }) {
  // Auto-inferred: GET /api/categories/{segments}
  // Parameter: segments (array of strings)
  const path = params.segments.join('/');
  return NextResponse.json(await getCategoryByPath(path));
}
```

---

## Hybrid Mode: Combining Auto-Gen with Explicit JSDoc

You can override specific parts while keeping auto-generation:

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users with pagination
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 */
export async function GET(request: Request) {
  // Path and method auto-inferred
  // But we added explicit query parameters in JSDoc
  // Response schema still auto-generated from code
}
```

**Precedence**: Explicit JSDoc always wins over auto-generated values.

---

## Opt-Out for Specific Routes

Disable auto-generation for routes that need full manual control:

```typescript
/**
 * @swagger-auto-generate false
 * @swagger
 * /api/complex-endpoint:
 *   post:
 *     # Full manual OpenAPI spec here...
 */
export async function POST(request: Request) {
  // This route uses only explicit JSDoc
}
```

---

## Configuration Options

### Full Configuration Object

```typescript
createSwaggerSpec({
  apiFolder: 'app/api',
  definition: { /* ... */ },
  autoGenerate: {
    enabled: true,

    // Folders to scan for Zod schema definitions
    zodSchemaFolders: ['lib/schemas', 'app/api'],

    // Whether to extract TypeScript types as fallback
    includeTypeScript: true,

    // Which router types to process
    routerTypes: ['pages', 'app'],

    // Infer descriptions from code comments
    inferDescriptions: true,

    // Deduplicate schemas into components
    componentReuse: true,

    // Add default error responses (400, 500)
    defaultResponses: false,

    // Exclude files matching these patterns
    excludePatterns: [
      '**/_middleware.ts',
      '**/*.test.ts',
    ],

    // Performance tuning
    performance: {
      cacheEnabled: true,
      cacheTTL: 5000,
      parallelism: 4,
      maxFileSize: 1024 * 1024, // 1MB
      timeoutPerFile: 5000, // 5s
    },
  },
});
```

### Minimal Configuration (Recommended)

```typescript
createSwaggerSpec({
  apiFolder: 'app/api',
  definition: { /* ... */ },
  autoGenerate: true, // Uses all defaults
});
```

---

## Migration Guide

### From Explicit JSDoc to Auto-Generation

**Step 1**: Enable auto-generation with default config
```typescript
autoGenerate: true
```

**Step 2**: For each route, simplify JSDoc incrementally:

1. Remove path annotations (auto-inferred from file location)
2. Remove method annotations (auto-inferred from exports)
3. Remove parameter definitions for path params (auto-inferred from dynamic segments)
4. Add Zod schemas for request/response bodies
5. Keep only summary/description JSDoc comments

**Step 3**: Test generated spec matches your expectations

**Step 4**: Update any routes that need explicit overrides

### Example Migration

**Before**:
```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 */
export async function GET(request, { params }) { /* ... */ }
```

**After**:
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Get user by ID
 */
export async function GET(request, { params }) {
  const user = await getUser(params.id);
  return NextResponse.json(UserSchema.parse(user));
}
```

**Savings**: 60% less code, schemas always in sync!

---

## Best Practices

### 1. Define Schemas in Separate Files

```typescript
// lib/schemas/user.ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

// app/api/users/route.ts
import { UserSchema } from '@/lib/schemas/user';

export async function GET() {
  const users = await db.user.findMany();
  return NextResponse.json(users.map(u => UserSchema.parse(u)));
}
```

**Benefits**:
- Schema reuse across multiple routes
- Centralized schema management
- Easier testing

### 2. Use Descriptive Schema Names

```typescript
// Good
const CreateUserRequestSchema = z.object({ /* ... */ });
const UserResponseSchema = z.object({ /* ... */ });

// Less descriptive
const UserSchema = z.object({ /* ... */ });
const Schema = z.object({ /* ... */ });
```

### 3. Add JSDoc for Business Logic Descriptions

```typescript
/**
 * Creates a new user account and sends a welcome email.
 * Requires admin privileges.
 */
export async function POST(request: Request) {
  // Path, method, schemas auto-generated
  // But important business context is in JSDoc
}
```

### 4. Use Zod for Runtime Validation

Auto-generation and runtime validation work together:

```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Runtime validation
  const validated = CreateUserSchema.parse(body);

  // Also generates OpenAPI schema automatically
  const user = await db.user.create({ data: validated });

  return NextResponse.json(UserResponseSchema.parse(user));
}
```

### 5. Configure Appropriate Exclusions

```typescript
excludePatterns: [
  '**/_middleware.ts',
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/internal/**', // Internal endpoints not in public API
]
```

---

## Troubleshooting

### Schema Not Detected

**Problem**: Auto-generation doesn't find your Zod schema.

**Solutions**:
1. Use `.parse()` or `.safeParse()` in handler (detection heuristic)
2. Add schema folder to `zodSchemaFolders` config
3. Use explicit JSDoc for this route as fallback

### TypeScript Type Too Complex

**Problem**: Warning about TypeScript type conversion limitations.

**Solutions**:
1. Use Zod instead (more reliable)
2. Simplify the type (avoid conditionals, complex generics)
3. Add explicit JSDoc schema for this specific case

### Multiple Methods Not Detected (Pages Router)

**Problem**: Pages Router handler serves multiple methods but only GET is detected.

**Solutions**:
1. Use App Router (better method detection)
2. Add explicit method annotations in JSDoc
3. Split into separate files if possible

### Performance Issues

**Problem**: Spec generation takes >1 second.

**Solutions**:
1. Reduce `parallelism` if memory constrained
2. Add more patterns to `excludePatterns`
3. Use CLI with incremental generation
4. Increase `cacheTTL` for development

---

## Examples

See full working examples in:
- `examples/next13-auto-generate/` - App Router with Zod
- `examples/next14-auto-generate/` - App Router with TypeScript types
- `examples/pages-auto-generate/` - Pages Router with hybrid mode

---

## Summary

Auto-generation makes OpenAPI documentation effortless:

1. **Enable**: Add `autoGenerate: true` to config
2. **Write code**: Use Zod schemas or TypeScript types
3. **Add descriptions**: Minimal JSDoc comments for context
4. **Generate**: Paths, methods, schemas inferred automatically
5. **Override**: Use explicit JSDoc when needed

**Result**: 60% less documentation code that stays in sync with implementation!

---

## Next Steps

- Run `/speckit.tasks` to generate implementation task list
- Review data-model.md for entity design
- Review contracts for module APIs
- Begin implementation with Phase 1 (setup and infrastructure)
