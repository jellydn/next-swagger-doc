/**
 * TypeScript schema converter - converts TypeScript types to OpenAPI schemas
 * Uses TypeScript Compiler API for type analysis
 * @module auto-generate/ts-converter
 */

import ts from 'typescript';
import type { SchemaDefinition, TypeReference } from './types';

/**
 * Converts a TypeScript type reference to OpenAPI schema definition
 *
 * @param typeRef - TypeScript type reference from AST analysis
 * @param program - TypeScript compiler program for type checking
 * @returns OpenAPI schema definition
 *
 * @example
 * ```typescript
 * const typeRef = {
 *   typeName: 'User',
 *   sourceFile: '/path/to/types.ts',
 *   isExported: true
 * };
 *
 * const schema = convertTypeScriptToOpenAPI(typeRef, program);
 * ```
 */
export function convertTypeScriptToOpenAPI(
  typeRef: TypeReference,
  program: ts.Program
): SchemaDefinition {
  // If we have an inline type node, convert it directly
  if (typeRef.typeNode) {
    return convertTypeNodeToOpenAPI(typeRef.typeNode, program);
  }

  // If we have a type name, try to resolve it
  if (typeRef.typeName) {
    // For now, return a reference
    // TODO: Implement type resolution from source files
    return {
      type: 'reference',
      ref: `#/components/schemas/${typeRef.typeName}`,
    };
  }

  // Default to unknown object
  return {
    type: 'inline',
    schema: {
      type: 'object',
      description: 'Unknown type',
    },
  };
}

/**
 * Converts a TypeScript type node to OpenAPI schema
 *
 * @param typeNode - TypeScript type node from AST
 * @param program - TypeScript compiler program
 * @returns OpenAPI schema definition
 */
export function convertTypeNodeToOpenAPI(
  typeNode: ts.TypeNode,
  program: ts.Program
): SchemaDefinition {
  const schema = typeNodeToOpenAPISchema(typeNode, program);

  return {
    type: 'inline',
    schema,
  };
}

/**
 * Internal conversion from TypeNode to OpenAPI schema object
 */
