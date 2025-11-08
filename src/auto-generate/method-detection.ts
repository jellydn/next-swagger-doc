/**
 * Method detection module - detects HTTP methods from Next.js route exports
 * @module auto-generate/method-detection
 */

import { readFileSync } from 'node:fs';
import ts from 'typescript';
import type {
  HandlerInfo,
  HttpMethod,
  HttpMethodInfo,
  MethodDetectionResult,
} from './types';

/**
 * Valid HTTP method names for App Router
 */
const VALID_HTTP_METHODS = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'HEAD',
]);

/**
 * Detects HTTP methods from exported functions in a Next.js route file
 *
 * @param filePath - Absolute path to route file
 * @returns MethodDetectionResult with detected methods and handler info
 *
 * @example
 * ```typescript
 * // App Router with multiple methods
 * detectHttpMethods('/project/app/api/users/route.ts')
 * // → { methods: [{ method: 'GET', ... }, { method: 'POST', ... }], routerType: 'app' }
 *
 * // Pages Router with default export
 * detectHttpMethods('/project/pages/api/users.ts')
 * // → { methods: [{ method: 'GET', ... }], routerType: 'pages' }
 * ```
 */
export function detectHttpMethods(filePath: string): MethodDetectionResult {
  // Determine router type from file path
  const normalizedPath = filePath.replace(/\\/g, '/');
  let routerType: 'pages' | 'app';

  if (normalizedPath.includes('/pages/api/')) {
    routerType = 'pages';
  } else if (normalizedPath.includes('/app/api/')) {
    routerType = 'app';
  } else {
    // Not a valid API route, return empty result
    return {
      methods: [],
      routerType: 'pages',
      parseError: 'Not an API route file',
    };
  }

  // Check for middleware files (should be skipped)
  if (
    normalizedPath.includes('middleware.ts') ||
    normalizedPath.includes('_middleware.ts')
  ) {
    return {
      methods: [],
      routerType,
      parseError: 'Middleware files are not API routes',
    };
  }

  try {
    // Read and parse the file
    const sourceCode = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const methods: HttpMethodInfo[] = [];

    if (routerType === 'app') {
      // App Router: Look for named exports (GET, POST, etc.)
      methods.push(...detectAppRouterMethods(sourceFile));
    } else {
      // Pages Router: Look for default export
      methods.push(...detectPagesRouterMethods(sourceFile));
    }

    return {
      methods,
      routerType,
    };
  } catch (error) {
    return {
      methods: [],
      routerType,
      parseError: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Detects HTTP methods from App Router named exports
 *
 * @param sourceFile - TypeScript source file AST
 * @returns Array of detected HTTP method handlers
 */
function detectAppRouterMethods(sourceFile: ts.SourceFile): HttpMethodInfo[] {
  const methods: HttpMethodInfo[] = [];

  // Visit all statements in the file
  for (const statement of sourceFile.statements) {
    // Check for exported function declarations
    if (ts.isFunctionDeclaration(statement)) {
      const methodInfo = extractAppRouterMethod(statement, sourceFile);
      if (methodInfo) {
        methods.push(methodInfo);
      }
    }

    // Check for exported variable declarations (const GET = async () => {})
    if (ts.isVariableStatement(statement)) {
      const methodInfo = extractAppRouterMethodFromVariable(
        statement,
        sourceFile
      );
      if (methodInfo) {
        methods.push(methodInfo);
      }
    }
  }

  return methods;
}

/**
 * Extracts HTTP method from exported function declaration
 *
 * @param node - Function declaration node
 * @param sourceFile - Source file for position info
 * @returns HttpMethodInfo if valid method export, undefined otherwise
 */
function extractAppRouterMethod(
  node: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile
): HttpMethodInfo | undefined {
  // Must have export modifier
  const hasExport = node.modifiers?.some(
    (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
  );
  if (!hasExport) {
    return undefined;
  }

  // Must have a name
  if (!node.name) {
    return undefined;
  }

  const methodName = node.name.text;

  // Must be a valid HTTP method
  if (!VALID_HTTP_METHODS.has(methodName as HttpMethod)) {
    return undefined;
  }

  const handler = extractHandlerInfo(node, methodName, sourceFile);
  const jsdoc = extractJSDocSummary(node);

  return {
    method: methodName as HttpMethod,
    handler,
    hasJSDoc: jsdoc !== undefined,
    jsdocSummary: jsdoc,
  };
}

/**
 * Extracts HTTP method from exported variable declaration
 * Handles: export const GET = async () => {}
 *
 * @param node - Variable statement node
 * @param sourceFile - Source file for position info
 * @returns HttpMethodInfo if valid method export, undefined otherwise
 */
function extractAppRouterMethodFromVariable(
  node: ts.VariableStatement,
  sourceFile: ts.SourceFile
): HttpMethodInfo | undefined {
  // Must have export modifier
  const hasExport = node.modifiers?.some(
    (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
  );
  if (!hasExport) {
    return undefined;
  }

  // Get the variable declaration
  const declaration = node.declarationList.declarations[0];
  if (!declaration || !ts.isIdentifier(declaration.name)) {
    return undefined;
  }

  const methodName = declaration.name.text;

  // Must be a valid HTTP method
  if (!VALID_HTTP_METHODS.has(methodName as HttpMethod)) {
    return undefined;
  }

  // Extract handler info from the initializer (arrow function or function expression)
  if (!declaration.initializer) {
    return undefined;
  }

  const handler = extractHandlerInfoFromExpression(
    declaration.initializer,
    methodName,
    sourceFile
  );
  const jsdoc = extractJSDocSummary(node);

  return {
    method: methodName as HttpMethod,
    handler,
    hasJSDoc: jsdoc !== undefined,
    jsdocSummary: jsdoc,
  };
}

/**
 * Detects HTTP methods from Pages Router default export
 *
 * @param sourceFile - TypeScript source file AST
 * @returns Array of detected HTTP method handlers (usually just one)
 */
function detectPagesRouterMethods(sourceFile: ts.SourceFile): HttpMethodInfo[] {
  const methods: HttpMethodInfo[] = [];

  // Find default export
  for (const statement of sourceFile.statements) {
    // export default function handler() {}
    if (ts.isFunctionDeclaration(statement)) {
      const isDefault = statement.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.DefaultKeyword
      );
      if (isDefault) {
        const handler = extractHandlerInfo(statement, 'handler', sourceFile);
        const jsdoc = extractJSDocSummary(statement);

        // Default to GET for Pages Router unless JSDoc specifies otherwise
        const method = extractMethodFromJSDoc(jsdoc) || 'GET';

        methods.push({
          method,
          handler,
          hasJSDoc: jsdoc !== undefined,
          jsdocSummary: jsdoc,
        });
        break;
      }
    }

    // export default () => {}
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const handler = extractHandlerInfoFromExpression(
        statement.expression,
        'handler',
        sourceFile
      );
      const jsdoc = extractJSDocSummary(statement);
      const method = extractMethodFromJSDoc(jsdoc) || 'GET';

      methods.push({
        method,
        handler,
        hasJSDoc: jsdoc !== undefined,
        jsdocSummary: jsdoc,
      });
      break;
    }
  }

  return methods;
}

/**
 * Extracts handler information from a function declaration
 *
 * @param node - Function declaration node
 * @param functionName - Name of the function
 * @param sourceFile - Source file for position info
 * @returns HandlerInfo object
 */
function extractHandlerInfo(
  node: ts.FunctionDeclaration,
  functionName: string,
  sourceFile: ts.SourceFile
): HandlerInfo {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart()
  );

  return {
    exportType: node.modifiers?.some(
      (mod) => mod.kind === ts.SyntaxKind.DefaultKeyword
    )
      ? 'default'
      : 'named',
    functionName,
    isAsync:
      node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.AsyncKeyword) ??
      false,
    sourceLocation: {
      line: line + 1, // Convert to 1-indexed
      column: character,
    },
    zodSchemas: [], // Will be populated by schema-extractor
    typeAnnotations: [], // Will be populated by schema-extractor
  };
}

/**
 * Extracts handler information from a function expression (arrow or regular)
 *
 * @param node - Function expression or arrow function
 * @param functionName - Name of the function
 * @param sourceFile - Source file for position info
 * @returns HandlerInfo object
 */
function extractHandlerInfoFromExpression(
  node: ts.Expression,
  functionName: string,
  sourceFile: ts.SourceFile
): HandlerInfo {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart()
  );

  let isAsync = false;

  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    isAsync =
      node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.AsyncKeyword) ??
      false;
  }

  return {
    exportType: 'named',
    functionName,
    isAsync,
    sourceLocation: {
      line: line + 1,
      column: character,
    },
    zodSchemas: [],
    typeAnnotations: [],
  };
}

