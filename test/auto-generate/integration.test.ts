/**
 * Integration tests for auto-generation flow
 * Tests the complete path: file discovery → path inference → method detection → RouteInfo
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { autoGenerateRoutes } from '../../src/auto-generate';

const FIXTURES_DIR = resolve(__dirname, '../fixtures');

describe('auto-generate integration', () => {
  describe('autoGenerateRoutes', () => {
    it('should discover and process all App Router routes', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routes = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false, // Disable schema extraction for speed
      });

      // Should find routes from:
      // - app/api/route.ts (GET, POST, DELETE)
      // - app/api/users/route.ts (GET)
      // - app/api/arrow/route.ts (GET, POST)
      expect(routes.length).toBeGreaterThanOrEqual(6);

      // Check that all routes have required fields
      for (const route of routes) {
        expect(route.filePath).toBeDefined();
        expect(route.routePath).toMatch(/^\/api/);
        expect(route.method).toMatch(/^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)$/);
        expect(route.routerType).toBe('app');
        expect(route.handler).toBeDefined();
        expect(route.responses).toBeDefined();
        expect(route.responses[200]).toBeDefined();
      }
    });

    it('should discover and process all Pages Router routes', async () => {
      const pagesApiDir = resolve(FIXTURES_DIR, 'pages/api');

      const routes = await autoGenerateRoutes(pagesApiDir, {
        enabled: true,
        routerTypes: ['pages'],
        includeTypeScript: false,
      });

      // Should find routes from:
      // - pages/api/users.ts (GET)
      expect(routes.length).toBeGreaterThanOrEqual(1);

      const userRoute = routes.find(r => r.routePath === '/api/users');
      expect(userRoute).toBeDefined();
      expect(userRoute?.method).toBe('GET');
      expect(userRoute?.routerType).toBe('pages');
    });

    it('should process both router types when enabled', async () => {
      const fixturesDir = FIXTURES_DIR;

      const routes = await autoGenerateRoutes(fixturesDir, {
        enabled: true,
        routerTypes: ['pages', 'app'],
        includeTypeScript: false,
      });

      const appRoutes = routes.filter(r => r.routerType === 'app');
      const pagesRoutes = routes.filter(r => r.routerType === 'pages');

      expect(appRoutes.length).toBeGreaterThan(0);
      expect(pagesRoutes.length).toBeGreaterThan(0);
    });

    it('should skip disabled router types', async () => {
      const fixturesDir = FIXTURES_DIR;

      const routes = await autoGenerateRoutes(fixturesDir, {
        enabled: true,
        routerTypes: ['app'], // Only App Router
        includeTypeScript: false,
      });

      const pagesRoutes = routes.filter(r => r.routerType === 'pages');
      expect(pagesRoutes.length).toBe(0);
    });

    it('should return empty array when disabled', async () => {
      const fixturesDir = FIXTURES_DIR;

      const routes = await autoGenerateRoutes(fixturesDir, {
        enabled: false,
      });

      expect(routes).toEqual([]);
    });

    it('should preserve path parameters', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routes = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false,
      });

      // Check that routes with path parameters have them defined
      for (const route of routes) {
        const paramMatches = route.routePath.match(/\{([^}]+)\}/g);
        if (paramMatches) {
          expect(route.parameters.length).toBeGreaterThan(0);

          // Verify each parameter in path is defined
          for (const paramMatch of paramMatches) {
            const paramName = paramMatch.slice(1, -1);
            const param = route.parameters.find(p => p.name === paramName);
            expect(param).toBeDefined();
            expect(param?.in).toBe('path');
            expect(param?.required).toBeDefined();
          }
        }
      }
    });

    it('should extract JSDoc summaries', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routes = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false,
      });

      // Find route with JSDoc
      const routeWithJSDoc = routes.find(r =>
        r.routePath === '/api/users' && r.method === 'GET'
      );

      expect(routeWithJSDoc).toBeDefined();
      expect(routeWithJSDoc?.summary).toBe('Simple GET endpoint');
    });

    it('should infer tags from route paths', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routes = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false,
        inferDescriptions: true,
      });

      // Users route should have 'users' tag
      const usersRoute = routes.find(r => r.routePath === '/api/users');
      expect(usersRoute?.tags).toContain('users');

      // Root route should have 'api' tag
      const rootRoute = routes.find(r => r.routePath === '/api');
      expect(rootRoute?.tags).toContain('api');
    });

    it('should handle multiple methods from same file', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routes = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false,
      });

      // app/api/route.ts exports GET, POST, DELETE
      const rootRoutes = routes.filter(r => r.routePath === '/api');
      const methods = rootRoutes.map(r => r.method).sort();

      expect(rootRoutes.length).toBeGreaterThanOrEqual(3);
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('DELETE');

      // Each method should have its own RouteInfo
      const getRoute = rootRoutes.find(r => r.method === 'GET');
      const postRoute = rootRoutes.find(r => r.method === 'POST');

      expect(getRoute).not.toBe(postRoute);
      expect(getRoute?.summary).not.toBe(postRoute?.summary);
    });

    it('should handle errors gracefully', async () => {
      const nonExistentDir = '/nonexistent/api';

      const routes = await autoGenerateRoutes(nonExistentDir, {
        enabled: true,
      });

      // Should return empty array, not throw
      expect(routes).toEqual([]);
    });

    it('should exclude files matching exclude patterns', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routesWithExclude = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false,
        excludePatterns: ['arrow'], // Exclude arrow function fixture
      });

      const arrowRoutes = routesWithExclude.filter(r => r.routePath.includes('arrow'));
      expect(arrowRoutes.length).toBe(0);
    });
  });

  describe('RouteInfo structure', () => {
    it('should generate valid RouteInfo objects', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routes = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false,
      });

      expect(routes.length).toBeGreaterThan(0);

      const route = routes[0];

      // Required fields
      expect(route.filePath).toBeDefined();
      expect(route.routePath).toMatch(/^\/api/);
      expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']).toContain(route.method);
      expect(['pages', 'app']).toContain(route.routerType);

      // Handler info
      expect(route.handler).toBeDefined();
      expect(route.handler.exportType).toMatch(/^(default|named)$/);
      expect(route.handler.functionName).toBeDefined();
      expect(typeof route.handler.isAsync).toBe('boolean');
      expect(route.handler.sourceLocation).toBeDefined();
      expect(route.handler.sourceLocation.line).toBeGreaterThan(0);

      // Parameters
      expect(Array.isArray(route.parameters)).toBe(true);

      // Responses
      expect(route.responses).toBeDefined();
      expect(route.responses[200]).toBeDefined();
      expect(route.responses[200].description).toBeDefined();
    });

    it('should create separate RouteInfo for each method', async () => {
      const appApiDir = resolve(FIXTURES_DIR, 'app/api');

      const routes = await autoGenerateRoutes(appApiDir, {
        enabled: true,
        routerTypes: ['app'],
        includeTypeScript: false,
      });

      // Group by file path
      const routesByFile = new Map<string, typeof routes>();
      for (const route of routes) {
        const existing = routesByFile.get(route.filePath) || [];
        existing.push(route);
        routesByFile.set(route.filePath, existing);
      }

      // Files with multiple methods should have multiple RouteInfo objects
      for (const [filePath, fileRoutes] of routesByFile) {
        const methods = new Set(fileRoutes.map(r => r.method));

        // No duplicate methods for same file
        expect(methods.size).toBe(fileRoutes.length);

        // All routes from same file should have same path
        const paths = new Set(fileRoutes.map(r => r.routePath));
        expect(paths.size).toBe(1);
      }
    });
  });
});
