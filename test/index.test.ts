import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  createSwaggerSpec,
  extractApiInfo,
  isAutoDocEnabled,
  shouldScanBuildDirectory,
} from '../src';

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
      { path: '/api/regex', methods: ['get'] },
      { path: '/api/users/{id}', methods: ['patch', 'delete'] },
      { path: '/blog', methods: ['get'] },
      { path: '/blog/{slug}', methods: ['get'] },
      { path: '/commented', methods: ['get'] },
      { path: '/users', methods: ['get', 'post'] },
    ]);
  });

  it('detects handlers despite regex literals containing comment-like sequences', () => {
    expect(extractApiInfo('test/fixtures/app/api/regex')).toEqual([
      { path: '/api/regex', methods: ['get'] },
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
      { path: '/api/regex', methods: ['get'] },
      { path: '/api/users/{id}', methods: ['patch', 'delete'] },
    ]);
  });

  it('ignores a missing App Router directory', () => {
    expect(extractApiInfo('test/fixtures/missing')).toEqual([]);
  });
});

describe('shouldScanBuildDirectory', () => {
  it('skips missing build directories', () => {
    const root = mkdtempSync(join(tmpdir(), 'swagger-scan-'));
    try {
      expect(
        shouldScanBuildDirectory({
          sourceDirectory: join(root, 'app/api'),
          buildDirectory: join(root, '.next/server/app/api'),
        })
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('skips .next during Next.js production builds', () => {
    const root = mkdtempSync(join(tmpdir(), 'swagger-scan-'));
    try {
      mkdirSync(join(root, 'app/api'), { recursive: true });
      mkdirSync(join(root, '.next/server/app/api'), { recursive: true });
      expect(
        shouldScanBuildDirectory({
          sourceDirectory: join(root, 'app/api'),
          buildDirectory: join(root, '.next/server/app/api'),
          nextPhase: 'phase-production-build',
        })
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('scans compiled output when the source folder is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'swagger-scan-'));
    try {
      mkdirSync(join(root, '.next/server/app/api'), { recursive: true });
      expect(
        shouldScanBuildDirectory({
          sourceDirectory: join(root, 'app/api'),
          buildDirectory: join(root, '.next/server/app/api'),
        })
      ).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('honors an explicit scanBuildOutput flag', () => {
    const root = mkdtempSync(join(tmpdir(), 'swagger-scan-'));
    try {
      mkdirSync(join(root, 'app/api'), { recursive: true });
      mkdirSync(join(root, '.next/server/app/api'), { recursive: true });
      expect(
        shouldScanBuildDirectory({
          sourceDirectory: join(root, 'app/api'),
          buildDirectory: join(root, '.next/server/app/api'),
          scanBuildOutput: true,
          nextPhase: 'phase-production-build',
        })
      ).toBe(true);
      expect(
        shouldScanBuildDirectory({
          sourceDirectory: join(root, 'missing'),
          buildDirectory: join(root, '.next/server/app/api'),
          scanBuildOutput: false,
        })
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('isAutoDocEnabled', () => {
  it('keeps autoDoc off when source files exist', () => {
    expect(isAutoDocEnabled(undefined, false)).toBe(false);
    expect(isAutoDocEnabled(false, true)).toBe(false);
  });

  it('falls back to autoDoc when the source folder is missing', () => {
    expect(isAutoDocEnabled(undefined, true)).toBe(true);
    expect(isAutoDocEnabled(true, false)).toBe(true);
    expect(isAutoDocEnabled({ enabled: true }, false)).toBe(true);
  });
});

describe('standalone spec files', () => {
  it('returns a prebuilt specFile without scanning routes', () => {
    const root = mkdtempSync(join(tmpdir(), 'swagger-spec-'));
    const specFile = join(root, 'swagger.json');
    try {
      writeFileSync(
        specFile,
        JSON.stringify({
          openapi: '3.0.0',
          info: { title: 'Standalone', version: '1.0.0' },
          paths: {
            '/api/hello': {
              get: { responses: { 200: { description: 'ok' } } },
            },
          },
        })
      );
      const spec = createSwaggerSpec({
        specFile,
        apiFolder: join(root, 'missing-api'),
        definition: {
          openapi: '3.0.0',
          info: { title: 'Ignored', version: '0' },
        },
      });
      expect(spec.info.title).toBe('Standalone');
      expect(spec.paths?.['/api/hello']).toBeDefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('writes the generated spec to outputFile', () => {
    const root = mkdtempSync(join(tmpdir(), 'swagger-out-'));
    const outputFile = join(root, 'public/swagger.json');
    try {
      const spec = createSwaggerSpec({
        apiFolder: 'test/fixtures/app/api',
        autoDoc: true,
        outputFile,
        definition: {
          openapi: '3.0.0',
          info: { title: 'Written', version: '1.0.0' },
        },
      });
      const saved = JSON.parse(readFileSync(outputFile, 'utf8')) as {
        info: { title: string };
      };
      expect(saved.info.title).toBe('Written');
      expect(spec.info.title).toBe('Written');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
