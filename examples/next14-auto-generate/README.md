# Next.js 14 Auto-Generate Example

This example project demonstrates the **auto-generation feature** of `next-swagger-doc` v0.4.0, which automatically generates OpenAPI documentation from your Next.js API routes with minimal or no JSDoc annotations.

## 🚀 Features Demonstrated

### 1. **Minimal JSDoc Mode** - `/api/users`

Write just a summary comment, and let auto-generation handle everything else:

```typescript
/**
 * Get all users with pagination
 */
export async function GET(request: NextRequest) {
  // Your implementation
}
```

**Auto-generated:**
- ✅ Path: `/api/users`
- ✅ Method: `GET`
- ✅ Response schema from return type
- ✅ Path parameters from dynamic routes

### 2. **Schema Inference Mode** - `/api/users/{id}`

Automatic schema extraction from TypeScript types and Zod schemas:

```typescript
import { UserSchema } from "@/models/user";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<User>> {
  // Schema automatically extracted from return type!
}
```

**Auto-generated:**
- ✅ Request/response schemas from Zod models
- ✅ Path parameter schemas
- ✅ TypeScript type inference

### 3. **Hybrid Mode** - `/api/products`

Mix auto-generation with explicit JSDoc for full control:

```typescript
/**
 * Get all products with filtering
 * @swagger
 * /api/products:
 *   get:
 *     tags: [products, catalog]
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [electronics, clothing, food, books, other]
 */
export async function GET(request: NextRequest) {
  // JSDoc provides: tags, detailed query params, security
  // Auto-gen provides: path, method, path params, response schema
}
```

## 📦 Installation

```bash
# Using pnpm (recommended for monorepos)
pnpm install

# Using npm
npm install

# Using yarn
yarn install
```

## 🏃 Running the Example

### Development Mode

```bash
pnpm dev
```

Then open:
- **Homepage**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-doc

### Build for Production

```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
next14-auto-generate/
├── app/
│   ├── api/
│   │   ├── users/
│   │   │   ├── route.ts          # Minimal JSDoc mode
│   │   │   └── [id]/
│   │   │       └── route.ts      # Schema inference mode
│   │   ├── products/
│   │   │   └── route.ts          # Hybrid mode
│   │   └── health/
│   │       └── route.ts          # Simple health check
│   ├── api-doc/
│   │   ├── page.tsx              # API documentation page
│   │   └── react-swagger.tsx     # Swagger UI component
│   ├── page.tsx                  # Homepage
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── lib/
│   └── swagger.ts                # Swagger configuration
├── models/
│   ├── user.ts                   # User Zod schemas
│   ├── product.ts                # Product Zod schemas
│   └── error.ts                  # Error schemas
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
└── postcss.config.mjs
```

## 🔧 Configuration

The auto-generation is configured in `lib/swagger.ts`:

```typescript
await createSwaggerSpec({
  apiFolder: "app/api",
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Next.js 14 Auto-Generate API",
      version: "1.0.0",
    },
    // ... OpenAPI definition
  },
  // 🎉 Auto-generation configuration
  autoGenerate: {
    enabled: true,
    includeTypeScript: true,     // Extract TypeScript types
    zodSchemaFolders: ["models"], // Scan for Zod schemas
    routerTypes: ["app"],         // Use App Router
    inferDescriptions: true,      // Auto-generate descriptions
    componentReuse: true,         // Reuse schema components
  },
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable auto-generation |
| `includeTypeScript` | `boolean` | `true` | Extract TypeScript types |
| `zodSchemaFolders` | `string[]` | `[]` | Folders to scan for Zod schemas |
| `routerTypes` | `('pages' \| 'app')[]` | `['pages', 'app']` | Router types to process |
| `inferDescriptions` | `boolean` | `true` | Auto-generate descriptions |
| `componentReuse` | `boolean` | `true` | Reuse schema components |
| `defaultResponses` | `boolean` | `false` | Add default error responses |
| `excludePatterns` | `string[]` | `[]` | File patterns to exclude |

## 📊 Benefits

### Before (Traditional JSDoc)

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
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 # ... 50+ lines of schema definition
 */
export async function GET(req, { params }) {
  // Implementation
}
```

### After (Auto-Generation)

```typescript
/**
 * Get user by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<User>> {
  // Implementation - schema auto-extracted from User type!
}
```

**Result: 60%+ reduction in boilerplate!** 🎉

## 🧪 Testing the API

### Using curl

```bash
# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/123

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"user","isActive":true}'

# Get products
curl http://localhost:3000/api/products?category=electronics

# Health check
curl http://localhost:3000/api/health
```

### Using the Swagger UI

Navigate to http://localhost:3000/api-doc and use the interactive Swagger UI to test all endpoints.

## 📚 Learn More

- [next-swagger-doc Documentation](http://next-swagger-doc.productsway.com/)
- [GitHub Repository](https://github.com/jellydn/next-swagger-doc)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Zod Documentation](https://zod.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)

## 🤝 Contributing

This is an example project. For contributions to `next-swagger-doc`, please visit the [main repository](https://github.com/jellydn/next-swagger-doc).

## 📝 License

This example is provided as-is for demonstration purposes.
