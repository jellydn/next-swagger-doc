import { describe, expect, it } from 'vitest';

import { createSwaggerSpec } from '../src';

describe('withSwagger', () => {
  it('should create default swagger json option', () => {
    expect(
      createSwaggerSpec({
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'NextJS Swagger',
            version: '0.1.0',
          },
        },
      }),
    ).toMatchSnapshot();
  });

  it('should have Bearer Authentication', () => {
    expect(
      createSwaggerSpec({
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'NextJS Swagger',
            version: '0.1.0',
          },
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          },
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
        apiFolder: 'pages/api',
      }),
    ).toMatchSnapshot();
  });

  it('should have support OAuth2 Authentication', () => {
    expect(
      createSwaggerSpec({
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'NextJS Swagger',
            version: '0.1.0',
          },
          components: {
            securitySchemes: {
              OAuth2: {
                type: 'oauth2',
                description: 'OAuth2 authentication with a bearer token.',
                flows: {
                  implicit: {
                    authorizationUrl: 'https://example.com/authorize',
                    scopes: {
                      'read:pets': 'read your pets',
                      'write:pets': 'modify pets in your account',
                    },
                  },
                  password: {
                    tokenUrl: 'https://example.com/token',
                    scopes: {
                      'read:pets': 'read your pets',
                      'write:pets': 'modify pets in your account',
                    },
                  },
                },
              },
            },
          },
          security: [
            {
              OAuth2: ['read', 'write'],
            },
          ],
        },
        apiFolder: 'pages/api',
      }),
    ).toMatchSnapshot();
  });
});
