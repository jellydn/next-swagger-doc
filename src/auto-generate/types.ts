/**
 * Core type definitions for automatic OpenAPI documentation generation
 * @module auto-generate/types
 */

/**
 * HTTP methods supported by Next.js API routes
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

/**
 * Source location in a TypeScript file
 */
export interface SourceLocation {
  line: number; // Line number (1-indexed)
  column: number; // Column number (0-indexed)
  endLine?: number;
  endColumn?: number;
}

/**
 * Result of inferring route path from file path
 */
export interface RoutePathInfo {
  routePath: string; // OpenAPI path (e.g., "/api/users/{id}")
  parameters: RouteParameter[]; // Inferred path parameters
  routerType: 'pages' | 'app'; // Next.js router type
  isValid: boolean; // false if not a valid route file
  error?: string; // Error message if invalid
}

/**
 * Information about an HTTP method handler
 */
export interface HttpMethodInfo {
  method: HttpMethod;
  handler: HandlerInfo;
  hasJSDoc: boolean; // Whether handler has JSDoc comment
  jsdocSummary?: string; // Extracted JSDoc summary
}

/**
 * Result of detecting HTTP methods in a route file
 */
export interface MethodDetectionResult {
  methods: HttpMethodInfo[];
  routerType: 'pages' | 'app';
  parseError?: string;
}

/**
 * Information about a route handler function
 */
export interface HandlerInfo {
  exportType: 'default' | 'named'; // How handler is exported
  functionName: string; // Name of the handler function
  isAsync: boolean; // Whether handler is async
  sourceLocation: SourceLocation; // Location in file
  zodSchemas: ZodSchemaReference[]; // Zod schemas used in handler
  typeAnnotations: TypeReference[]; // TypeScript type references
}

/**
 * OpenAPI route parameter definition
 */
export interface RouteParameter {
  name: string; // Parameter name
  in: 'path' | 'query' | 'header' | 'cookie'; // Parameter location
  required: boolean; // Whether parameter is required
  schema: OpenAPISchema; // Parameter schema
  description?: string; // Parameter description
  example?: unknown; // Example value
  deprecated?: boolean; // Whether parameter is deprecated
}

/**
 * OpenAPI response definition
 */
export interface ResponseInfo {
  statusCode: number; // HTTP status code (200, 404, 500, etc.)
  description: string; // Response description
  content?: Record<string, SchemaInfo>; // Response body schemas by content type
  headers?: Record<string, HeaderInfo>; // Response headers
}

/**
 * OpenAPI header definition
 */
export interface HeaderInfo {
  description?: string;
  required: boolean;
  schema: OpenAPISchema;
  deprecated?: boolean;
}

/**
 * Complete information about a discovered API route
 */
export interface RouteInfo {
  filePath: string; // Absolute path to the route file
  routePath: string; // OpenAPI path (e.g., "/api/users/{id}")
  method: HttpMethod; // HTTP method
  routerType: 'pages' | 'app'; // Next.js router pattern
  handler: HandlerInfo; // Handler function information
  parameters: RouteParameter[]; // Path/query/header parameters
  requestBody?: SchemaInfo; // Request body schema (if applicable)
  responses: Record<number, ResponseInfo>; // Response definitions by status code
  security?: SecurityRequirement[]; // Security requirements (if any)
  tags?: string[]; // OpenAPI tags for grouping
  summary?: string; // Brief description
  description?: string; // Detailed description
  deprecated?: boolean; // Whether route is deprecated
}

/**
 * Schema information with its source
 */
export interface SchemaInfo {
  source: 'zod' | 'typescript' | 'explicit' | 'inferred'; // How schema was determined
  schemaRef?: string; // OpenAPI $ref if reusable component
  inlineSchema?: OpenAPISchema; // Inline schema object
  zodSchema?: ZodSchemaReference; // Reference to Zod schema (if source is 'zod')
  typeReference?: TypeReference; // Reference to TS type (if source is 'typescript')
  contentType: string; // Media type (e.g., "application/json")
}

/**
 * Reusable schema definition in OpenAPI components/schemas
 */
export interface SchemaDefinition {
  name: string; // Unique name in components/schemas
  schema: OpenAPISchema; // The actual OpenAPI schema object
  sourceHash: string; // Hash of source schema for deduplication
  usageCount: number; // How many routes reference this schema
  sourceType: 'zod' | 'typescript' | 'explicit'; // Origin of schema
  zodSchemaName?: string; // Original Zod variable name (if from Zod)
  typeScriptTypeName?: string; // Original TS type name (if from TS)
}

/**
 * Reference to a Zod schema found in source code
 */
export interface ZodSchemaReference {
  variableName: string; // Name of variable holding Zod schema
  filePath: string; // File where schema is defined
  sourceLocation: SourceLocation; // Location in file
  schemaExpression: string; // Source code of schema definition
  zodObject?: unknown; // Actual Zod schema object (if evaluatable)
  isImported: boolean; // Whether imported from another file
  importPath?: string; // Import path if isImported is true
}

/**
 * Reference to a TypeScript type annotation
 */
export interface TypeReference {
  typeName: string; // Name of the type
  filePath: string; // File where type is defined
  sourceLocation: SourceLocation; // Location in file
  typeDefinition: string; // Source code of type definition
  isImported: boolean; // Whether imported from another file
  importPath?: string; // Import path if isImported is true
  typeKind: 'interface' | 'type' | 'class' | 'inferred'; // Kind of type
}

/**
 * Result of extracting schemas from a handler
 */
export interface ExtractedSchemas {
  requestSchema?: SchemaInfo;
  responseSchemas: Map<number, SchemaInfo>; // Status code → schema
  zodReferences: ZodSchemaReference[];
  typeReferences: TypeReference[];
}

/**
 * OpenAPI 3.0 schema object
 * Simplified type - use openapi-types for complete definition
 */
export interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  enum?: unknown[];
  oneOf?: OpenAPISchema[];
  allOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  not?: OpenAPISchema;
  description?: string;
  format?: string;
  default?: unknown;
  example?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | OpenAPISchema;
  $ref?: string;
}

/**
 * OpenAPI security requirement
 */
export interface SecurityRequirement {
  [name: string]: string[];
}
