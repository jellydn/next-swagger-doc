import { createSwaggerSpec } from "next-swagger-doc";

/**
 * Get the Swagger/OpenAPI specification for the API
 *
 * This demonstrates the auto-generation feature with:
 * - Automatic path and method detection
 * - Schema inference from Zod models
 * - Hybrid mode support (mixing auto-gen with explicit JSDoc)
 */
export async function getApiDocs() {
  const spec = await createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Next.js 14 Auto-Generate API",
        version: "1.0.0",
        description: `
# Auto-Generation Feature Demo

This API demonstrates the **next-swagger-doc auto-generation** feature.

## Features Demonstrated

### 1. Minimal JSDoc Mode
The \`/api/users\` endpoints show how you can write just a summary comment
and let auto-generation handle paths, methods, and parameters.

### 2. Schema Inference Mode
The \`/api/users/{id}\` endpoints demonstrate automatic schema extraction
from TypeScript types and Zod schemas.

### 3. Hybrid Mode
The \`/api/products\` endpoint shows how to mix auto-generation with
explicit JSDoc for advanced features like detailed query parameters,
tags, and security requirements.

## Auto-Generation Configuration

This API uses the following auto-generation settings:

\`\`\`typescript
{
  enabled: true,
  includeTypeScript: true,  // Extract TypeScript types
  zodSchemaFolders: ["models"], // Scan for Zod schemas
  routerTypes: ["app"],     // Use App Router
  inferDescriptions: true,  // Auto-generate descriptions
  componentReuse: true      // Reuse schema components
}
\`\`\`

## Benefits

- **60%+ reduction** in JSDoc boilerplate
- Automatic path and method inference
- Type-safe schema generation
- Full OpenAPI 3.0 compliance
        `,
        contact: {
          name: "API Support",
          email: "support@example.com",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT authorization token",
          },
        },
      },
      security: [],
      tags: [
        {
          name: "users",
          description: "User management endpoints (Minimal JSDoc + Schema Inference)",
        },
        {
          name: "products",
          description: "Product catalog endpoints (Hybrid Mode)",
        },
        {
          name: "catalog",
          description: "General catalog operations",
        },
        {
          name: "health",
          description: "Health check endpoints",
        },
      ],
    },
    // 🎉 Enable auto-generation with full configuration
    autoGenerate: {
      enabled: true,
      includeTypeScript: true, // Extract TypeScript types
      zodSchemaFolders: ["models"], // Scan for Zod schemas
      routerTypes: ["app"], // Use App Router only
      inferDescriptions: true, // Auto-generate descriptions from paths
      componentReuse: true, // Reuse schema components
      defaultResponses: false, // Don't add default error responses
    },
  });

  return spec;
}
