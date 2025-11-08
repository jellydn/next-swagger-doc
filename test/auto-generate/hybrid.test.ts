/**
 * End-to-end tests for hybrid mode (US3)
 * Tests merging of auto-generated documentation with explicit JSDoc
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve } from 'node:path';
import { createSwaggerSpec } from '../../src/swagger';

const HYBRID_FIXTURES_DIR = resolve(__dirname, '../fixtures/hybrid');

describe('Hybrid Mode (US3)', () => {
  describe('JSDoc overrides auto-generation', () => {
    it('should merge JSDoc parameters with auto-generated path parameters', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        // Check merged result for /api/users/{id}
        expect(spec.paths['/api/users/{id}']).toBeDefined();
        const getOperation = spec.paths['/api/users/{id}'].get;

        // Auto-gen should provide path parameter
        const idParam = getOperation.parameters.find((p: any) => p.name === 'id' && p.in === 'path');
        expect(idParam).toBeDefined();
        expect(idParam.required).toBe(true);
        expect(idParam.schema.type).toBe('string');

        // JSDoc should provide summary (from first line comment)
        expect(getOperation.summary).toBe('Get user by ID');

        // JSDoc should provide detailed description
        expect(getOperation.description).toBe('Retrieves detailed information for a specific user by their unique identifier');

        // JSDoc should provide additional responses
        expect(getOperation.responses['404']).toBeDefined();
        expect(getOperation.responses['404'].description).toBe('User not found');
        expect(getOperation.responses['500']).toBeDefined();

        // Auto-gen should provide 200 response (merged with JSDoc if present)
        expect(getOperation.responses['200']).toBeDefined();
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should use JSDoc query parameters when provided', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        // Check /api/users endpoint
        expect(spec.paths['/api/users']).toBeDefined();
        const getOperation = spec.paths['/api/users'].get;

        // JSDoc should provide query parameters
        const pageParam = getOperation.parameters.find((p: any) => p.name === 'page');
        expect(pageParam).toBeDefined();
        expect(pageParam.in).toBe('query');
        expect(pageParam.required).toBe(false);
        expect(pageParam.schema.type).toBe('integer');
        expect(pageParam.schema.minimum).toBe(1);
        expect(pageParam.schema.default).toBe(1);

        const limitParam = getOperation.parameters.find((p: any) => p.name === 'limit');
        expect(limitParam).toBeDefined();
        expect(limitParam.schema.maximum).toBe(100);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should use JSDoc tags over auto-generated tags', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
            inferDescriptions: true, // This would auto-gen tags
          },
        });

        const getOperation = spec.paths['/api/users'].get;

        // JSDoc tags should override auto-generated tags
        expect(getOperation.tags).toEqual(['users', 'admin']);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should use JSDoc summary and description over auto-generated', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        const getOperation = spec.paths['/api/users'].get;

        // JSDoc should provide detailed summary and description
        expect(getOperation.summary).toBe('Get all users with pagination');
        expect(getOperation.description).toBe('Returns a paginated list of users from the database');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should merge JSDoc response schemas with auto-generated responses', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        const getOperation = spec.paths['/api/users'].get;

        // JSDoc should provide detailed 200 response schema
        expect(getOperation.responses['200']).toBeDefined();
        expect(getOperation.responses['200'].description).toBe('Successfully retrieved users');
        expect(getOperation.responses['200'].content).toBeDefined();
        expect(getOperation.responses['200'].content['application/json']).toBeDefined();
        expect(getOperation.responses['200'].content['application/json'].schema).toBeDefined();

        // JSDoc should add 401 response
        expect(getOperation.responses['401']).toBeDefined();
        expect(getOperation.responses['401'].description).toBe('Unauthorized - authentication required');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should apply JSDoc security requirements', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        const getOperation = spec.paths['/api/users'].get;

        // JSDoc should provide security requirements
        expect(getOperation.security).toBeDefined();
        expect(getOperation.security).toEqual([{ bearerAuth: [] }]);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Auto-generation fills in missing JSDoc', () => {
    it('should auto-generate path parameters even when JSDoc is present', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        // Even though JSDoc doesn't define the {id} parameter, auto-gen should add it
        const getOperation = spec.paths['/api/users/{id}'].get;
        const idParam = getOperation.parameters.find((p: any) => p.name === 'id');

        expect(idParam).toBeDefined();
        expect(idParam.in).toBe('path');
        expect(idParam.required).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should auto-generate 200 response when not in JSDoc', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        // All GET operations should have a 200 response
        expect(spec.paths['/api/users/{id}'].get.responses['200']).toBeDefined();
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Validation', () => {
    it('should produce valid OpenAPI spec from hybrid mode', async () => {
      const originalCwd = process.cwd();
      process.chdir(HYBRID_FIXTURES_DIR);

      try {
        const spec = await createSwaggerSpec({
          apiFolder: 'pages/api',
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'Hybrid Test API',
              version: '1.0.0',
            },
          },
          autoGenerate: {
            enabled: true,
            includeTypeScript: false,
          },
        });

        // Should have valid OpenAPI structure
        expect(spec.openapi).toBe('3.0.0');
        expect(spec.info).toBeDefined();
        expect(spec.paths).toBeDefined();

        // All paths should be valid
        for (const [path, pathItem] of Object.entries(spec.paths)) {
          expect(path).toMatch(/^\//); // Should start with /

          for (const [method, operation] of Object.entries(pathItem as any)) {
            if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
              expect(operation.responses).toBeDefined();
              expect(Object.keys(operation.responses).length).toBeGreaterThan(0);
            }
          }
        }
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
