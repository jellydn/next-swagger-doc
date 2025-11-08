/**
 * Unit tests for merger module
 * Tests merging of auto-generated and explicit JSDoc route info
 */

import { describe, it, expect } from 'vitest';
import {
  mergeRouteInfo,
  mergeMultipleRoutes,
  validateMergedRoute,
  applyMergeStrategy,
  isSameEndpoint,
  groupRoutesByEndpoint,
  detectConflicts,
} from '../../src/auto-generate/merger';
import type { RouteInfo } from '../../src/auto-generate/types';

describe('merger', () => {
  const baseAutoGenRoute: RouteInfo = {
    filePath: '/project/pages/api/users.ts',
    routePath: '/api/users',
    method: 'GET',
    routerType: 'pages',
    handler: {
      exportType: 'default',
      functionName: 'handler',
      isAsync: false,
      sourceLocation: { line: 5, column: 0 },
      zodSchemas: [],
      typeAnnotations: [],
    },
    parameters: [],
    responses: {
      200: {
        description: 'Successful response',
      },
    },
  };

  describe('mergeRouteInfo', () => {
    it('should merge summary from explicit JSDoc', () => {
      const explicit: Partial<RouteInfo> = {
        summary: 'Get all users from database',
      };

      const merged = mergeRouteInfo(baseAutoGenRoute, explicit);

      expect(merged.summary).toBe('Get all users from database');
      expect(merged.routePath).toBe(baseAutoGenRoute.routePath);
      expect(merged.method).toBe(baseAutoGenRoute.method);
    });

    it('should merge description from explicit JSDoc', () => {
      const explicit: Partial<RouteInfo> = {
        description: 'Returns a paginated list of users with detailed information',
      };

      const merged = mergeRouteInfo(baseAutoGenRoute, explicit);

      expect(merged.description).toBe('Returns a paginated list of users with detailed information');
    });

    it('should merge tags from explicit JSDoc', () => {
      const autoGen: RouteInfo = {
        ...baseAutoGenRoute,
        tags: ['users'],
      };

      const explicit: Partial<RouteInfo> = {
        tags: ['users', 'authentication'],
      };

      const merged = mergeRouteInfo(autoGen, explicit);

      expect(merged.tags).toEqual(['users', 'authentication']);
    });

    it('should merge parameters, with explicit overriding by name', () => {
      const autoGen: RouteInfo = {
        ...baseAutoGenRoute,
        routePath: '/api/users/{id}',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
      };

      const explicit: Partial<RouteInfo> = {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', pattern: '^[0-9]+$' },
            description: 'Numeric user ID',
          },
        ],
      };

      const merged = mergeRouteInfo(autoGen, explicit);

      expect(merged.parameters).toHaveLength(1);
      expect(merged.parameters[0].description).toBe('Numeric user ID');
      expect(merged.parameters[0].schema).toEqual({ type: 'string', pattern: '^[0-9]+$' });
    });

    it('should add new explicit parameters', () => {
      const autoGen: RouteInfo = {
        ...baseAutoGenRoute,
        parameters: [],
      };

      const explicit: Partial<RouteInfo> = {
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'number' },
            description: 'Max results',
          },
        ],
      };

      const merged = mergeRouteInfo(autoGen, explicit);

      expect(merged.parameters).toHaveLength(1);
      expect(merged.parameters[0].name).toBe('limit');
    });

    it('should merge request body, with explicit completely overriding', () => {
      const autoGen: RouteInfo = {
        ...baseAutoGenRoute,
        method: 'POST',
        requestBody: {
          contentType: 'application/json',
          type: 'inline',
          inlineSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      };

      const explicit: Partial<RouteInfo> = {
        requestBody: {
          contentType: 'application/json',
          type: 'reference',
          schemaRef: '#/components/schemas/CreateUserRequest',
        },
      };

      const merged = mergeRouteInfo(autoGen, explicit);

      expect(merged.requestBody?.type).toBe('reference');
      expect(merged.requestBody?.schemaRef).toBe('#/components/schemas/CreateUserRequest');
    });

    it('should merge responses by status code', () => {
      const autoGen: RouteInfo = {
        ...baseAutoGenRoute,
        responses: {
          200: {
            description: 'Success',
          },
        },
      };

      const explicit: Partial<RouteInfo> = {
        responses: {
          200: {
            description: 'User retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: {
            description: 'User not found',
          },
        },
      };

      const merged = mergeRouteInfo(autoGen, explicit);

      expect(merged.responses[200].description).toBe('User retrieved successfully');
      expect(merged.responses[200].content).toBeDefined();
      expect(merged.responses[404]).toBeDefined();
    });

    it('should merge security from explicit JSDoc', () => {
      const explicit: Partial<RouteInfo> = {
        security: [{ bearerAuth: [] }],
      };

      const merged = mergeRouteInfo(baseAutoGenRoute, explicit);

      expect(merged.security).toEqual([{ bearerAuth: [] }]);
    });

    it('should mark route as deprecated from explicit JSDoc', () => {
      const explicit: Partial<RouteInfo> = {
        deprecated: true,
      };

      const merged = mergeRouteInfo(baseAutoGenRoute, explicit);

      expect(merged.deprecated).toBe(true);
    });
  });

  describe('mergeMultipleRoutes', () => {
    it('should merge three route definitions with last taking precedence', () => {
      const route1: Partial<RouteInfo> = {
        summary: 'Summary 1',
        description: 'Description 1',
      };

      const route2: Partial<RouteInfo> = {
        summary: 'Summary 2',
        tags: ['users'],
      };

      const route3: Partial<RouteInfo> = {
        description: 'Description 3',
      };

      const merged = mergeMultipleRoutes(
        { ...baseAutoGenRoute, ...route1 },
        route2,
        route3
      );

      expect(merged?.summary).toBe('Summary 2');
      expect(merged?.description).toBe('Description 3');
      expect(merged?.tags).toEqual(['users']);
    });

    it('should return null for empty array', () => {
      const merged = mergeMultipleRoutes();
      expect(merged).toBeNull();
    });

    it('should handle array with single route', () => {
      const merged = mergeMultipleRoutes(baseAutoGenRoute);
      expect(merged).toEqual(baseAutoGenRoute);
    });
  });

  describe('validateMergedRoute', () => {
    it('should validate a complete route', () => {
      const result = validateMergedRoute(baseAutoGenRoute);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing routePath', () => {
      const invalid = { ...baseAutoGenRoute, routePath: '' };
      const result = validateMergedRoute(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: routePath');
    });

    it('should detect missing method', () => {
      const invalid = { ...baseAutoGenRoute, method: '' as any };
      const result = validateMergedRoute(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: method');
    });

    it('should detect missing responses', () => {
      const invalid = { ...baseAutoGenRoute, responses: {} };
      const result = validateMergedRoute(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one response is required');
    });

    it('should detect undefined path parameters', () => {
      const invalid: RouteInfo = {
        ...baseAutoGenRoute,
        routePath: '/api/users/{id}',
        parameters: [], // Missing path parameter
      };

      const result = validateMergedRoute(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Path parameter {id}'))).toBe(true);
    });

    it('should detect duplicate parameters', () => {
      const invalid: RouteInfo = {
        ...baseAutoGenRoute,
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'id',
            in: 'query',
            required: false,
            schema: { type: 'number' },
          },
        ],
      };

      const result = validateMergedRoute(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate parameter'))).toBe(true);
    });

    it('should detect invalid status codes', () => {
      const invalid: RouteInfo = {
        ...baseAutoGenRoute,
        responses: {
          200: { description: 'OK' },
          999: { description: 'Invalid' }, // Invalid status code
        },
      };

      const result = validateMergedRoute(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid HTTP status code'))).toBe(true);
    });
  });

  describe('applyMergeStrategy', () => {
    const explicit: Partial<RouteInfo> = {
      summary: 'Explicit summary',
      description: 'Explicit description',
    };

    it('should apply explicit-wins strategy', () => {
      const merged = applyMergeStrategy(baseAutoGenRoute, explicit, 'explicit-wins');

      expect(merged.summary).toBe('Explicit summary');
      expect(merged.description).toBe('Explicit description');
      // Should keep auto-gen fields not in explicit
      expect(merged.filePath).toBe(baseAutoGenRoute.filePath);
    });

    it('should apply auto-gen-wins strategy', () => {
      const merged = applyMergeStrategy(baseAutoGenRoute, explicit, 'auto-gen-wins');

      expect(merged).toEqual(baseAutoGenRoute);
      expect(merged.summary).toBeUndefined();
    });

    it('should apply merge-deep strategy (default)', () => {
      const merged = applyMergeStrategy(baseAutoGenRoute, explicit, 'merge-deep');

      expect(merged.summary).toBe('Explicit summary');
      expect(merged.filePath).toBe(baseAutoGenRoute.filePath);
    });

    it('should handle null explicit route', () => {
      const merged = applyMergeStrategy(baseAutoGenRoute, null);

      expect(merged).toEqual(baseAutoGenRoute);
    });
  });

  describe('isSameEndpoint', () => {
    it('should return true for same path and method', () => {
      const route1 = { routePath: '/api/users', method: 'GET' as const };
      const route2 = { routePath: '/api/users', method: 'GET' as const };

      expect(isSameEndpoint(route1, route2)).toBe(true);
    });

    it('should return false for different paths', () => {
      const route1 = { routePath: '/api/users', method: 'GET' as const };
      const route2 = { routePath: '/api/posts', method: 'GET' as const };

      expect(isSameEndpoint(route1, route2)).toBe(false);
    });

    it('should return false for different methods', () => {
      const route1 = { routePath: '/api/users', method: 'GET' as const };
      const route2 = { routePath: '/api/users', method: 'POST' as const };

      expect(isSameEndpoint(route1, route2)).toBe(false);
    });
  });

  describe('groupRoutesByEndpoint', () => {
    it('should group routes by path and method', () => {
      const routes: RouteInfo[] = [
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'GET' },
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'POST' },
        { ...baseAutoGenRoute, routePath: '/api/posts', method: 'GET' },
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'GET' }, // Duplicate
      ];

      const groups = groupRoutesByEndpoint(routes);

      expect(groups.size).toBe(3);
      expect(groups.get('GET:/api/users')).toHaveLength(2);
      expect(groups.get('POST:/api/users')).toHaveLength(1);
      expect(groups.get('GET:/api/posts')).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const groups = groupRoutesByEndpoint([]);
      expect(groups.size).toBe(0);
    });
  });

  describe('detectConflicts', () => {
    it('should detect conflicts between auto-gen and explicit routes', () => {
      const autoGen: RouteInfo[] = [
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'GET' },
        { ...baseAutoGenRoute, routePath: '/api/posts', method: 'GET' },
      ];

      const explicit: RouteInfo[] = [
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'GET', summary: 'Explicit' },
      ];

      const conflicts = detectConflicts(autoGen, explicit);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].endpoint).toBe('GET /api/users');
      expect(conflicts[0].autoGen.summary).toBeUndefined();
      expect(conflicts[0].explicit.summary).toBe('Explicit');
    });

    it('should return empty array when no conflicts', () => {
      const autoGen: RouteInfo[] = [
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'GET' },
      ];

      const explicit: RouteInfo[] = [
        { ...baseAutoGenRoute, routePath: '/api/posts', method: 'GET' },
      ];

      const conflicts = detectConflicts(autoGen, explicit);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle multiple conflicts', () => {
      const autoGen: RouteInfo[] = [
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'GET' },
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'POST' },
        { ...baseAutoGenRoute, routePath: '/api/posts', method: 'GET' },
      ];

      const explicit: RouteInfo[] = [
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'GET' },
        { ...baseAutoGenRoute, routePath: '/api/users', method: 'POST' },
      ];

      const conflicts = detectConflicts(autoGen, explicit);

      expect(conflicts).toHaveLength(2);
    });
  });
});
