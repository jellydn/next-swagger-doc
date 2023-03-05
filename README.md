# Welcome to next-swagger-doc 👋

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

[![Version](https://img.shields.io/npm/v/next-swagger-doc.svg)](https://npmjs.org/package/next-swagger-doc)
[![Downloads/week](https://img.shields.io/npm/dw/next-swagger-doc.svg)](https://npmjs.org/package/next-swagger-doc)
![Prerequisite](https://img.shields.io/badge/node-%3E%3D10-blue.svg)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](http://next-swagger-doc.productsway.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)
[![Twitter: jellydn](https://img.shields.io/twitter/follow/jellydn.svg?style=social)](https://twitter.com/jellydn)

> Generate Swagger JSON API from NextJS Api Routes

<sub>If you enjoy working with next-swagger-doc, you will love [next-validations: NextJS API Validations, support Zod, Yup, Fastest-Validator, Joi, and more](https://github.com/jellydn/next-validations)</sub>

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
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic<{
  spec: any;
}>(import('swagger-ui-react'), { ssr: false });

function ApiDoc({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  return <SwaggerUI spec={spec} />;
}

export const getStaticProps: GetStaticProps = async () => {
  const spec: Record<string, any> = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Next Swagger API Example',
        version: '1.0',
      },
    },
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
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NextJS Swagger',
      version: '0.1.0',
    },
  },
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

## Usage 3: Generate Swagger file from CLI

- Step 1: create a JSON config file as `next-swagger-doc.json`

```json
{
  "apiFolder": "pages/api",
  "schemaFolders": ["models"],
  "definition": {
    "openapi": "3.0.0",
    "info": {
      "title": "Next Swagger API Example",
      "version": "1.0"
    }
  }
}
```

- Step 2: run cli for generating swagger file

```sh
yarn next-swagger-doc-cli next-swagger-doc.json
```

## Run example app

```sh
gh repo clone jellydn/next-swagger-doc
cd example
yarn install
yarn dev
```

Then open http://localhost:3000/api-doc or http://localhost:3000/ on your browser
![./example-screenshot.png](./example-screenshot.png)

## Linter

In order to set an eslint rule that checks that all the APIs actually have a swagger JsDoc description we can use the following settings:

Install the JsDoc eslint plugin:

```sh
yarn add -D eslint-plugin-jsdoc
```

Create the custom rule in your eslint configuration file:

```json
{
    //...your configuration
    "overrides": [
        //...your overrides
        {
            // Force the setting of a swagger description on each api endpoint
            "files": ["pages/api/**/*.ts"],
            "plugins": ["jsdoc"],
            "rules": {
                "jsdoc/no-missing-syntax": [
                "error",
                {
                    "contexts": [
                    {
                        "comment": "JsdocBlock:has(JsdocTag[tag=swagger])",
                        "context": "any",
                        "message": "@swagger documentation is required on each API. Check this out for syntax info: https://github.com/jellydn/next-swagger-doc"
                    }
                    ]
                }
            ]
        }
    ]
}
```

## Author

👤 **Huynh Duc Dung**

- Website: https://productsway.com/
- Twitter: [@jellydn](https://twitter.com/jellydn)
- Github: [@jellydn](https://github.com/jellydn)

## Stargazers

[![Stargazers repo roster for @jellydn/next-swagger-doc](https://reporoster.com/stars/jellydn/next-swagger-doc)](https://github.com/jellydn/next-swagger-doc/stargazers)

## Show your support

[![kofi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/dunghd)
[![paypal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/dunghd)
[![buymeacoffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/dunghd)

Give a ⭐️ if this project helped you!

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://productsway.com/"><img src="https://avatars.githubusercontent.com/u/870029?v=4?s=100" width="100px;" alt="Dung Duc Huynh (Kaka)"/><br /><sub><b>Dung Duc Huynh (Kaka)</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=jellydn" title="Code">💻</a> <a href="https://github.com/jellydn/next-swagger-doc/commits?author=jellydn" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tmirkovic"><img src="https://avatars.githubusercontent.com/u/6806116?v=4?s=100" width="100px;" alt="tmirkovic"/><br /><sub><b>tmirkovic</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=tmirkovic" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://holloway.co.nz/"><img src="https://avatars.githubusercontent.com/u/620580?v=4?s=100" width="100px;" alt="Matthew Holloway"/><br /><sub><b>Matthew Holloway</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=holloway" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/leventemihaly"><img src="https://avatars.githubusercontent.com/u/11655496?v=4?s=100" width="100px;" alt="leventemihaly"/><br /><sub><b>leventemihaly</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=leventemihaly" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pahrizal"><img src="https://avatars.githubusercontent.com/u/36581242?v=4?s=100" width="100px;" alt="PAHRIZAL MA'RUP"/><br /><sub><b>PAHRIZAL MA'RUP</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=pahrizal" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ariskk.com/"><img src="https://avatars.githubusercontent.com/u/4972825?v=4?s=100" width="100px;" alt="Aris"/><br /><sub><b>Aris</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=ariskk" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://valerioageno.me/"><img src="https://avatars.githubusercontent.com/u/51341197?v=4?s=100" width="100px;" alt="Valerio Ageno"/><br /><sub><b>Valerio Ageno</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=Valerioageno" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cachho"><img src="https://avatars.githubusercontent.com/u/14180064?v=4?s=100" width="100px;" alt="cachho"/><br /><sub><b>cachho</b></sub></a><br /><a href="https://github.com/jellydn/next-swagger-doc/commits?author=cachho" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
