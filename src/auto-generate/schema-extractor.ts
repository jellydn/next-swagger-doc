/**
 * Schema extractor - orchestrates schema extraction from handlers
 * Coordinates Zod and TypeScript schema conversion
 * @module auto-generate/schema-extractor
 */

import ts from 'typescript';
import { readFileSync } from 'node:fs';
import type {
  HandlerInfo,
  SchemaInfo,
  ExtractedSchemas,
  ZodSchemaReference,
  TypeReference,
} from './types';
import { convertZodToOpenAPI, isZodSchema } from './zod-converter';
import { convertTypeScriptToOpenAPI, extractReturnTypeSchema } from './ts-converter';

/**
 * Extracts schemas from a route handler
 * Analyzes the handler function to find request/response schemas
 *
 * @param filePath - Path to the route file
 * @param handler - Handler info from method detection
 * @returns Extracted schema information
 *
 * @example
 * ```typescript
 * const schemas = await extractSchemas(
 *   '/project/app/api/users/route.ts',
 *   handlerInfo
 * );
 * // → { requestBody: {...}, responses: {...} }
 * ```
 */
export async function extractSchemas(
  filePath: string,
  handler: HandlerInfo
): Promise<ExtractedSchemas> {
  try {
    // Read and parse the file
    const sourceCode = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    // Create a program for type checking
    const program = ts.createProgram([filePath], {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ESNext,
      noEmit: true,
    });

    // Find the handler function in the AST
    const handlerNode = findHandlerNode(sourceFile, handler.functionName);

    if (!handlerNode) {
      return { hasSchemas: false };
    }

    // Extract schemas from the handler
    const requestBody = await extractRequestBodySchema(handlerNode, sourceFile, program);
    const responseSchemas = await extractResponseSchemas(handlerNode, sourceFile, program);

    return {
      hasSchemas: !!requestBody || Object.keys(responseSchemas).length > 0,
      requestBody,
      responses: responseSchemas,
    };
  } catch (error) {
    console.warn(`Failed to extract schemas from ${filePath}:`, error);
    return { hasSchemas: false };
  }
}

/**
 * Finds the handler function node in the source file
 */
function findHandlerNode(
  sourceFile: ts.SourceFile,
  functionName: string
): ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | undefined {
  for (const statement of sourceFile.statements) {
    // Function declaration: export function GET() {}
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === functionName) {
      return statement;
    }

    // Variable declaration: export const GET = () => {}
    if (ts.isVariableStatement(statement)) {
      const declaration = statement.declarationList.declarations[0];
      if (
        declaration &&
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === functionName &&
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))
      ) {
        return declaration.initializer;
      }
    }

    // Default export
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      if (ts.isFunctionExpression(statement.expression) || ts.isArrowFunction(statement.expression)) {
        return statement.expression;
      }
    }
  }

  return undefined;
}

/**
 * Extracts request body schema from handler
 * Looks for request.json(), Zod parsing, or type annotations
 */
async function extractRequestBodySchema(
  handlerNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  sourceFile: ts.SourceFile,
  program: ts.Program
): Promise<SchemaInfo | undefined> {
  // Get the request parameter
  const requestParam = handlerNode.parameters[0];
  if (!requestParam) {
    return undefined;
  }

  // Check for type annotation on request parameter
  if (requestParam.type) {
    // Look for generic type like Request<BodyType>
    if (ts.isTypeReferenceNode(requestParam.type)) {
      const typeName = requestParam.type.typeName.getText();
      if ((typeName === 'Request' || typeName === 'NextApiRequest') && requestParam.type.typeArguments) {
        const bodyType = requestParam.type.typeArguments[0];
        const schema = convertTypeScriptToOpenAPI(
          { typeNode: bodyType, isExported: false },
          program
        );

        return {
          contentType: 'application/json',
          ...schema,
        };
      }
    }
  }

  // Look for Zod schema usage in the function body
  const zodSchemas = findZodSchemasInNode(handlerNode, sourceFile);
  if (zodSchemas.length > 0) {
    // Use the first Zod schema found as request body
    const schema = await convertZodToOpenAPI(zodSchemas[0]);
    return {
      contentType: 'application/json',
      ...schema,
    };
  }

  return undefined;
}

/**
 * Extracts response schemas from handler
 * Analyzes return statements and Response.json() calls
 */
async function extractResponseSchemas(
  handlerNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  sourceFile: ts.SourceFile,
  program: ts.Program
): Promise<Record<number, SchemaInfo>> {
  const responses: Record<number, SchemaInfo> = {};

  // Check for explicit return type annotation
  const returnTypeSchema = extractReturnTypeSchema(handlerNode, program);

  if (returnTypeSchema) {
    // Default to 200 for successful responses
    responses[200] = {
      contentType: 'application/json',
      ...returnTypeSchema,
    };
  }

  // Analyze return statements in the function body
  const returnStatements = findReturnStatements(handlerNode);

  for (const returnStmt of returnStatements) {
    if (!returnStmt.expression) continue;

    // Check for Response.json(data) or res.json(data)
    const responseInfo = analyzeResponseExpression(returnStmt.expression, program);
    if (responseInfo) {
      const statusCode = responseInfo.statusCode || 200;
      responses[statusCode] = responseInfo.schema;
    }
  }

  return responses;
}

/**
 * Finds all return statements in a function
 */
