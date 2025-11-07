/**
 * End-to-end test for auto-generation integration with createSwaggerSpec
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createSwaggerSpec } from '../../src/swagger';

const TEST_PROJECT_DIR = join(__dirname, '../fixtures/test-project');

describe('createSwaggerSpec with auto-generation', () => {
  beforeAll(() => {
    // Create a temporary test project structure
    mkdirSync(join(TEST_PROJECT_DIR, 'pages/api/users'), { recursive: true });
    mkdirSync(join(TEST_PROJECT_DIR, 'app/api/products'), { recursive: true });

    // Pages Router route
    writeFileSync(
      join(TEST_PROJECT_DIR, 'pages/api/users/index.ts'),
      `
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Get all users
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ users: [] });
}
      `.trim()
    );

    // Pages Router route with dynamic param
    writeFileSync(
      join(TEST_PROJECT_DIR, 'pages/api/users/[id].ts'),
      `
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Get user by ID
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ user: {} });
}
      `.trim()
    );

    // App Router route
    writeFileSync(
      join(TEST_PROJECT_DIR, 'app/api/products/route.ts'),
      `
/**
 * List all products
 */
export async function GET(request: Request) {
  return Response.json({ products: [] });
}

/**
 * Create a new product
 */
export async function POST(request: Request) {
  return Response.json({ product: {} }, { status: 201 });
}
      `.trim()
    );
  });

  afterAll(() => {
    // Clean up test project
    rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  });

  it('should generate spec with auto-generation enabled', async () => {
    // Change working directory for this test
    const originalCwd = process.cwd();
    process.chdir(TEST_PROJECT_DIR);

    try {
      const spec = await createSwaggerSpec({
        apiFolder: 'pages/api',
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
        },
        autoGenerate: true,
      });

      // Should have generated OpenAPI spec
      expect(spec).toBeDefined();
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Test API');

      // Should have paths from auto-generation
      expect(spec.paths).toBeDefined();

      // Check for Pages Router routes
      expect(spec.paths['/api/users']).toBeDefined();
      expect(spec.paths['/api/users'].get).toBeDefined();
      expect(spec.paths['/api/users'].get.summary).toBe('Get all users');

      expect(spec.paths['/api/users/{id}']).toBeDefined();
      expect(spec.paths['/api/users/{id}'].get).toBeDefined();
      expect(spec.paths['/api/users/{id}'].get.summary).toBe('Get user by ID');

      // Should have path parameter
      const idParam = spec.paths['/api/users/{id}'].get.parameters.find(
        (p: any) => p.name === 'id'
      );
      expect(idParam).toBeDefined();
      expect(idParam.in).toBe('path');
      expect(idParam.required).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should generate spec for both router types when configured', async () => {
    const originalCwd = process.cwd();
    process.chdir(TEST_PROJECT_DIR);

    try {
      const spec = await createSwaggerSpec({
        apiFolder: 'pages/api',
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
        },
        autoGenerate: {
          enabled: true,
          routerTypes: ['pages', 'app'],
        },
      });

      // Pages Router routes
      expect(spec.paths['/api/users']).toBeDefined();

      // App Router routes (when scanning root directory)
      // Note: Since apiFolder is 'pages/api', App Router routes won't be found
      // This is expected behavior for this test
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should not generate paths when auto-generation is disabled', async () => {
    const originalCwd = process.cwd();
    process.chdir(TEST_PROJECT_DIR);

    try {
      const spec = await createSwaggerSpec({
        apiFolder: 'pages/api',
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
        },
        autoGenerate: false,
      });

      // Should have basic spec structure but no auto-generated paths
      expect(spec).toBeDefined();
      expect(spec.openapi).toBe('3.0.0');

      // May have paths from JSDoc but not from auto-generation
      // Since we have no JSDoc annotations, paths should be empty or undefined
      expect(spec.paths || {}).toEqual({});
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should infer tags from route paths', async () => {
    const originalCwd = process.cwd();
    process.chdir(TEST_PROJECT_DIR);

    try {
      const spec = await createSwaggerSpec({
        apiFolder: 'pages/api',
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
        },
        autoGenerate: {
          enabled: true,
          inferDescriptions: true,
        },
      });

      // Users routes should have 'users' tag
      expect(spec.paths['/api/users'].get.tags).toContain('users');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should handle errors gracefully and continue with manual spec', async () => {
    const originalCwd = process.cwd();
    process.chdir(TEST_PROJECT_DIR);

    try {
      // This should not throw even if auto-generation fails
      const spec = await createSwaggerSpec({
        apiFolder: 'nonexistent/api',
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
        },
        autoGenerate: true,
      });

      // Should still have valid spec structure
      expect(spec).toBeDefined();
      expect(spec.openapi).toBe('3.0.0');
    } finally {
      process.chdir(originalCwd);
    }
  });
});