function typeNodeToOpenAPISchema(
  typeNode: ts.TypeNode,
  program: ts.Program
): any {
  // Handle primitive types
  if (ts.isToken(typeNode)) {
    switch (typeNode.kind) {
      case ts.SyntaxKind.StringKeyword:
        return { type: 'string' };
      case ts.SyntaxKind.NumberKeyword:
        return { type: 'number' };
      case ts.SyntaxKind.BooleanKeyword:
        return { type: 'boolean' };
      case ts.SyntaxKind.AnyKeyword:
      case ts.SyntaxKind.UnknownKeyword:
        return {};
      case ts.SyntaxKind.NullKeyword:
        return { type: 'null' };
      case ts.SyntaxKind.VoidKeyword:
      case ts.SyntaxKind.UndefinedKeyword:
        return { type: 'null' };
    }
  }

  // Handle array types
  if (ts.isArrayTypeNode(typeNode)) {
    return {
      type: 'array',
      items: typeNodeToOpenAPISchema(typeNode.elementType, program),
    };
  }

  // Handle tuple types
  if (ts.isTupleTypeNode(typeNode)) {
    return {
      type: 'array',
      items: {
        oneOf: typeNode.elements.map((el) =>
          typeNodeToOpenAPISchema(el, program)
        ),
      },
    };
  }

  // Handle literal types
  if (ts.isLiteralTypeNode(typeNode)) {
    const literal = typeNode.literal;
    if (ts.isStringLiteral(literal)) {
      return { type: 'string', enum: [literal.text] };
    }
    if (ts.isNumericLiteral(literal)) {
      return { type: 'number', enum: [Number(literal.text)] };
    }
    if (
      literal.kind === ts.SyntaxKind.TrueKeyword ||
      literal.kind === ts.SyntaxKind.FalseKeyword
    ) {
      return {
        type: 'boolean',
        enum: [literal.kind === ts.SyntaxKind.TrueKeyword],
      };
    }
  }

  // Handle union types
  if (ts.isUnionTypeNode(typeNode)) {
    const types = typeNode.types.map((t) =>
      typeNodeToOpenAPISchema(t, program)
    );

    // Check if it's a nullable type (Type | null | undefined)
    const nonNullTypes = types.filter((t) => t.type !== 'null');
    if (nonNullTypes.length === 1 && types.length > nonNullTypes.length) {
      return { ...nonNullTypes[0], nullable: true };
    }

    return { oneOf: types };
  }

  // Handle intersection types
  if (ts.isIntersectionTypeNode(typeNode)) {
    const types = typeNode.types.map((t) =>
      typeNodeToOpenAPISchema(t, program)
    );
    return { allOf: types };
  }

  // Handle type references (e.g., User, Response<T>)
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText();

    // Handle built-in types
    if (typeName === 'Promise') {
      // Unwrap Promise<T> to T
      if (typeNode.typeArguments && typeNode.typeArguments.length > 0) {
        return typeNodeToOpenAPISchema(typeNode.typeArguments[0], program);
      }
      return { type: 'object' };
    }

    if (typeName === 'Date') {
      return { type: 'string', format: 'date-time' };
    }

    if (
      typeName === 'Record' &&
      typeNode.typeArguments &&
      typeNode.typeArguments.length === 2
    ) {
      return {
        type: 'object',
        additionalProperties: typeNodeToOpenAPISchema(
          typeNode.typeArguments[1],
          program
        ),
      };
    }

    if (
      typeName === 'Partial' &&
      typeNode.typeArguments &&
      typeNode.typeArguments.length === 1
    ) {
      const innerSchema = typeNodeToOpenAPISchema(
        typeNode.typeArguments[0],
        program
      );
      // Mark all properties as optional
      if (innerSchema.properties) {
        const _required = innerSchema.required || [];
        return {
          ...innerSchema,
          required: [],
        };
      }
      return innerSchema;
    }

    if (typeName === 'Pick' || typeName === 'Omit') {
      // For Pick/Omit, we'd need to resolve the base type
      // For now, return a reference
      return { $ref: `#/components/schemas/${typeName}` };
    }

    // For custom types, return a reference
    return { $ref: `#/components/schemas/${typeName}` };
  }

  // Handle type literals (object types)
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeLiteralToOpenAPISchema(typeNode, program);
  }

  // Handle parenthesized types
  if (ts.isParenthesizedTypeNode(typeNode)) {
    return typeNodeToOpenAPISchema(typeNode.type, program);
  }

  // Default to object
  return { type: 'object' };
}

/**
 * Converts a type literal to OpenAPI schema
 * Handles object types like { name: string; age: number }
 */
function typeLiteralToOpenAPISchema(
  typeNode: ts.TypeLiteralNode,
  program: ts.Program
): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const member of typeNode.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const propertyName = member.name.getText();
      const isOptional = !!member.questionToken;

      if (member.type) {
        properties[propertyName] = typeNodeToOpenAPISchema(
          member.type,
          program
        );

        // Extract JSDoc description if available
        const jsDocComment = getJSDocDescription(member);
        if (jsDocComment) {
          properties[propertyName].description = jsDocComment;
        }

        if (!isOptional) {
          required.push(propertyName);
        }
      }
    }

    // Handle index signatures [key: string]: Type
    if (ts.isIndexSignatureDeclaration(member)) {
      const valueType = member.type
        ? typeNodeToOpenAPISchema(member.type, program)
        : { type: 'object' };
      return {
        type: 'object',
        additionalProperties: valueType,
      };
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 && { required }),
  };
}

/**
 * Extracts JSDoc description from a node
 */
