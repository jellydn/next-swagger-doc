/**
 * Auto-generation module - main entry point
 * Orchestrates path inference, method detection, and schema extraction
 * @module auto-generate
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { normalizeConfig } from './config';
import { detectHttpMethods, isValidApiRoute } from './method-detection';
import { inferRoutePathFromFile } from './path-inference';
import { extractSchemas } from './schema-extractor';
import type { AutoGenerateConfig, RouteInfo } from './types';

/**
 * Discovers and generates documentation for all API routes in a folder
 *
 * @param apiFolder - Root API folder path (e.g., "pages/api" or "app/api")
 * @param config - Auto-generation configuration
 * @returns Array of RouteInfo objects for all discovered routes
 *
 * @example
 * ```typescript
 * const routes = await autoGenerateRoutes('pages/api', {
 *   enabled: true,
 *   routerTypes: ['pages', 'app']
 * });
 * ```
 */
export async function autoGenerateRoutes(
  apiFolder: string,
  config: Partial<AutoGenerateConfig>
): Promise<RouteInfo[]> {
  const normalizedConfig = normalizeConfig(config);

  // If auto-generation is disabled, return empty array
  if (!normalizedConfig.enabled) {
    console.warn(
      '[next-swagger-doc] Auto-generation is disabled (enabled: false)'
    );
    return [];
  }

  // Discover all API route files
  const routeFiles = discoverRouteFiles(apiFolder, normalizedConfig);

  // Process each file to generate RouteInfo
  const routes: RouteInfo[] = [];

  for (const filePath of routeFiles) {
    try {
      const routeInfos = await processRouteFile(filePath, normalizedConfig);
      routes.push(...routeInfos);
    } catch (error) {
      // Log error but continue processing other files
      console.warn(`Failed to process route file ${filePath}:`, error);
    }
  }

  return routes;
}

/**
 * Discovers all API route files in a directory recursively
 *
 * @param folderPath - Folder to scan
 * @param config - Configuration with exclude patterns
 * @returns Array of absolute file paths
 */
function discoverRouteFiles(
  folderPath: string,
  config: AutoGenerateConfig
): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(folderPath, entry.name);

      // Skip if matches exclude pattern
      if (
        config.excludePatterns &&
        shouldExclude(fullPath, config.excludePatterns)
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively scan directories
        files.push(...discoverRouteFiles(fullPath, config));
      } else if (entry.isFile()) {
        // Check if it's a valid API route file
        if (isValidApiRoute(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read - return empty array
    console.warn(`Could not read directory ${folderPath}:`, error);
  }

  return files;
}

/**
 * Checks if a file path matches any exclude pattern
 *
 * @param filePath - File path to check
 * @param patterns - Array of glob patterns or path fragments
 * @returns true if file should be excluded
 */
function shouldExclude(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const pattern of patterns) {
    // Simple pattern matching - check if path contains pattern
    // For MVP, we do simple string matching
    // TODO: Implement proper glob matching in future
    if (normalizedPath.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Processes a single route file to generate RouteInfo objects
 * One file may produce multiple RouteInfo objects (one per HTTP method)
 *
 * @param filePath - Absolute path to route file
 * @param config - Configuration options
 * @returns Array of RouteInfo objects
 */
async function processRouteFile(
  filePath: string,
  config: AutoGenerateConfig
): Promise<RouteInfo[]> {
  // Step 1: Infer route path from file structure
  const pathInfo = inferRoutePathFromFile(filePath);

  if (!pathInfo.isValid) {
    throw new Error(`Invalid route file: ${pathInfo.error}`);
  }

  // Check if router type is enabled
  if (!config.routerTypes.includes(pathInfo.routerType)) {
    return []; // Skip this router type
  }

  // Step 2: Detect HTTP methods from exports
  const methodInfo = detectHttpMethods(filePath);

  if (methodInfo.parseError) {
    throw new Error(`Failed to parse methods: ${methodInfo.parseError}`);
  }

  if (methodInfo.methods.length === 0) {
    return []; // No methods found, skip file
  }

  // Step 3: Generate RouteInfo for each method
  const routes: RouteInfo[] = [];

  for (const method of methodInfo.methods) {
    // Step 3a: Extract schemas from handler (US2)
    let schemas;
    if (config.includeTypeScript) {
      try {
        schemas = await extractSchemas(filePath, method.handler);
      } catch (error) {
        console.warn(
          `Failed to extract schemas for ${filePath}:${method.method}`,
          error
        );
      }
    }

    // Create RouteInfo with schema information
    const routeInfo: RouteInfo = {
      filePath,
      routePath: pathInfo.routePath,
      method: method.method,
      routerType: pathInfo.routerType,
      handler: method.handler,
      parameters: pathInfo.parameters,
      // Responses from schema extraction or default
      responses:
        schemas?.responses && Object.keys(schemas.responses).length > 0
          ? schemas.responses
          : {
              200: {
                description:
                  method.jsdocSummary || `Successful ${method.method} response`,
              },
            },
    };

    // Add request body schema if extracted
    if (schemas?.requestBody) {
      routeInfo.requestBody = schemas.requestBody;
    }

    // Add summary and description from JSDoc if available
    if (method.jsdocSummary) {
      routeInfo.summary = method.jsdocSummary;
      if (config.inferDescriptions) {
        routeInfo.description = method.jsdocSummary;
      }
    }

    // Add tags based on path segments (for better organization)
    if (config.inferDescriptions) {
      routeInfo.tags = inferTagsFromPath(pathInfo.routePath);
    }

    routes.push(routeInfo);
  }

  return routes;
}

/**
 * Infers OpenAPI tags from route path
 * Tags are used to group related endpoints in documentation
 *
 * @param routePath - OpenAPI route path (e.g., "/api/users/{id}")
 * @returns Array of tag names
 *
 * @example
 * ```typescript
 * inferTagsFromPath('/api/users/{id}')
 * // → ['users']
 *
 * inferTagsFromPath('/api/v1/posts/comments')
 * // → ['posts']
 * ```
 */
function inferTagsFromPath(routePath: string): string[] {
  // Remove /api prefix
  const withoutApi = routePath.replace(/^\/api\/?/, '');

  if (!withoutApi) {
    return ['api'];
  }

  // Split into segments and remove parameters
  const segments = withoutApi
    .split('/')
    .filter(Boolean)
    .filter((s) => !s.startsWith('{') && !s.startsWith('v')) // Remove params and version segments
    .filter((s) => s.length > 0);

  // Use first segment as tag
  if (segments.length > 0) {
    return [segments[0]];
  }

  return ['api'];
}

/**
 * Re-export types and utilities for convenience
 */
export * from './types';
export * from './config';
export { inferRoutePathFromFile } from './path-inference';
export { detectHttpMethods, isValidApiRoute } from './method-detection';
