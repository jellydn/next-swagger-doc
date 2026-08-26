import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';
import swaggerJsdoc, { type OAS3Definition, type Options } from 'swagger-jsdoc';
import { extractApiInfo, generateAutoDoc } from './auto-doc';
import { mergeAutoDoc } from './merge-auto-doc';
import {
  discoverSpecLocations,
  shouldScanBuildDirectory,
} from './spec-source';

export { shouldScanBuildDirectory };

export type AutoDocOptions = {
  enabled?: boolean;
};

export type SwaggerOptions = Options & {
  apiFolder?: string;
  schemaFolders?: string[];
  definition: OAS3Definition;
  /** Write the generated spec to this JSON file. */
  outputFile?: string;
  /**
   * Load a prebuilt OpenAPI JSON file (for example `public/swagger.json`).
   * When the file exists it is returned as-is, which is the standalone-output
   * path: generate at build time, serve the file at runtime.
   */
  specFile?: string;
  /** Generate basic OpenAPI operations from App Router route files. */
  autoDoc?: boolean | AutoDocOptions;
  /**
   * Glob compiled files under `.next/server`.
   * Default: only when the source API folder is missing and Next.js is not
   * currently compiling (standalone / runtime fallback).
   */
  scanBuildOutput?: boolean;
};

/** Resolve a user-supplied path against the process working directory. */
function resolveUserPath(file: string, cwd = process.cwd()): string {
  return isAbsolute(file) ? file : join(cwd, file);
}

/**
 * Read a prebuilt OpenAPI document. Returns `undefined` when the file is
 * missing so callers can fall back to scanning source or compiled routes.
 */
export function loadSpecFile(
  specFile: string,
  cwd = process.cwd()
): OAS3Definition | undefined {
  const specPath = resolveUserPath(specFile, cwd);
  if (!existsSync(specPath)) {
    return undefined;
  }
  return JSON.parse(readFileSync(specPath, 'utf8')) as OAS3Definition;
}

/**
 * Auto-doc is on when requested, and also as a standalone fallback when the
 * source API folder is missing (compiled `route.js` files may still exist).
 */
export function isAutoDocEnabled(
  autoDoc: boolean | AutoDocOptions | undefined,
  sourceMissing: boolean
): boolean {
  const enabled = typeof autoDoc === 'object' ? autoDoc.enabled : autoDoc;
  if (enabled === false) {
    return false;
  }
  if (enabled === true) {
    return true;
  }
  return sourceMissing;
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
  autoDoc,
  scanBuildOutput,
  specFile,
  outputFile,
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  if (specFile) {
    const saved = loadSpecFile(specFile);
    if (saved) {
      return saved;
    }
  }

  const scanFolders = [apiFolder, ...schemaFolders];
  const { sourceDirs, buildDirs, publicDir } =
    discoverSpecLocations(scanFolders);
  const fileTypes = ['ts', 'tsx', 'jsx', 'js', 'json', 'swagger.yaml'];
  const apis = [
    ...sourceDirs.flatMap((dir) =>
      fileTypes.map((fileType) => `${dir}/**/*.${fileType}`)
    ),
    ...['swagger.yaml', 'json'].map(
      (fileType) => `${publicDir}/**/*.${fileType}`
    ),
    ...sourceDirs.flatMap((sourceDirectory, index) => {
      const buildDirectory = buildDirs[index];
      if (
        !buildDirectory ||
        !shouldScanBuildDirectory({
          sourceDirectory,
          buildDirectory,
          scanBuildOutput,
        })
      ) {
        return [];
      }
      return ['js', 'swagger.yaml', 'json'].map(
        (fileType) => `${buildDirectory}/**/*.${fileType}`
      );
    }),
  ];

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
  const sourceDirectory = join(process.cwd(), apiFolder);

  if (isAutoDocEnabled(autoDoc, !existsSync(sourceDirectory))) {
    const autoPaths = generateAutoDoc(
      extractApiInfo(apiFolder, process.cwd(), { scanBuildOutput })
    );
    spec.paths = mergeAutoDoc(autoPaths, spec.paths ?? {}) as OAS3Definition['paths'];
  }

  if (outputFile) {
    const outputPath = resolveUserPath(outputFile);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(spec, null, 2));
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
  autoDoc,
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
    } catch {
      res.status(500).json({
        error: 'Failed to create Swagger spec',
      });
    }
  };
}
