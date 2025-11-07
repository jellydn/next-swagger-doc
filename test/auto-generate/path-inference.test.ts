/**
 * Unit tests for path-inference module
 * Tests conversion of Next.js file paths to OpenAPI paths
 */

import { describe, it, expect } from 'vitest';
import {
  convertDynamicSegment,
  convertCatchAll,
  convertOptionalCatchAll,
  extractPathSegments,
  generateRouteParameters,
  inferRoutePathFromFile,
} from '../../src/auto-generate/path-inference';

describe('path-inference', () => {
  describe('convertDynamicSegment', () => {
    it('should convert simple dynamic segment [id]', () => {
      const result = convertDynamicSegment('[id]');

      expect(result.path).toBe('{id}');
      expect(result.param).toEqual({
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Path parameter: id',
      });
    });

    it('should convert catch-all segment [...slug]', () => {
      const result = convertDynamicSegment('[...slug]');

      expect(result.path).toBe('{slug}');
      expect(result.param).toEqual({
        name: 'slug',
        in: 'path',
        required: true,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
        description: 'Catch-all path parameter: slug',
      });
    });

    it('should convert optional catch-all segment [[...slug]]', () => {
      const result = convertDynamicSegment('[[...slug]]');

      expect(result.path).toBe('{slug}');
      expect(result.param).toEqual({
        name: 'slug',
        in: 'path',
        required: false,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
        description: 'Optional catch-all path parameter: slug',
      });
    });

    it('should return static segment as-is', () => {
      const result = convertDynamicSegment('users');

      expect(result.path).toBe('users');
      expect(result.param).toBeUndefined();
    });

    it('should handle multiple dynamic segment names', () => {
      const result1 = convertDynamicSegment('[userId]');
      const result2 = convertDynamicSegment('[postId]');

      expect(result1.path).toBe('{userId}');
      expect(result1.param?.name).toBe('userId');

      expect(result2.path).toBe('{postId}');
      expect(result2.param?.name).toBe('postId');
    });

    it('should handle catch-all with different names', () => {
      const result = convertDynamicSegment('[...segments]');

      expect(result.path).toBe('{segments}');
      expect(result.param?.name).toBe('segments');
      expect(result.param?.schema.type).toBe('array');
    });
  });

  describe('convertCatchAll', () => {
    it('should create catch-all parameter', () => {
      const result = convertCatchAll('slug');

      expect(result.path).toBe('{slug}');
      expect(result.param).toEqual({
        name: 'slug',
        in: 'path',
        required: true,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
        description: 'Catch-all path parameter: slug',
      });
    });
  });

  describe('convertOptionalCatchAll', () => {
    it('should create optional catch-all parameter', () => {
      const result = convertOptionalCatchAll('slug');

      expect(result.path).toBe('{slug}');
      expect(result.param).toEqual({
        name: 'slug',
        in: 'path',
        required: false,
        schema: {
          type: 'array',
          items: { type: 'string' },
        },
        description: 'Optional catch-all path parameter: slug',
      });
    });
  });

  describe('extractPathSegments', () => {
    describe('Pages Router', () => {
      it('should extract segments from simple path', () => {
        const segments = extractPathSegments('/project/pages/api/users.ts', 'pages');
        expect(segments).toEqual(['users']);
      });

      it('should extract segments from nested path', () => {
        const segments = extractPathSegments('/project/pages/api/users/posts.ts', 'pages');
        expect(segments).toEqual(['users', 'posts']);
      });

      it('should extract segments with dynamic parameter', () => {
        const segments = extractPathSegments('/project/pages/api/users/[id].ts', 'pages');
        expect(segments).toEqual(['users', '[id]']);
      });

      it('should handle index.ts by removing it', () => {
        const segments = extractPathSegments('/project/pages/api/users/index.ts', 'pages');
        expect(segments).toEqual(['users']);
      });

      it('should handle root index.ts', () => {
        const segments = extractPathSegments('/project/pages/api/index.ts', 'pages');
        expect(segments).toEqual([]);
      });

      it('should handle catch-all routes', () => {
        const segments = extractPathSegments('/project/pages/api/docs/[...slug].ts', 'pages');
        expect(segments).toEqual(['docs', '[...slug]']);
      });

      it('should handle optional catch-all routes', () => {
        const segments = extractPathSegments('/project/pages/api/[[...slug]].ts', 'pages');
        expect(segments).toEqual(['[[...slug]]']);
      });

      it('should handle multiple dynamic segments', () => {
        const segments = extractPathSegments('/project/pages/api/[org]/[repo]/issues.ts', 'pages');
        expect(segments).toEqual(['[org]', '[repo]', 'issues']);
      });

      it('should handle windows path separators', () => {
        const segments = extractPathSegments('C:\\project\\pages\\api\\users\\[id].ts', 'pages');
        expect(segments).toEqual(['users', '[id]']);
      });

      it('should handle different file extensions', () => {
        expect(extractPathSegments('/project/pages/api/users.js', 'pages')).toEqual(['users']);
        expect(extractPathSegments('/project/pages/api/users.tsx', 'pages')).toEqual(['users']);
        expect(extractPathSegments('/project/pages/api/users.jsx', 'pages')).toEqual(['users']);
      });
    });

    describe('App Router', () => {
      it('should extract segments from simple route', () => {
        const segments = extractPathSegments('/project/app/api/users/route.ts', 'app');
        expect(segments).toEqual(['users']);
      });

      it('should extract segments from nested route', () => {
        const segments = extractPathSegments('/project/app/api/users/posts/route.ts', 'app');
        expect(segments).toEqual(['users', 'posts']);
      });

      it('should extract segments with dynamic parameter', () => {
        const segments = extractPathSegments('/project/app/api/users/[id]/route.ts', 'app');
        expect(segments).toEqual(['users', '[id]']);
      });

      it('should handle root route', () => {
        const segments = extractPathSegments('/project/app/api/route.ts', 'app');
        expect(segments).toEqual([]);
      });

      it('should handle catch-all routes', () => {
        const segments = extractPathSegments('/project/app/api/docs/[...slug]/route.ts', 'app');
        expect(segments).toEqual(['docs', '[...slug]']);
      });

      it('should handle optional catch-all routes', () => {
        const segments = extractPathSegments('/project/app/api/[[...slug]]/route.ts', 'app');
        expect(segments).toEqual(['[[...slug]]']);
      });

      it('should handle different route file extensions', () => {
        expect(extractPathSegments('/project/app/api/users/route.js', 'app')).toEqual(['users']);
        expect(extractPathSegments('/project/app/api/users/route.tsx', 'app')).toEqual(['users']);
        expect(extractPathSegments('/project/app/api/users/route.jsx', 'app')).toEqual(['users']);
      });
    });

    describe('Edge cases', () => {
      it('should return empty array if no /api/ in path', () => {
        const segments = extractPathSegments('/project/pages/users.ts', 'pages');
        expect(segments).toEqual([]);
      });

      it('should handle paths with no segments after /api/', () => {
        const segments = extractPathSegments('/project/pages/api/', 'pages');
        expect(segments).toEqual([]);
      });

      it('should filter out empty segments', () => {
        const segments = extractPathSegments('/project/pages/api//users//[id].ts', 'pages');
        expect(segments).toEqual(['users', '[id]']);
      });
    });
  });

  describe('generateRouteParameters', () => {
    it('should generate parameters from dynamic segments', () => {
      const segments = ['users', '{id}', 'posts', '{postId}'];
      const params = generateRouteParameters(segments);

      expect(params).toHaveLength(2);
      expect(params[0]).toEqual({
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Path parameter: id',
      });
      expect(params[1]).toEqual({
        name: 'postId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Path parameter: postId',
      });
    });

    it('should return empty array for all static segments', () => {
      const segments = ['users', 'posts', 'latest'];
      const params = generateRouteParameters(segments);

      expect(params).toEqual([]);
    });

    it('should handle single dynamic segment', () => {
      const segments = ['users', '{id}'];
      const params = generateRouteParameters(segments);

      expect(params).toHaveLength(1);
      expect(params[0].name).toBe('id');
    });

    it('should avoid duplicate parameters', () => {
      const segments = ['users', '{id}', 'posts', '{id}']; // Duplicate {id}
      const params = generateRouteParameters(segments);

      expect(params).toHaveLength(1);
      expect(params[0].name).toBe('id');
    });

    it('should handle empty segments array', () => {
      const params = generateRouteParameters([]);
      expect(params).toEqual([]);
    });
  });

  describe('inferRoutePathFromFile', () => {
    describe('Pages Router', () => {
      it('should infer simple route', () => {
        const result = inferRoutePathFromFile('/project/pages/api/users.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/users');
        expect(result.parameters).toEqual([]);
        expect(result.routerType).toBe('pages');
        expect(result.error).toBeUndefined();
      });

      it('should infer route with dynamic parameter', () => {
        const result = inferRoutePathFromFile('/project/pages/api/users/[id].ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/users/{id}');
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe('id');
        expect(result.routerType).toBe('pages');
      });

      it('should infer route with multiple dynamic parameters', () => {
        const result = inferRoutePathFromFile('/project/pages/api/[org]/[repo]/issues.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/{org}/{repo}/issues');
        expect(result.parameters).toHaveLength(2);
        expect(result.parameters[0].name).toBe('org');
        expect(result.parameters[1].name).toBe('repo');
      });

      it('should infer catch-all route', () => {
        const result = inferRoutePathFromFile('/project/pages/api/docs/[...slug].ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/docs/{slug}');
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe('slug');
        expect(result.parameters[0].required).toBe(true);
        expect(result.parameters[0].schema.type).toBe('array');
      });

      it('should infer optional catch-all route', () => {
        const result = inferRoutePathFromFile('/project/pages/api/[[...slug]].ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/{slug}');
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe('slug');
        expect(result.parameters[0].required).toBe(false);
        expect(result.parameters[0].schema.type).toBe('array');
      });

      it('should infer index route', () => {
        const result = inferRoutePathFromFile('/project/pages/api/users/index.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/users');
        expect(result.parameters).toEqual([]);
      });

      it('should infer root API route', () => {
        const result = inferRoutePathFromFile('/project/pages/api/index.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api');
        expect(result.parameters).toEqual([]);
      });
    });

    describe('App Router', () => {
      it('should infer simple route', () => {
        const result = inferRoutePathFromFile('/project/app/api/users/route.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/users');
        expect(result.parameters).toEqual([]);
        expect(result.routerType).toBe('app');
      });

      it('should infer route with dynamic parameter', () => {
        const result = inferRoutePathFromFile('/project/app/api/users/[id]/route.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/users/{id}');
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe('id');
      });

      it('should infer route with multiple dynamic parameters', () => {
        const result = inferRoutePathFromFile('/project/app/api/[org]/[repo]/issues/route.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/{org}/{repo}/issues');
        expect(result.parameters).toHaveLength(2);
      });

      it('should infer catch-all route', () => {
        const result = inferRoutePathFromFile('/project/app/api/docs/[...slug]/route.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/docs/{slug}');
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].schema.type).toBe('array');
      });

      it('should infer root route', () => {
        const result = inferRoutePathFromFile('/project/app/api/route.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api');
        expect(result.parameters).toEqual([]);
      });

      it('should reject non-route files in App Router', () => {
        const result = inferRoutePathFromFile('/project/app/api/users/handler.ts');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('App Router routes must be named route.ts/js/tsx/jsx');
      });
    });

    describe('Error cases', () => {
      it('should reject non-API routes', () => {
        const result = inferRoutePathFromFile('/project/pages/users.ts');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Not an API route (must be in pages/api/ or app/api/)');
      });

      it('should reject files not in pages or app directories', () => {
        const result = inferRoutePathFromFile('/project/src/api/users.ts');

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Not an API route (must be in pages/api/ or app/api/)');
      });

      it('should handle windows paths', () => {
        const result = inferRoutePathFromFile('C:\\project\\pages\\api\\users\\[id].ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/users/{id}');
      });
    });

    describe('Integration scenarios', () => {
      it('should handle complex nested route with mixed segments', () => {
        const result = inferRoutePathFromFile('/project/pages/api/v1/[org]/repos/[repo]/issues/[id].ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/v1/{org}/repos/{repo}/issues/{id}');
        expect(result.parameters).toHaveLength(3);
        expect(result.parameters.map(p => p.name)).toEqual(['org', 'repo', 'id']);
      });

      it('should handle route with versioning and catch-all', () => {
        const result = inferRoutePathFromFile('/project/app/api/v2/docs/[...slug]/route.ts');

        expect(result.isValid).toBe(true);
        expect(result.routePath).toBe('/api/v2/docs/{slug}');
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].schema).toEqual({
          type: 'array',
          items: { type: 'string' },
        });
      });
    });
  });
});