function findReturnStatements(node: ts.Node): ts.ReturnStatement[] {
  const returns: ts.ReturnStatement[] = [];

  function visit(n: ts.Node) {
    if (ts.isReturnStatement(n)) {
      returns.push(n);
    }
    // Don't recurse into nested functions
    if (
      !ts.isFunctionDeclaration(n) &&
      !ts.isFunctionExpression(n) &&
      !ts.isArrowFunction(n)
    ) {
      ts.forEachChild(n, visit);
    }
  }

  visit(node);
  return returns;
}

/**
 * Analyzes a response expression to extract schema and status code
 */
function analyzeResponseExpression(
  expr: ts.Expression,
  program: ts.Program
): { statusCode?: number; schema: SchemaInfo } | undefined {
  // Response.json(data) or Response.json(data, { status: 201 })
  if (ts.isCallExpression(expr)) {
    const expression = expr.expression;

    // Check for Response.json() or res.json()
    if (ts.isPropertyAccessExpression(expression) && expression.name.text === 'json') {
      const dataArg = expr.arguments[0];
      const optionsArg = expr.arguments[1];

      let statusCode: number | undefined = 200;

      // Extract status code from options
      if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
        for (const prop of optionsArg.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            ts.isIdentifier(prop.name) &&
            prop.name.text === 'status' &&
            ts.isNumericLiteral(prop.initializer)
          ) {
            statusCode = parseInt(prop.initializer.text, 10);
          }
        }
      }

      // Extract schema from data argument
      if (dataArg) {
        const schema = extractSchemaFromExpression(dataArg, program);
        return {
          statusCode,
          schema: {
            contentType: 'application/json',
            ...schema,
          },
        };
      }
    }

    // res.status(200).json(data)
    if (
      ts.isCallExpression(expression) &&
      ts.isPropertyAccessExpression(expression.expression) &&
      expression.expression.name.text === 'status'
    ) {
      const statusArg = expression.arguments[0];
      const statusCode = statusArg && ts.isNumericLiteral(statusArg)
        ? parseInt(statusArg.text, 10)
        : 200;

      const dataArg = expr.arguments[0];
      if (dataArg) {
        const schema = extractSchemaFromExpression(dataArg, program);
        return {
          statusCode,
          schema: {
            contentType: 'application/json',
            ...schema,
          },
        };
      }
    }
  }

  return undefined;
}

/**
 * Extracts schema from an expression (object literal, variable, etc.)
 */
function extractSchemaFromExpression(expr: ts.Expression, program: ts.Program): Partial<SchemaInfo> {
  // Object literal: { users: [] }
  if (ts.isObjectLiteralExpression(expr)) {
    return inferSchemaFromObjectLiteral(expr, program);
  }

  // Array literal: [1, 2, 3]
  if (ts.isArrayLiteralExpression(expr)) {
    return {
      type: 'inline',
      inlineSchema: {
        type: 'array',
        items: { type: 'object' }, // Generic items
      },
    };
  }

  // Variable reference - would need symbol resolution
  if (ts.isIdentifier(expr)) {
    return {
      type: 'inline',
      inlineSchema: { type: 'object' },
    };
  }

  return {
    type: 'inline',
    inlineSchema: { type: 'object' },
  };
}

/**
 * Infers OpenAPI schema from object literal expression
 */
function inferSchemaFromObjectLiteral(
  objLiteral: ts.ObjectLiteralExpression,
  program: ts.Program
): Partial<SchemaInfo> {
  const properties: Record<string, any> = {};

  for (const prop of objLiteral.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const propName = prop.name.text;
      const propValue = prop.initializer;

      // Infer type from initializer
      if (ts.isStringLiteral(propValue)) {
        properties[propName] = { type: 'string' };
      } else if (ts.isNumericLiteral(propValue)) {
        properties[propName] = { type: 'number' };
      } else if (
        propValue.kind === ts.SyntaxKind.TrueKeyword ||
        propValue.kind === ts.SyntaxKind.FalseKeyword
      ) {
        properties[propName] = { type: 'boolean' };
      } else if (ts.isObjectLiteralExpression(propValue)) {
        const nested = inferSchemaFromObjectLiteral(propValue, program);
        properties[propName] = nested.inlineSchema || { type: 'object' };
      } else if (ts.isArrayLiteralExpression(propValue)) {
        properties[propName] = { type: 'array', items: { type: 'object' } };
      } else {
        properties[propName] = { type: 'object' };
      }
    }
  }

  return {
    type: 'inline',
    inlineSchema: {
      type: 'object',
      properties,
    },
  };
}

/**
 * Finds Zod schema references in a node
 */
function findZodSchemasInNode(node: ts.Node, sourceFile: ts.SourceFile): ZodSchemaReference[] {
  const schemas: ZodSchemaReference[] = [];

  function visit(n: ts.Node) {
    // Look for .parse() or .safeParse() calls
    if (ts.isCallExpression(n)) {
      const expression = n.expression;
      if (
        ts.isPropertyAccessExpression(expression) &&
        (expression.name.text === 'parse' || expression.name.text === 'safeParse')
      ) {
        // Get the schema object (left side of .parse())
        const schemaExpr = expression.expression;
        if (ts.isIdentifier(schemaExpr)) {
          schemas.push({
            schemaName: schemaExpr.text,
            isRegistered: false,
          });
        }
      }
    }

    ts.forEachChild(n, visit);
  }

  visit(node);
  return schemas;
}

/**
 * Checks if a file imports Zod
 */
export function fileImportsZod(sourceFile: ts.SourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === 'zod') {
        return true;
      }
    }
  }
  return false;
}
