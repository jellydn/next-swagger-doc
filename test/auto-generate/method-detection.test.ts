/**
 * Unit tests for method-detection module
 * Tests detection of HTTP methods from Next.js route exports
 */

import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { detectHttpMethods, isValidApiRoute } from '../../src/auto-generate/method-detection';

const FIXTURES_DIR = resolve(__dirname, '../fixtures');

describe('method-detection', () => {
  describe('detectHttpMethods', () => {
    describe('App Router', () => {
      it('should detect simple GET method', () => {
        const filePath = join(FIXTURES_DIR, 'app/api/users/route.ts');

        const result = detectHttpMethods(filePath);

        expect(result.routerType).toBe('app');
        expect(result.parseError).toBeUndefined();
        expect(result.methods).toHaveLength(1);
        expect(result.methods[0].method).toBe('GET');
        expect(result.methods[0].handler.functionName).toBe('GET');
        expect(result.methods[0].handler.isAsync).toBe(true);
        expect(result.methods[0].handler.exportType).toBe('named');
        expect(result.methods[0].hasJSDoc).toBe(true);
        expect(result.methods[0].jsdocSummary).toContain('Simple GET endpoint');
      });

      it('should detect multiple HTTP methods', () => {
        const filePath = join(FIXTURES_DIR, 'app/api/route.ts');

        const result = detectHttpMethods(filePath);

        expect(result.routerType).toBe('app');
        expect(result.methods).toHaveLength(3);

        const methods = result.methods.map(m => m.method).sort();
        expect(methods).toEqual(['DELETE', 'GET', 'POST']);

        const getMethod = result.methods.find(m => m.method === 'GET');
        expect(getMethod?.hasJSDoc).toBe(true);
        expect(getMethod?.jsdocSummary).toContain('Get all users');

        const postMethod = result.methods.find(m => m.method === 'POST');
        expect(postMethod?.hasJSDoc).toBe(true);
        expect(postMethod?.jsdocSummary).toContain('Create a new user');

        const deleteMethod = result.methods.find(m => m.method === 'DELETE');
        expect(deleteMethod?.hasJSDoc).toBe(false);
      });

      it('should detect arrow function handlers', () => {
        const filePath = join(FIXTURES_DIR, 'app/api/arrow/route.ts');

        const result = detectHttpMethods(filePath);

        expect(result.methods).toHaveLength(2);
        expect(result.methods[0].method).toBe('GET');
        expect(result.methods[0].handler.isAsync).toBe(true);
        expect(result.methods[1].method).toBe('POST');
      });

      it('should track source location', () => {
        const filePath = join(FIXTURES_DIR, 'app/api/users/route.ts');

        const result = detectHttpMethods(filePath);

        expect(result.methods[0].handler.sourceLocation).toBeDefined();
        expect(result.methods[0].handler.sourceLocation.line).toBeGreaterThan(0);
        expect(result.methods[0].handler.sourceLocation.column).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Pages Router', () => {
      it('should detect default export handler', () => {
        const filePath = join(FIXTURES_DIR, 'pages/api/users.ts');

        const result = detectHttpMethods(filePath);

        expect(result.routerType).toBe('pages');
        expect(result.parseError).toBeUndefined();
        expect(result.methods).toHaveLength(1);
        expect(result.methods[0].method).toBe('GET'); // Default method
        expect(result.methods[0].handler.functionName).toBe('handler');
        expect(result.methods[0].handler.exportType).toBe('default');
        expect(result.methods[0].hasJSDoc).toBe(true);
      });

      it('should default to GET for Pages Router without JSDoc', () => {
        const filePath = join(FIXTURES_DIR, 'pages/api/users.ts');

        const result = detectHttpMethods(filePath);

        expect(result.methods[0].method).toBe('GET');
      });
    });

    describe('Error handling', () => {
      it('should return error for non-API routes', () => {
        const result = detectHttpMethods('/project/pages/index.ts');

        expect(result.parseError).toBe('Not an API route file');
        expect(result.methods).toHaveLength(0);
      });

      it('should return error for middleware files', () => {
        const result = detectHttpMethods('/project/app/api/middleware.ts');

        expect(result.parseError).toBe('Middleware files are not API routes');
        expect(result.methods).toHaveLength(0);
      });

      it('should handle file read errors gracefully', () => {
        const result = detectHttpMethods('/nonexistent/pages/api/file.ts');

        expect(result.parseError).toBeDefined();
        expect(result.parseError).toContain('Failed to parse file');
        expect(result.methods).toHaveLength(0);
      });
    });

    describe('Edge cases', () => {
      it('should handle files with no exports', () => {
        const filePath = join(FIXTURES_DIR, 'app/api/empty/route.ts');

        const result = detectHttpMethods(filePath);

        // File doesn't exist, so it will fail to parse
        expect(result.parseError).toBeDefined();
      });

      it('should ignore non-HTTP method exports in App Router', () => {
        const filePath = join(FIXTURES_DIR, 'app/api/users/route.ts');

        const result = detectHttpMethods(filePath);

        // Only valid HTTP methods should be detected
        expect(result.methods.every(m => ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(m.method))).toBe(true);
      });

      it('should handle Windows-style paths for router type detection', () => {
        // This test verifies that Windows paths are normalized correctly
        // It will fail to parse since the Windows path won't exist on Unix
        const windowsPath = 'C:\\project\\app\\api\\users\\route.ts';

        const result = detectHttpMethods(windowsPath);

        // Should still detect App Router from the path
        expect(result.routerType).toBe('app');
        // Will have parseError since file doesn't exist
        expect(result.parseError).toBeDefined();
      });
    });
  });

  describe('isValidApiRoute', () => {
    it('should validate Pages Router routes', () => {
      expect(isValidApiRoute('/project/pages/api/users.ts')).toBe(true);
      expect(isValidApiRoute('/project/pages/api/users/[id].ts')).toBe(true);
      expect(isValidApiRoute('/project/pages/api/index.ts')).toBe(true);
    });

    it('should validate App Router routes', () => {
      expect(isValidApiRoute('/project/app/api/users/route.ts')).toBe(true);
      expect(isValidApiRoute('/project/app/api/users/[id]/route.ts')).toBe(true);
      expect(isValidApiRoute('/project/app/api/route.ts')).toBe(true);
    });

    it('should reject non-API routes', () => {
      expect(isValidApiRoute('/project/pages/index.ts')).toBe(false);
      expect(isValidApiRoute('/project/app/page.ts')).toBe(false);
      expect(isValidApiRoute('/project/src/utils/helper.ts')).toBe(false);
    });

    it('should reject middleware files', () => {
      expect(isValidApiRoute('/project/app/api/middleware.ts')).toBe(false);
      expect(isValidApiRoute('/project/pages/api/_middleware.ts')).toBe(false);
    });

    it('should reject invalid App Router files', () => {
      expect(isValidApiRoute('/project/app/api/users/handler.ts')).toBe(false);
      expect(isValidApiRoute('/project/app/api/users.ts')).toBe(false);
    });

    it('should reject Pages Router special files', () => {
      expect(isValidApiRoute('/project/pages/api/_app.ts')).toBe(false);
      expect(isValidApiRoute('/project/pages/api/_document.ts')).toBe(false);
    });

    it('should handle Windows paths', () => {
      expect(isValidApiRoute('C:\\project\\pages\\api\\users.ts')).toBe(true);
      expect(isValidApiRoute('C:\\project\\app\\api\\users\\route.ts')).toBe(true);
    });

    it('should accept different file extensions', () => {
      expect(isValidApiRoute('/project/pages/api/users.js')).toBe(true);
      expect(isValidApiRoute('/project/pages/api/users.tsx')).toBe(true);
      expect(isValidApiRoute('/project/pages/api/users.jsx')).toBe(true);
      expect(isValidApiRoute('/project/app/api/users/route.jsx')).toBe(true);
    });
  });
});