/**
 * Extracts JSDoc comment summary from a node
 *
 * @param node - AST node to extract JSDoc from
 * @returns Summary text if JSDoc present, undefined otherwise
 */
function extractJSDocSummary(node: ts.Node): string | undefined {
  // Use the more reliable ts.JSDoc API
  const jsDocs = (node as any).jsDoc as ts.JSDoc[] | undefined;

  if (!jsDocs || jsDocs.length === 0) {
    return undefined;
  }

  // Get the first JSDoc comment
  const firstJsDoc = jsDocs[0];
  if (firstJsDoc.comment) {
    // Extract comment text
    if (typeof firstJsDoc.comment === 'string') {
      return firstJsDoc.comment.trim();
    }
    // Handle JSDocText nodes (array of comment parts)
    if (Array.isArray(firstJsDoc.comment)) {
      return firstJsDoc.comment
        .map((part: any) => (typeof part === 'string' ? part : part.text))
        .join('')
        .trim();
    }
  }

  return undefined;
}

/**
 * Attempts to extract HTTP method from JSDoc tags
 * Looks for @method tag or @swagger tag with method specification
 *
 * @param jsdoc - JSDoc summary text
 * @returns HTTP method if found in JSDoc, undefined otherwise
 */
function extractMethodFromJSDoc(
  jsdoc: string | undefined
): HttpMethod | undefined {
  if (!jsdoc) {
    return undefined;
  }

  // Look for @method GET or similar
  const methodMatch =
    /@method\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/i.exec(jsdoc);
  if (methodMatch) {
    return methodMatch[1].toUpperCase() as HttpMethod;
  }

  // Look for @swagger with method specification
  const swaggerMatch =
    /@swagger.*\n.*\s+(get|post|put|delete|patch|options|head):/i.exec(jsdoc);
  if (swaggerMatch) {
    return swaggerMatch[1].toUpperCase() as HttpMethod;
  }

  return undefined;
}

/**
 * Checks if a file is a valid API route file based on path and naming
 *
 * @param filePath - File path to check
 * @returns true if valid API route, false otherwise
 */
export function isValidApiRoute(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Must be in api folder
  if (!normalizedPath.includes('/api/')) {
    return false;
  }

  // Must be in pages or app directory
  if (
    !normalizedPath.includes('/pages/api/') &&
    !normalizedPath.includes('/app/api/')
  ) {
    return false;
  }

  // Exclude middleware files
  if (
    normalizedPath.includes('middleware.ts') ||
    normalizedPath.includes('_middleware.ts')
  ) {
    return false;
  }

  // For App Router, must be route.* file
  if (normalizedPath.includes('/app/api/')) {
    return /\/route\.(ts|tsx|js|jsx)$/.test(normalizedPath);
  }

  // For Pages Router, exclude certain patterns
  if (normalizedPath.includes('/pages/api/')) {
    // Exclude _app, _document, etc.
    if (/\/_[^/]+\.(ts|tsx|js|jsx)$/.test(normalizedPath)) {
      return false;
    }
    return /\.(ts|tsx|js|jsx)$/.test(normalizedPath);
  }

  return false;
}
