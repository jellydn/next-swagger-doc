import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';

import swaggerJsdoc, { Options } from 'swagger-jsdoc';

type SwaggerOptions = Options & {
  apiFolder?: string;
};

const defaultOptions: SwaggerOptions = {
  apiFolder: 'pages/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Demo Api',
      version: '1.0',
    },
  },
};

/**
 * Create swagger JSON
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.title Title
 * @param options.version Version
 * @returns Swagger JSON Spec
 */
export function createSwaggerSpec({
  apiFolder = 'pages/api',
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  const apiDirectory = join(process.cwd(), apiFolder);
  const buildApiDirectory = join(process.cwd(), '.next/server', apiFolder);

  const options: Options = {
    ...swaggerOptions,
    apis: [
      `${apiDirectory}/**/*.js`,
      `${apiDirectory}/**/*.ts`,
      `${apiDirectory}/**/*.tsx`,
      `${buildApiDirectory}/**/*.js`,
    ], // files containing annotations as above
  };

  return swaggerJsdoc(options);
}

/**
 * withSwagger middleware
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.title Title
 * @param options.version Version
 * @returns
 */
export function withSwagger({
  apiFolder = 'pages/api',
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  return () => {
    return (_req: NextApiRequest, res: NextApiResponse) => {
      try {
        const swaggerSpec = createSwaggerSpec({
          apiFolder,
          ...swaggerOptions,
        });
        res.status(200).send(swaggerSpec);
      } catch (error) {
        res.status(400).send(error);
      }
    };
  };
}
