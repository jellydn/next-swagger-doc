/**
 * Path inference module - converts Next.js file paths to OpenAPI paths
 * @module auto-generate/path-inference
 */

import type { OpenAPISchema, RouteParameter, RoutePathInfo } from './types';

/**
 * Converts a Next.js dynamic segment to OpenAPI path parameter
 * Handles: [id], [...slug], [[...slug]]
 *
 * @param segment - Dynamic segment from file path (e.g., "[id]", "[...slug]")
 * @returns Object with path string and parameter definition
 *
 * @example
 * ```typescript
 * convertDynamicSegment('[id]')
 * // → { path: '{id}', param: { name: 'id', in: 'path', required: true, schema: { type: 'string' } } }
 *
 * convertDynamicSegment('[...slug]')
 * // → { path: '{slug}', param: { name: 'slug', in: 'path', required: true, schema: { type: 'array', items: { type: 'string' } } } }
 * ```
 */
export function convertDynamicSegment(segment: string): {
  path: string;
  param?: RouteParameter;
} {
  // Match [id] pattern - simple dynamic segment
  const simpleMatch = /^\[([^\]\.]+)\]$/.exec(segment);
  if (simpleMatch) {
    const paramName = simpleMatch[1];
    return {
      path: `{${paramName}}`,
      param: {
        name: paramName,
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `Path parameter: ${paramName}`,
      },
    };
  }

  // Match [...slug] pattern - catch-all segment
  const catchAllMatch = /^\[\.\.\.([^\]]+)\]$/.exec(segment);
  if (catchAllMatch) {
    const paramName = catchAllMatch[1];
    return {
      path: `{${paramName}}`,
      param: {
        name: paramName,
        in: 'path',
        required: true,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
        description: `Catch-all path parameter: ${paramName}`,
      },
    };
  }

  // Match [[...slug]] pattern - optional catch-all segment
  const optionalCatchAllMatch = /^\[\[\.\.\.([^\]]+)\]\]$/.exec(segment);
  if (optionalCatchAllMatch) {
    const paramName = optionalCatchAllMatch[1];
    return {
      path: `{${paramName}}`,
      param: {
        name: paramName,
        in: 'path',
        required: false,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
        description: `Optional catch-all path parameter: ${paramName}`,
      },
    };
  }

  // Static segment - return as-is
  return { path: segment };
}

/**
 * Converts catch-all segment [...slug] to OpenAPI path and parameter
 * Helper function for convertDynamicSegment
 */
export function convertCatchAll(paramName: string): {
  path: string;
  param: RouteParameter;
} {
  return {
    path: `{${paramName}}`,
    param: {
      name: paramName,
      in: 'path',
      required: true,
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
      description: `Catch-all path parameter: ${paramName}`,
    },
  };
}

/**
 * Converts optional catch-all segment [[...slug]] to OpenAPI path and parameter
 * Helper function for convertDynamicSegment
 */
export function convertOptionalCatchAll(paramName: string): {
  path: string;
  param: RouteParameter;
} {
  return {
    path: `{${paramName}}`,
    param: {
      name: paramName,
      in: 'path',
      required: false,
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
      description: `Optional catch-all path parameter: ${paramName}`,
    },
  };
}

/**
 * Extracts path segments from a Next.js file path
 *
 * @param filePath - Absolute file path (e.g., "/project/pages/api/users/[id].ts")
 * @param routerType - Type of Next.js router ('pages' | 'app')
 * @returns Array of path segments after /api/
 *
 * @example
 * ```typescript
 * extractPathSegments('/project/pages/api/users/[id].ts', 'pages')
 * // → ['users', '[id]']
 *
 * extractPathSegments('/project/app/api/products/route.ts', 'app')
 * // → ['products']
 * ```
 */
