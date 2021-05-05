import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';

import swaggerJsdoc from 'swagger-jsdoc';

type SwaggerOptions = {
  openApiVersion?: string;
  apiFolder?: string;
  title: string;
  version: string;
};

export function prepareSwaggerOptions({
  openApiVersion = '3.0.0',
  apiFolder = 'pages/api',
  title,
  version,
}: SwaggerOptions) {
  const apiDirectory = join(process.cwd(), apiFolder);

  const options = {
    definition: {
      openapi: openApiVersion,
      info: {
        title,
        version,
      },
    },
    apis: [`${apiDirectory}/*.js`, `${apiDirectory}/*.ts`], // files containing annotations as above
  };

  return options;
}

/**
 * withSwagger middleware
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {/pages/api}
 * @param options.title Title
 * @param options.version Version
 * @returns
 */
export function withSwagger(options: SwaggerOptions) {
  return () => {
    return (_req: NextApiRequest, res: NextApiResponse) => {
      try {
        const swaggerSpec = swaggerJsdoc(prepareSwaggerOptions(options));
        res.status(200).send(swaggerSpec);
      } catch (error) {
        res.status(400).send(error);
      }
    };
  };
}
