# Welcome to next-swagger-doc 👋

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

[![Version](https://img.shields.io/npm/v/next-swagger-doc.svg)](https://npmjs.org/package/next-swagger-doc)
[![Downloads/week](https://img.shields.io/npm/dw/next-swagger-doc.svg)](https://npmjs.org/package/next-swagger-doc)
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
yarn add next-swagger-doc
```

## Usage #1: Create an single API document

```sh
yarn add next-swagger-doc swagger-ui-react
```

- Create an live swagger page, e.g: `pages/api-doc.tsx`

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

## Usage #2: Use NextJS API route to create Swagger JSON spec

- Step 1: Create an api route on nextjs, e.g: `pages/api/doc.ts`

```typescript
import { withSwagger } from 'next-swagger-doc';

const swaggerHandler = withSwagger({
  openApiVersion: '3.0.0',
  title: 'Next Swagger API Example',
  version: '0.1.0',
  apiFolder: 'pages/api',
});
export default swaggerHandler();
```

- Step 2: Add JSdoc to any NextJS API routes, for example: `pages/api/hello.ts`

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

## Stargazers

[![Stargazers repo roster for @jellydn/next-swagger-doc](https://reporoster.com/stars/jellydn/next-swagger-doc)](https://github.com/jellydn/next-swagger-doc/stargazers)

## Show your support

Give a ⭐️ if this project helped you!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q5Q61Q7YM)

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://productsway.com/"><img src="https://avatars.githubusercontent.com/u/870029?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dung Duc Huynh (Kaka)</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=jellydn" title="Code">💻</a> <a href="https://github.com/jellydn/next-swagger-doc/commits?author=jellydn" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/tmirkovic"><img src="https://avatars.githubusercontent.com/u/6806116?v=4?s=100" width="100px;" alt=""/><br /><sub><b>tmirkovic</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=tmirkovic" title="Documentation">📖</a></td>
    <td align="center"><a href="http://holloway.co.nz/"><img src="https://avatars.githubusercontent.com/u/620580?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Matthew Holloway</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=holloway" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/leventemihaly"><img src="https://avatars.githubusercontent.com/u/11655496?v=4?s=100" width="100px;" alt=""/><br /><sub><b>leventemihaly</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=leventemihaly" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