export function extractPathSegments(
  filePath: string,
  routerType: 'pages' | 'app'
): string[] {
  // Normalize path separators to forward slash
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Find /api/ in the path
  const apiIndex = normalizedPath.indexOf('/api/');
  if (apiIndex === -1) {
    return [];
  }

  // Extract everything after /api/
  const afterApi = normalizedPath.slice(apiIndex + 5); // +5 for '/api/'

  // Split into segments
  const segments = afterApi.split('/').filter(Boolean);

  // Remove file extension from last segment
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];

    // For App Router, remove 'route.ts/js/tsx/jsx'
    if (routerType === 'app' && /^route\.(ts|tsx|js|jsx)$/.test(lastSegment)) {
      segments.pop(); // Remove 'route.ts'
    }
    // For Pages Router, remove 'index.ts/js/tsx/jsx' or '[param].ts'
    else if (routerType === 'pages') {
      // If last segment is index.*, remove it (becomes parent path)
      if (/^index\.(ts|tsx|js|jsx)$/.test(lastSegment)) {
        segments.pop();
      }
      // Otherwise remove the file extension
      else {
        segments[segments.length - 1] = lastSegment.replace(
          /\.(ts|tsx|js|jsx)$/,
          ''
        );
      }
    }
  }

  return segments;
}

/**
 * Generates RouteParameter definitions for dynamic path segments
 *
 * @param segments - Array of path segments, some may be dynamic
 * @returns Array of RouteParameter objects for all dynamic segments
 *
 * @example
 * ```typescript
 * generateRouteParameters(['users', '{id}', 'posts', '{postId}'])
 * // → [
 * //   { name: 'id', in: 'path', required: true, ... },
 * //   { name: 'postId', in: 'path', required: true, ... }
 * // ]
 * ```
 */
export function generateRouteParameters(segments: string[]): RouteParameter[] {
  const parameters: RouteParameter[] = [];

  for (const segment of segments) {
    // Check if segment is a dynamic parameter {paramName}
    const paramMatch = /^\{([^}]+)\}$/.exec(segment);
    if (paramMatch) {
      const paramName = paramMatch[1];
      // Check if it's already in parameters (avoid duplicates)
      if (!parameters.some((p) => p.name === paramName)) {
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `Path parameter: ${paramName}`,
        });
      }
    }
  }

  return parameters;
}

/**
 * Infers OpenAPI route path from Next.js file path
 * Main entry point for path inference
 *
 * @param filePath - Absolute path to Next.js API route file
 * @returns RoutePathInfo with inferred path, parameters, and router type
 *
 * @example
 * ```typescript
 * // Pages Router
 * inferRoutePathFromFile('/project/pages/api/users.ts')
 * // → { routePath: '/api/users', parameters: [], routerType: 'pages', isValid: true }
 *
 * // App Router with dynamic segment
 * inferRoutePathFromFile('/project/app/api/users/[id]/route.ts')
 * // → {
 * //   routePath: '/api/users/{id}',
 * //   parameters: [{ name: 'id', in: 'path', required: true, ... }],
 * //   routerType: 'app',
 * //   isValid: true
 * // }
 *
 * // Invalid path
 * inferRoutePathFromFile('/project/src/utils/helper.ts')
 * // → { isValid: false, error: 'Not an API route' }
 * ```
 */
export function inferRoutePathFromFile(filePath: string): RoutePathInfo {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Determine router type
  let routerType: 'pages' | 'app' | undefined;
  if (normalizedPath.includes('/pages/api/')) {
    routerType = 'pages';
  } else if (normalizedPath.includes('/app/api/')) {
    routerType = 'app';
  }

  // Validate that this is an API route
  if (!routerType) {
    return {
      routePath: '',
      parameters: [],
      routerType: 'pages',
      isValid: false,
      error: 'Not an API route (must be in pages/api/ or app/api/)',
    };
  }

  // Additional validation for App Router - must be route.* file
  if (
    routerType === 'app' &&
    !/\/route\.(ts|tsx|js|jsx)$/.test(normalizedPath)
  ) {
    return {
      routePath: '',
      parameters: [],
      routerType: 'app',
      isValid: false,
      error: 'App Router routes must be named route.ts/js/tsx/jsx',
    };
  }

  // Extract path segments
  const segments = extractPathSegments(filePath, routerType);

  // Convert dynamic segments and build path
  const convertedSegments: string[] = [];
  const parameters: RouteParameter[] = [];

  for (const segment of segments) {
    const { path, param } = convertDynamicSegment(segment);
    convertedSegments.push(path);
    if (param) {
      parameters.push(param);
    }
  }

  // Build final OpenAPI path
  const routePath =
    '/api' +
    (convertedSegments.length > 0 ? '/' + convertedSegments.join('/') : '');

  return {
    routePath,
    parameters,
    routerType,
    isValid: true,
  };
}
