# Welcome to next-swagger-doc 👋

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000)
![Prerequisite](https://img.shields.io/badge/node-%3E%3D10-blue.svg)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](http://next-swagger-doc.productsway.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)
[![Twitter: jellydn](https://img.shields.io/twitter/follow/jellydn.svg?style=social)](https://twitter.com/jellydn)

> Generate Swagger JSON API from NextJS Api Routes

### 🏠 [Homepage](https://github.com/jellydn/next-swagger-doc)

### ✨ [Demo](http://next-swagger-doc-demo.productsway.com/)

## Prerequisites

- nextjs >= 9

## Install

```sh
yarn install next-swagger-doc
```

## Usage

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

## Run tests

```sh
yarn test
```

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
