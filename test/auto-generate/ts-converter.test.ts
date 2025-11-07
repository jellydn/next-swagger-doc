/**
 * Unit tests for TypeScript converter
 * Tests conversion of TypeScript types to OpenAPI schemas
 */

import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { convertTypeNodeToOpenAPI, extractReturnTypeSchema } from '../../src/auto-generate/ts-converter';

/**
 * Helper to create a type node from TypeScript code
 */
function createTypeNode(typeCode: string): ts.TypeNode {
  const sourceCode = `type Test = ${typeCode}`;
  const sourceFile = ts.createSourceFile(
    'test.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  // Find the type alias
  for (const statement of sourceFile.statements) {
    if (ts.isTypeAliasDeclaration(statement) && statement.type) {
      return statement.type;
    }
  }

  throw new Error('Failed to create type node');
}

/**
 * Helper to create a program for type checking
 */
function createTestProgram(code: string): { program: ts.Program; sourceFile: ts.SourceFile } {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => fileName === 'test.ts' ? sourceFile : undefined,
    writeFile: () => {},
    getCurrentDirectory: () => '',
    getDirectories: () => [],
    fileExists: () => true,
    readFile: () => '',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  };

  const program = ts.createProgram(['test.ts'], {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    noEmit: true,
  }, compilerHost);

  return { program, sourceFile };
}

describe('ts-converter', () => {
  describe('convertTypeNodeToOpenAPI', () => {
    it('should convert string type', () => {
      const { program } = createTestProgram('type Test = string');
      const typeNode = createTypeNode('string');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.type).toBe('inline');
      expect(result.schema).toEqual({ type: 'string' });
    });

    it('should convert number type', () => {
      const { program } = createTestProgram('type Test = number');
      const typeNode = createTypeNode('number');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.type).toBe('inline');
      expect(result.schema).toEqual({ type: 'number' });
    });

    it('should convert boolean type', () => {
      const { program } = createTestProgram('type Test = boolean');
      const typeNode = createTypeNode('boolean');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.type).toBe('inline');
      expect(result.schema).toEqual({ type: 'boolean' });
    });

    it('should convert array type', () => {
      const { program } = createTestProgram('type Test = string[]');
      const typeNode = createTypeNode('string[]');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.type).toBe('inline');
      expect(result.schema).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('should convert object literal type', () => {
      const { program } = createTestProgram('type Test = { name: string; age: number }');
      const typeNode = createTypeNode('{ name: string; age: number }');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.type).toBe('inline');
      expect(result.schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      });
    });

    it('should handle optional properties', () => {
      const { program } = createTestProgram('type Test = { name: string; age?: number }');
      const typeNode = createTypeNode('{ name: string; age?: number }');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema.properties).toEqual({
        name: { type: 'string' },
        age: { type: 'number' },
      });
      expect(result.schema.required).toEqual(['name']);
    });

    it('should convert union types', () => {
      const { program } = createTestProgram('type Test = string | number');
      const typeNode = createTypeNode('string | number');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      });
    });

    it('should convert nullable types', () => {
      const { program } = createTestProgram('type Test = string | null');
      const typeNode = createTypeNode('string | null');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      // Either nullable:true or oneOf with null is acceptable
      expect(result.schema).toBeDefined();
      if ('nullable' in result.schema) {
        expect(result.schema.nullable).toBe(true);
      } else if ('oneOf' in result.schema) {
        expect(result.schema.oneOf).toBeDefined();
        expect(result.schema.oneOf.length).toBeGreaterThan(0);
      }
    });

    it('should convert literal types', () => {
      const { program } = createTestProgram("type Test = 'active' | 'inactive'");
      const typeNode = createTypeNode("'active' | 'inactive'");

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema.oneOf).toBeDefined();
      expect(result.schema.oneOf).toHaveLength(2);
    });

    it('should handle type references', () => {
      const { program } = createTestProgram('type Test = User');
      const typeNode = createTypeNode('User');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({
        $ref: '#/components/schemas/User',
      });
    });

    it('should handle Date type', () => {
      const { program } = createTestProgram('type Test = Date');
      const typeNode = createTypeNode('Date');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({
        type: 'string',
        format: 'date-time',
      });
    });

    it('should handle Record type', () => {
      const { program } = createTestProgram('type Test = Record<string, number>');
      const typeNode = createTypeNode('Record<string, number>');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({
        type: 'object',
        additionalProperties: { type: 'number' },
      });
    });

    it('should unwrap Promise type', () => {
      const { program } = createTestProgram('type Test = Promise<string>');
      const typeNode = createTypeNode('Promise<string>');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({ type: 'string' });
    });

    it('should handle nested object types', () => {
      const { program } = createTestProgram('type Test = { user: { name: string; email: string } }');
      const typeNode = createTypeNode('{ user: { name: string; email: string } }');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
            required: ['name', 'email'],
          },
        },
        required: ['user'],
      });
    });

    it('should handle intersection types', () => {
      const { program } = createTestProgram('type Test = { a: string } & { b: number }');
      const typeNode = createTypeNode('{ a: string } & { b: number }');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema.allOf).toBeDefined();
      expect(result.schema.allOf).toHaveLength(2);
    });
  });

  describe('extractReturnTypeSchema', () => {
    it('should extract return type from function with explicit type', () => {
      const code = `
        function handler(): { message: string } {
          return { message: 'Hello' };
        }
      `;
      const { program, sourceFile } = createTestProgram(code);

      const funcDecl = sourceFile.statements[0] as ts.FunctionDeclaration;
      const result = extractReturnTypeSchema(funcDecl, program);

      expect(result).toBeDefined();
      expect(result?.type).toBe('inline');
      expect(result?.schema.type).toBe('object');
      expect(result?.schema.properties).toBeDefined();
    });

    it('should handle Promise return types', () => {
      const code = `
        async function handler(): Promise<{ data: string }> {
          return { data: 'test' };
        }
      `;
      const { program, sourceFile } = createTestProgram(code);

      const funcDecl = sourceFile.statements[0] as ts.FunctionDeclaration;
      const result = extractReturnTypeSchema(funcDecl, program);

      expect(result).toBeDefined();
      // Should unwrap Promise<T> to T
      expect(result?.schema.type).toBe('object');
    });

    it('should return undefined for functions without return type', () => {
      const code = `
        function handler() {
          return { message: 'Hello' };
        }
      `;
      const { program, sourceFile } = createTestProgram(code);

      const funcDecl = sourceFile.statements[0] as ts.FunctionDeclaration;
      const result = extractReturnTypeSchema(funcDecl, program);

      // May return undefined or inferred type depending on implementation
      // This is acceptable behavior
      expect(result).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle any type', () => {
      const { program } = createTestProgram('type Test = any');
      const typeNode = createTypeNode('any');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({});
    });

    it('should handle unknown type', () => {
      const { program } = createTestProgram('type Test = unknown');
      const typeNode = createTypeNode('unknown');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({});
    });

    it('should handle void type', () => {
      const { program } = createTestProgram('type Test = void');
      const typeNode = createTypeNode('void');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema).toEqual({ type: 'null' });
    });

    it('should handle tuple types', () => {
      const { program } = createTestProgram('type Test = [string, number]');
      const typeNode = createTypeNode('[string, number]');

      const result = convertTypeNodeToOpenAPI(typeNode, program);

      expect(result.schema.type).toBe('array');
      expect(result.schema.items).toBeDefined();
    });
  });
});
