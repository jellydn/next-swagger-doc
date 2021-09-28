import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';

import swaggerJsdoc from 'swagger-jsdoc';

type SwaggerOptions = {
  openApiVersion?: string;
  apiFolder?: string;
  title: string;
  version: string;
};

/**
 * Create swagger JSON
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.title Title
 * @param options.version Version
 * @returns Swagger JSON Spec
 *
 * @example
 * createSwaggerSpec({
 *  openApiVersion: '3.0.0',
 *  apiFolder:  'pages/api',
 *  title: 'Demo Api',
 *  version: '1.0',
 * })
 */
export function createSwaggerSpec({
  openApiVersion = '3.0.0',
  apiFolder = 'pages/api',
  title,
  version,
}: SwaggerOptions) {
  const apiDirectory = join(process.cwd(), apiFolder);
  const buildApiDirectory = join(process.cwd(), '.next/server', apiFolder);

  const options = {
    definition: {
      openapi: openApiVersion,
      info: {
        title,
        version,
      },
    },
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
 *
 * @example
 * createSwaggerSpec({
 *  openApiVersion: '3.0.0',
 *  apiFolder:  'pages/api',
 *  title: 'Demo Api',
 *  version: '1.0',
 * })
 */
export function withSwagger({
  openApiVersion = '3.0.0',
  apiFolder = 'pages/api',
  title,
  version,
}: SwaggerOptions) {
  return () => {
    return (_req: NextApiRequest, res: NextApiResponse) => {
      try {
        const swaggerSpec = createSwaggerSpec({
          openApiVersion,
          apiFolder,
          title,
          version,
        });
        res.status(200).send(swaggerSpec);
      } catch (error) {
        res.status(400).send(error);
      }
    };
  };
}
