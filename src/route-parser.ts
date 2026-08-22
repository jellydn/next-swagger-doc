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
export function getExportedMethods(
  source: string,
  sourceName?: string
): string[] {
  let exportSpecifiers: readonly ExportSpecifier[] = [];
  try {
    [, exportSpecifiers] = parse(source);
  } catch (error) {
    const location = sourceName ? ` (${sourceName})` : '';
    console.warn(
      `next-swagger-doc: failed to parse route source${location}, skipping file`,
      error
    );
    return [];
  }
  const exportedNames = new Set(exportSpecifiers.map(({ n }) => n));
  return HTTP_METHODS.filter((method) => exportedNames.has(method)).map(
    (method) => method.toLowerCase()
  );
}
