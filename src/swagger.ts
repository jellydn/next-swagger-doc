import { join } from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';
import swaggerJsdoc, { type OAS3Definition, type Options } from 'swagger-jsdoc';
import { autoGenerateRoutes } from './auto-generate';
import type { AutoGenerateConfig } from './auto-generate/config';
import { detectConflicts, mergeRouteInfo } from './auto-generate/merger';
import type { RouteInfo } from './auto-generate/types';

export type SwaggerOptions = Options & {
  apiFolder?: string;
  schemaFolders?: string[];
  definition: OAS3Definition;
  outputFile?: string;
  /**
   * Enable automatic OpenAPI generation from Next.js routes
   * - `true`: Enable with default settings
   * - `false`: Disable (default)
   * - `AutoGenerateConfig`: Enable with custom settings
   */
  autoGenerate?: boolean | Partial<AutoGenerateConfig>;
};

const defaultOptions: SwaggerOptions = {
  apiFolder: 'pages/api',
  schemaFolders: [],
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Next Swagger Doc Demo Api',
      version: '1.0',
    },
  },
};

/**
 * Converts RouteInfo objects to OpenAPI path objects
 *
 * @param routes - Array of auto-generated RouteInfo
 * @returns OpenAPI paths object
 */
function convertRoutesToOpenAPI(routes: RouteInfo[]): Record<string, any> {
  const paths: Record<string, any> = {};

  for (const route of routes) {
    // Initialize path if not exists
    if (!paths[route.routePath]) {
      paths[route.routePath] = {};
    }

    // Convert method to lowercase for OpenAPI
    const method = route.method.toLowerCase();

    // Build operation object
    const operation: any = {
      summary: route.summary,
      description: route.description,
      tags: route.tags,
      parameters: route.parameters.map((param) => ({
        name: param.name,
        in: param.in,
        required: param.required,
        description: param.description,
        schema: param.schema,
        example: param.example,
        deprecated: param.deprecated,
      })),
      responses: {},
    };

    // Convert responses
    for (const [statusCode, response] of Object.entries(route.responses)) {
      operation.responses[statusCode] = {
        description: response.description,
        content: response.content,
        headers: response.headers,
      };
    }

    // Add request body if present
    if (route.requestBody) {
      operation.requestBody = {
        content: {
          [route.requestBody.contentType]: {
            schema: route.requestBody.inlineSchema || {
              $ref: route.requestBody.schemaRef,
            },
          },
        },
      };
    }

    // Add security if present
    if (route.security) {
      operation.security = route.security;
    }

    // Add deprecated flag if present
    if (route.deprecated) {
      operation.deprecated = true;
    }

    paths[route.routePath][method] = operation;
  }

  return paths;
}

/**
 * Parses JSDoc OpenAPI paths into RouteInfo-like objects for merging
 *
 * @param spec - Swagger spec with JSDoc paths
 * @returns Array of partial RouteInfo objects from JSDoc
 */
function parseJSDocRoutes(
  spec: any
): Array<Partial<RouteInfo> & Pick<RouteInfo, 'routePath' | 'method'>> {
  if (!spec.paths) {
    return [];
  }

  const routes: Array<
    Partial<RouteInfo> & Pick<RouteInfo, 'routePath' | 'method'>
  > = [];

  for (const [path, pathItem] of Object.entries(
    spec.paths as Record<string, any>
  )) {
    // Iterate through HTTP methods
    const methods = [
      'get',
      'post',
      'put',
      'delete',
      'patch',
      'options',
      'head',
    ];

    for (const methodLower of methods) {
      const operation = pathItem[methodLower];
      if (!operation) {
        continue;
      }

      const method = methodLower.toUpperCase() as RouteInfo['method'];

      // Parse operation into RouteInfo format
      const route: Partial<RouteInfo> &
        Pick<RouteInfo, 'routePath' | 'method'> = {
        routePath: path,
        method,
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags,
        deprecated: operation.deprecated,
        security: operation.security,
        parameters: operation.parameters || [],
        responses: {},
      };

      // Parse request body
      if (operation.requestBody) {
        const contentType =
          Object.keys(operation.requestBody.content || {})[0] ||
          'application/json';
        const content = operation.requestBody.content?.[contentType];

        route.requestBody = {
          contentType,
          type: content?.schema?.$ref ? 'reference' : 'inline',
          schemaRef: content?.schema?.$ref,
          inlineSchema: content?.schema?.$ref ? undefined : content?.schema,
        };
      }

      // Parse responses
      if (operation.responses) {
        for (const [statusCode, response] of Object.entries(
          operation.responses
        )) {
          route.responses![Number(statusCode)] = {
            description: (response as any).description || '',
            content: (response as any).content,
            headers: (response as any).headers,
          };
        }
      }

      routes.push(route);
    }
  }

  return routes;
}

/**
 * Merges auto-generated routes with existing swagger spec
 * Uses hybrid mode with explicit JSDoc taking precedence
 *
 * @param spec - Existing swagger spec from JSDoc
 * @param autoGenRoutes - Auto-generated routes
 * @param enableHybridMode - Enable deep merging (default: true)
 * @returns Merged spec
 */
