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
      res.status(400).send(error);
    }
  };
}
