import { describe, expect, it } from 'vitest';

import { createSwaggerSpec, extractApiInfo } from '../src';

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
      })
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
      })
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
      })
    ).toMatchSnapshot();
  });

  it('extracts App Router paths and exported HTTP methods', () => {
    expect(extractApiInfo('test/fixtures/app')).toEqual([
      { path: '/api/health', methods: ['get', 'head'] },
      { path: '/api/manual', methods: ['get'] },
      { path: '/api/users/{id}', methods: ['patch', 'delete'] },
      { path: '/blog', methods: ['get'] },
      { path: '/blog/{slug}', methods: ['get'] },
      { path: '/commented', methods: ['get'] },
      { path: '/users', methods: ['get', 'post'] },
    ]);
  });

  it('extracts compiled routes when source files are unavailable', () => {
    expect(extractApiInfo('app/only-compiled', 'test/fixtures')).toEqual([
      { path: '/only-compiled/compiled', methods: ['options'] },
    ]);
  });

  it('generates basic documentation without replacing manual operations', () => {
    const spec = createSwaggerSpec({
      apiFolder: 'test/fixtures/app/api',
      autoDoc: true,
      definition: {
        openapi: '3.0.0',
        info: { title: 'Auto docs', version: '1.0.0' },
      },
    });

    expect(spec.paths).toMatchObject({
      '/api/health': {
        get: { responses: { 200: { description: 'Successful response' } } },
        head: { responses: { 200: { description: 'Successful response' } } },
      },
      '/api/manual': {
        get: {
          summary: 'Manual documentation',
          responses: { 204: { description: 'No content' } },
        },
      },
      '/api/users/{id}': {
        patch: {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'Successful response' } },
        },
        delete: { responses: { 200: { description: 'Successful response' } } },
      },
    });
  });

  it('extracts a narrowed API folder', () => {
    expect(extractApiInfo('test/fixtures/app/api')).toEqual([
      { path: '/api/health', methods: ['get', 'head'] },
      { path: '/api/manual', methods: ['get'] },
      { path: '/api/users/{id}', methods: ['patch', 'delete'] },
    ]);
  });

  it('ignores a missing App Router directory', () => {
    expect(extractApiInfo('test/fixtures/missing')).toEqual([]);
  });
});
