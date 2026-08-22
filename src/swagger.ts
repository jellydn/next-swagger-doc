import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';
import swaggerJsdoc, { type OAS3Definition, type Options } from 'swagger-jsdoc';
import { extractApiInfo, generateAutoDoc } from './auto-doc';

export type AutoDocOptions = {
  enabled?: boolean;
};

export type SwaggerOptions = Options & {
  apiFolder?: string;
  schemaFolders?: string[];
  definition: OAS3Definition;
  outputFile?: string;
  /** Generate basic OpenAPI operations from App Router route files. */
  autoDoc?: boolean | AutoDocOptions;
  /**
   * Glob compiled files under `.next/server`.
   * Default: only when the source API folder is missing and Next.js is not
   * currently compiling (standalone / runtime fallback).
   */
  scanBuildOutput?: boolean;
};

/** Next.js phases that rewrite `.next` and must not be globbed. */
const NEXT_BUILD_PHASES = new Set([
  'phase-production-build',
  'phase-production-compile',
  'phase-export',
]);

/**
 * Whether compiled files under `.next/server` should be globbed.
 *
 * Globbing `.next` while Next.js is compiling can fail Vercel builds with
 * `ENOENT: .../.next/export-detail.json`. Prefer source files; scan compiled
 * output only as a runtime fallback when the source folder is gone.
 */
export function shouldScanBuildDirectory({
  sourceDirectory,
  buildDirectory,
  scanBuildOutput,
  nextPhase = process.env.NEXT_PHASE,
}: {
  sourceDirectory: string;
  buildDirectory: string;
  scanBuildOutput?: boolean;
  nextPhase?: string;
}): boolean {
  if (!existsSync(buildDirectory) || scanBuildOutput === false) {
    return false;
  }
  if (scanBuildOutput === true) {
    return true;
  }
  if (nextPhase && NEXT_BUILD_PHASES.has(nextPhase)) {
    return false;
  }
  return !existsSync(sourceDirectory);
}

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
 * Create swagger JSON
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.schemaFolders entity schema folders
 * @param options.title Title
 * @param options.version Version
 * @returns Swagger JSON Spec
 */
export function createSwaggerSpec({
  apiFolder = 'pages/api',
  schemaFolders = [],
  autoDoc = false,
  scanBuildOutput,
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  const scanFolders = [apiFolder, ...schemaFolders];
  const apis = scanFolders.flatMap((folder) => {
    const buildApiDirectory = join(process.cwd(), '.next/server', folder);
    const apiDirectory = join(process.cwd(), folder);
    const publicDirectory = join(process.cwd(), 'public');
    const fileTypes = ['ts', 'tsx', 'jsx', 'js', 'json', 'swagger.yaml'];
    const paths = [
      ...fileTypes.map((fileType) => `${apiDirectory}/**/*.${fileType}`),
      // Support load static files from public directory
      ...['swagger.yaml', 'json'].map(
        (fileType) => `${publicDirectory}/**/*.${fileType}`
      ),
    ];
    if (
      shouldScanBuildDirectory({
        sourceDirectory: apiDirectory,
        buildDirectory: buildApiDirectory,
        scanBuildOutput,
      })
    ) {
      paths.push(
        ...['js', 'swagger.yaml', 'json'].map(
          (fileType) => `${buildApiDirectory}/**/*.${fileType}`
        )
      );
    }
    return paths;
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
  const spec = swaggerJsdoc(options) as OAS3Definition;

  if (autoDoc === true || (typeof autoDoc === 'object' && autoDoc.enabled)) {
    const autoPaths = generateAutoDoc(extractApiInfo(apiFolder));
    spec.paths = Object.fromEntries(
      Object.entries({ ...autoPaths, ...spec.paths }).map(
        ([path, operations]) => {
          const generatedOperations = autoPaths[path] ?? {};
          return [path, { ...generatedOperations, ...operations }];
        }
      )
    );
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
  autoDoc = false,
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  return () => (_req: NextApiRequest, res: NextApiResponse) => {
    try {
      const swaggerSpec = createSwaggerSpec({
        apiFolder,
        schemaFolders,
        autoDoc,
        ...swaggerOptions,
      });
      res.status(200).send(swaggerSpec);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create Swagger spec',
      });
    }
  };
}
