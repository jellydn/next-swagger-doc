/**
 * Zod schema converter - converts Zod schemas to OpenAPI schemas
 * Uses @asteasolutions/zod-to-openapi for conversion
 * @module auto-generate/zod-converter
 */

import type { ZodSchema } from 'zod';
import type { SchemaDefinition, ZodSchemaReference } from './types';

// Lazy import to avoid requiring zod as a peer dependency
let zodToOpenAPIModule: any;
let OpenAPIRegistry: any;

/**
 * Initializes the zod-to-openapi module
 * Lazy loaded to avoid requiring zod when not used
 */
async function ensureZodToOpenAPI() {
  if (!zodToOpenAPIModule) {
    try {
      zodToOpenAPIModule = await import('@asteasolutions/zod-to-openapi');
      OpenAPIRegistry = zodToOpenAPIModule.OpenAPIRegistry;
    } catch (error) {
      throw new Error(
        'Failed to load @asteasolutions/zod-to-openapi. Please install zod and @asteasolutions/zod-to-openapi: npm install zod @asteasolutions/zod-to-openapi'
      );
    }
  }
}

/**
 * Converts a Zod schema reference to OpenAPI schema definition
 *
 * @param zodRef - Zod schema reference from AST analysis
 * @param registry - OpenAPI registry for component reuse
 * @returns OpenAPI schema definition
 *
 * @example
 * ```typescript
 * const zodRef = {
 *   schemaName: 'UserSchema',
 *   importPath: './schemas/user',
 *   isRegistered: true
 * };
 *
 * const schema = await convertZodToOpenAPI(zodRef, registry);
 * // → { $ref: '#/components/schemas/User' }
 * ```
 */
export async function convertZodToOpenAPI(
  zodRef: ZodSchemaReference,
  registry?: any
): Promise<SchemaDefinition> {
  await ensureZodToOpenAPI();

  // If schema is already registered, return a reference
  if (zodRef.isRegistered && zodRef.schemaName) {
    return {
      type: 'reference',
      ref: `#/components/schemas/${zodRef.schemaName}`,
    };
  }

  // For inline schemas, we need the actual schema object
  // This will be populated by the schema-extractor module
  if (zodRef.inlineSchema) {
    return convertZodSchemaToOpenAPI(zodRef.inlineSchema, registry);
  }

  // If we can't resolve the schema, return a generic object schema
  console.warn(
    `Could not resolve Zod schema: ${zodRef.schemaName || 'unknown'}. Using generic object schema.`
  );
  return {
    type: 'inline',
    schema: {
      type: 'object',
      description: `Schema for ${zodRef.schemaName || 'unknown'}`,
    },
  };
}

/**
 * Converts a Zod schema object to OpenAPI schema
 *
 * @param zodSchema - Zod schema object
 * @param registry - Optional OpenAPI registry for component registration
 * @returns OpenAPI schema definition
 */
export function convertZodSchemaToOpenAPI(
  zodSchema: ZodSchema,
  registry?: any
): SchemaDefinition {
  if (!zodToOpenAPIModule) {
    throw new Error('zod-to-openapi module not initialized. Call ensureZodToOpenAPI() first.');
  }

  try {
    const { zodToOpenApi } = zodToOpenAPIModule;

    // Convert the schema
    const openApiSchema = zodToOpenApi(zodSchema);

    return {
      type: 'inline',
      schema: openApiSchema,
    };
  } catch (error) {
    console.warn('Failed to convert Zod schema to OpenAPI:', error);
    return {
      type: 'inline',
      schema: {
        type: 'object',
        description: 'Failed to convert Zod schema',
      },
    };
  }
}

/**
 * Registers a Zod schema in the OpenAPI registry for reuse
 *
 * @param schemaName - Name to register the schema as
 * @param zodSchema - Zod schema object
 * @param registry - OpenAPI registry
 * @returns Reference to the registered schema
 */
export function registerZodSchema(
  schemaName: string,
  zodSchema: ZodSchema,
  registry: any
): SchemaDefinition {
  if (!OpenAPIRegistry) {
    throw new Error('OpenAPIRegistry not available');
  }

  // Register the schema
  registry.register(schemaName, zodSchema);

  return {
    type: 'reference',
    ref: `#/components/schemas/${schemaName}`,
  };
}

/**
 * Detects if a value is a Zod schema object
 * Used for runtime schema detection
 *
 * @param value - Value to check
 * @returns true if value is a Zod schema
 */
export function isZodSchema(value: any): value is ZodSchema {
  // Zod schemas have _def property
  return (
    value &&
    typeof value === 'object' &&
    '_def' in value &&
    value._def &&
    typeof value._def === 'object'
  );
}

/**
 * Extracts schema name from Zod schema if it has a description
 * Zod extended schemas can have .describe() which we use as schema name
 *
 * @param zodSchema - Zod schema object
 * @returns Schema name or undefined
 */
export function getZodSchemaName(zodSchema: ZodSchema): string | undefined {
  const def = (zodSchema as any)._def;

  // Check for description (set via .describe())
  if (def.description && typeof def.description === 'string') {
    // Convert description to PascalCase for schema name
    return def.description
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  return undefined;
}

/**
 * Creates an OpenAPI registry with common Zod schemas pre-registered
 *
 * @returns Initialized OpenAPI registry
 */
export function createZodRegistry(): any {
  if (!OpenAPIRegistry) {
    throw new Error('OpenAPIRegistry not available. Install @asteasolutions/zod-to-openapi');
  }

  return new OpenAPIRegistry();
}

/**
 * Batch converts multiple Zod schemas to OpenAPI schemas
 *
 * @param schemas - Map of schema name to Zod schema
 * @param registry - OpenAPI registry
 * @returns Map of schema name to OpenAPI schema definition
 */
export async function convertZodSchemasBatch(
  schemas: Map<string, ZodSchema>,
  registry?: any
): Promise<Map<string, SchemaDefinition>> {
  await ensureZodToOpenAPI();

  const results = new Map<string, SchemaDefinition>();

  for (const [name, schema] of schemas) {
    try {
      const definition = convertZodSchemaToOpenAPI(schema, registry);
      results.set(name, definition);
    } catch (error) {
      console.warn(`Failed to convert Zod schema ${name}:`, error);
      results.set(name, {
        type: 'inline',
        schema: {
          type: 'object',
          description: `Failed to convert schema: ${name}`,
        },
      });
    }
  }

  return results;
}