function mergeAutoGeneratedRoutes(
  spec: any,
  autoGenRoutes: RouteInfo[],
  enableHybridMode = true
): any {
  if (!enableHybridMode) {
    // Simple mode: auto-gen fills in missing paths, JSDoc overrides completely
    const autoGenPaths = convertRoutesToOpenAPI(autoGenRoutes);

    const mergedPaths = { ...autoGenPaths };

    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(
        spec.paths as Record<string, any>
      )) {
        if (mergedPaths[path]) {
          // JSDoc completely overrides
          mergedPaths[path] = {
            ...mergedPaths[path],
            ...pathItem,
          };
        } else {
          mergedPaths[path] = pathItem;
        }
      }
    }

    return {
      ...spec,
      paths: mergedPaths,
    };
  }

  // Hybrid mode: deep merge using merger module
  const jsdocRoutes = parseJSDocRoutes(spec);

  // Find conflicts and merge
  const _conflicts = detectConflicts(autoGenRoutes, jsdocRoutes as RouteInfo[]);

  // Build map of merged routes
  const mergedRoutes = new Map<string, RouteInfo>();

  // Add all auto-gen routes
  for (const autoRoute of autoGenRoutes) {
    const key = `${autoRoute.method}:${autoRoute.routePath}`;
    mergedRoutes.set(key, autoRoute);
  }

  // Merge JSDoc routes (override auto-gen)
  for (const jsdocRoute of jsdocRoutes) {
    const key = `${jsdocRoute.method}:${jsdocRoute.routePath}`;
    const autoRoute = mergedRoutes.get(key);

    if (autoRoute) {
      // Merge auto-gen with JSDoc (JSDoc takes precedence)
      const merged = mergeRouteInfo(autoRoute, jsdocRoute);
      mergedRoutes.set(key, merged);
    } else {
      // JSDoc-only route (no auto-gen)
      // Convert to full RouteInfo
      mergedRoutes.set(key, {
        filePath: '',
        routerType: 'pages',
        handler: {
          exportType: 'default',
          functionName: 'handler',
          isAsync: false,
          sourceLocation: { line: 0, column: 0 },
          zodSchemas: [],
          typeAnnotations: [],
        },
        parameters: [],
        responses: {},
        ...jsdocRoute,
      } as RouteInfo);
    }
  }

  // Convert merged routes to OpenAPI paths
  const mergedPaths = convertRoutesToOpenAPI(Array.from(mergedRoutes.values()));

  return {
    ...spec,
    paths: mergedPaths,
  };
}

/**
 * Create swagger JSON
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.schemaFolders entity schema folders
 * @param options.title Title
 * @param options.version Version
 * @returns Swagger JSON Spec
 */
export async function createSwaggerSpec({
  apiFolder = 'pages/api',
  schemaFolders = [],
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  const scanFolders = [apiFolder, ...schemaFolders];
  const apis = scanFolders.flatMap((folder) => {
    const buildApiDirectory = join(process.cwd(), '.next/server', folder);
    const apiDirectory = join(process.cwd(), folder);
    const publicDirectory = join(process.cwd(), 'public');
    const fileTypes = ['ts', 'tsx', 'jsx', 'js', 'json', 'swagger.yaml'];
    return [
      ...fileTypes.map((fileType) => `${apiDirectory}/**/*.${fileType}`),
      // Only scan build directory for *.swagger.yaml and *.js files
      ...['js', 'swagger.yaml', 'json'].map(
        (fileType) => `${buildApiDirectory}/**/*.${fileType}`
      ),
      // Support load static files from public directory
      ...['swagger.yaml', 'json'].map(
        (fileType) => `${publicDirectory}/**/*.${fileType}`
      ),
    ];
  });

  // Append base path server element to server array
  // Conditions: basePath is specified. Server array is not defined.
  const definition = {
    ...swaggerOptions.definition,
    ...(process.env.__NEXT_ROUTER_BASEPATH &&
      !swaggerOptions.definition.servers && {
        servers: [
          {
            url: process.env.__NEXT_ROUTER_BASEPATH,
            description: 'next-js',
          },
        ],
      }),
  };

  const options: Options = {
    apis, // Files containing annotations as above
    ...swaggerOptions,
    definition,
  };
  let spec = swaggerJsdoc(options);

  // Auto-generation integration (US1 + US2)
  if (swaggerOptions.autoGenerate) {
    const autoGenConfig =
      typeof swaggerOptions.autoGenerate === 'boolean'
        ? { enabled: true }
        : { ...swaggerOptions.autoGenerate, enabled: true };

    try {
      // Generate routes from file structure (with schema extraction)
      const autoGenRoutes = await autoGenerateRoutes(
        join(process.cwd(), apiFolder),
        autoGenConfig
      );

      // Convert to OpenAPI paths and merge with existing spec
      spec = mergeAutoGeneratedRoutes(spec, autoGenRoutes);
    } catch (error) {
      console.warn('[next-swagger-doc] Auto-generation failed:', error);
      // Continue with manual spec if auto-generation fails
    }
  }

  return spec;
}

/**
 * WithSwagger middleware
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.schemaFolders entity schema folders
 * @param options.title Title
 * @param options.version Version
 * @returns
 */
export function withSwagger({
  apiFolder = 'pages/api',
  schemaFolders = [],
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  return () => async (_req: NextApiRequest, res: NextApiResponse) => {
    try {
      const swaggerSpec = await createSwaggerSpec({
        apiFolder,
        schemaFolders,
        ...swaggerOptions,
      });
      res.status(200).send(swaggerSpec);
    } catch (error) {
      res.status(400).send(error);
    }
  };
}