function getJSDocDescription(node: ts.Node): string | undefined {
  const jsDocs = (node as any).jsDoc as ts.JSDoc[] | undefined;

  if (!jsDocs || jsDocs.length === 0) {
    return undefined;
  }

  const firstJsDoc = jsDocs[0];
  if (firstJsDoc.comment) {
    if (typeof firstJsDoc.comment === 'string') {
      return firstJsDoc.comment.trim();
    }
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
 * Extracts type information from a function's return type
 *
 * @param functionDeclaration - Function declaration node
 * @param program - TypeScript program
 * @returns OpenAPI schema definition for return type
 */
export function extractReturnTypeSchema(
  functionDeclaration:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression,
  program: ts.Program
): SchemaDefinition | undefined {
  // Get explicit return type annotation
  if (functionDeclaration.type) {
    return convertTypeNodeToOpenAPI(functionDeclaration.type, program);
  }

  // Try to infer from return statements
  // This is more complex and requires type checker
  try {
    const typeChecker = program.getTypeChecker();
    const signature = typeChecker.getSignatureFromDeclaration(
      functionDeclaration as any
    );

    if (signature) {
      const returnType = typeChecker.getReturnTypeOfSignature(signature);
      return typeToOpenAPISchema(returnType, typeChecker);
    }
  } catch (_error) {
    // Type checking failed, return undefined
    // This can happen with arrow functions or functions without proper context
  }

  return undefined;
}

/**
 * Converts a TypeScript Type to OpenAPI schema using type checker
 */
function typeToOpenAPISchema(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): SchemaDefinition {
  // Handle primitive types
  if (type.flags & ts.TypeFlags.String) {
    return { type: 'inline', schema: { type: 'string' } };
  }
  if (type.flags & ts.TypeFlags.Number) {
    return { type: 'inline', schema: { type: 'number' } };
  }
  if (type.flags & ts.TypeFlags.Boolean) {
    return { type: 'inline', schema: { type: 'boolean' } };
  }
  if (
    type.flags & ts.TypeFlags.Null ||
    type.flags & ts.TypeFlags.Undefined ||
    type.flags & ts.TypeFlags.Void
  ) {
    return { type: 'inline', schema: { type: 'null' } };
  }

  // Handle object types
  if (type.flags & ts.TypeFlags.Object) {
    const objectType = type as ts.ObjectType;

    // Check if it's an array
    if (typeChecker.isArrayType(objectType)) {
      const typeArgs = typeChecker.getTypeArguments(
        objectType as ts.TypeReference
      );
      if (typeArgs.length > 0) {
        const itemSchema = typeToOpenAPISchema(typeArgs[0], typeChecker);
        return {
          type: 'inline',
          schema: {
            type: 'array',
            items: itemSchema.schema,
          },
        };
      }
    }

    // For other objects, extract properties
    const properties: Record<string, any> = {};
    const required: string[] = [];

    const props = typeChecker.getPropertiesOfType(type);
    for (const prop of props) {
      const propType = typeChecker.getTypeOfSymbolAtLocation(
        prop,
        prop.valueDeclaration!
      );
      const propSchema = typeToOpenAPISchema(propType, typeChecker);

      properties[prop.name] = propSchema.schema;

      // Check if optional
      const isOptional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
      if (!isOptional) {
        required.push(prop.name);
      }
    }

    return {
      type: 'inline',
      schema: {
        type: 'object',
        properties,
        ...(required.length > 0 && { required }),
      },
    };
  }

  // Default to object
  return { type: 'inline', schema: { type: 'object' } };
}

/**
 * Checks if a TypeScript type is a Response type (Next.js Response or standard Response)
 */
export function isResponseType(
  type: ts.Type,
  _typeChecker: ts.TypeChecker
): boolean {
  const symbol = type.getSymbol();
  if (!symbol) {
    return false;
  }

  const name = symbol.getName();
  return (
    name === 'Response' || name === 'NextResponse' || name === 'NextApiResponse'
  );
}

/**
 * Extracts the generic type argument from Response<T>
 */
export function extractResponseBodyType(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): ts.Type | undefined {
  if (typeChecker.isArrayType(type as ts.ObjectType)) {
    return undefined;
  }

  const typeArgs = typeChecker.getTypeArguments(type as ts.TypeReference);
  if (typeArgs.length > 0) {
    return typeArgs[0];
  }

  return undefined;
}
