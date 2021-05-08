# Welcome to next-swagger-doc 👋

![Version](https://img.shields.io/badge/version-0.1.5-blue.svg?cacheSeconds=2592000)
![Prerequisite](https://img.shields.io/badge/node-%3E%3D10-blue.svg)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](http://next-swagger-doc.productsway.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)
[![Twitter: jellydn](https://img.shields.io/twitter/follow/jellydn.svg?style=social)](https://twitter.com/jellydn)

> Generate Swagger JSON API from NextJS Api Routes

## 🏠 [Homepage](https://github.com/jellydn/next-swagger-doc)

### ✨ [Demo](https://next-swagger-doc-demo.productsway.com/api-doc)

## Prerequisites

- nextjs >= 9

## Motivation

This package reads your JSDoc-annotated source code on [NextJS API route](https://nextjs.org/docs/api-routes/api-middlewares) and generates an OpenAPI (Swagger) specification.

[nextjs](https://nextjs.org) +
[swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc/blob/v6/docs/README.md) = [next-swagger-doc](https://github.com/jellydn/next-swagger-doc)

## Install

```sh
yarn install next-swagger-doc
```

## Usage #1: Create an single API document

```sh
yarn add next-swagger-doc swagger-ui-react
```

```typescript
import { GetStaticProps, InferGetStaticPropsType } from 'next';

import { createSwaggerSpec } from 'next-swagger-doc';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const ApiDoc = ({ spec }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return <SwaggerUI spec={spec} />;
};

export const getStaticProps: GetStaticProps = async ctx => {
  const spec: Record<string, any> = createSwaggerSpec({
    title: 'NextJS Swagger',
    version: '0.1.0',
  });
  return {
    props: {
      spec,
    },
  };
};

export default ApiDoc;
```

![https://gyazo.com/af250bab0d07f931c596ebc8c955ae2e.gif](https://gyazo.com/af250bab0d07f931c596ebc8c955ae2e.gif)

## Usage #2: Use NextJS API route for create Swagger JSON spec

- Step 1: Create an api route on nextjs, e.g: pages/doc.ts

```typescript
import { withSwagger } from 'next-swagger-doc';

const swaggerHandler = withSwagger({
  openApiVersion: '3.0.0',
  title: 'Next Swagger API Example',
  version: '0.1.0',
});
export default swaggerHandler();
```

- Step 2: Add JSdoc on API

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns the hello world
 *     responses:
 *       200:
 *         description: hello world
 */
const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({
    result: 'hello world',
  });
};

export default handler;
```

- Step 3: Access the Swagger API doc

![https://gyazo.com/0bcf45f0e15778a5cb851b40526324f3.gif](https://gyazo.com/0bcf45f0e15778a5cb851b40526324f3.gif)

## Run example app

```sh
gh repo clone jellydn/next-swagger-doc
cd example
yarn install
yarn dev
```

Then open http://localhost:3000/api-doc or http://localhost:3000/ on your browser
![./example-screenshot.png](./example-screenshot.png)

## Author

👤 **Huynh Duc Dung**

- Website: https://productsway.com/
- Twitter: [@jellydn](https://twitter.com/jellydn)
- Github: [@jellydn](https://github.com/jellydn)

## Show your support

Give a ⭐️ if this project helped you!

[![support us](https://img.shields.io/badge/become-a patreon%20us-orange.svg?cacheSeconds=2592000)](https://www.patreon.com/jellydn)

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
