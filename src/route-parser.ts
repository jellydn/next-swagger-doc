import { initSync, parse, type ExportSpecifier } from 'es-module-lexer';

export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

// es-module-lexer needs its WASM engine ready before parse() can run.
initSync();

/**
 * Extract the exported HTTP method handler names from a route module's source.
 *
 * Uses es-module-lexer instead of hand-rolled string matching, so comments,
 * strings, and regex literals are handled correctly without sanitisation.
 */
export function getExportedMethods(source: string): string[] {
  let exports: readonly ExportSpecifier[] = [];
  try {
    [, exports] = parse(source);
  } catch (error) {
    console.warn(
      'next-swagger-doc: failed to parse route source, skipping file',
      error
    );
    return [];
  }
  const methods = new Set<string>();
  for (const { n } of exports) {
    if (HTTP_METHODS.includes(n as (typeof HTTP_METHODS)[number])) {
      methods.add(n);
    }
  }
  return HTTP_METHODS.filter((method) => methods.has(method)).map((method) =>
    method.toLowerCase()
  );
}
