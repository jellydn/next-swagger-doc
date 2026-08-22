/**
 * Translate a Next.js route directory into OpenAPI paths.
 *
 * Owns all Next.js folder conventions in one place: the app/pages root,
 * route groups `(…)`, parallel routes `@…`, dynamic segments `[id]`,
 * catch-alls `[...slug]`, and optional catch-alls `[[...slug]]`.
 */
export function routeToOpenApiPaths(
  apiFolder: string,
  routeSegments: string[]
): string[] {
  const segments = [...getApiSegments(apiFolder), ...routeSegments];
  const isOptionalCatchAll = (segment: string) =>
    segment.startsWith('[[...') && segment.endsWith(']]');
  const pathSegments = segments.filter(
    (segment) =>
      !(segment.startsWith('(') && segment.endsWith(')')) &&
      !segment.startsWith('@')
  );
  const optionalCatchAllIndex = pathSegments.findIndex(isOptionalCatchAll);
  const paths = (
    optionalCatchAllIndex === -1
      ? [pathSegments]
      : [
          pathSegments.filter((_, index) => index !== optionalCatchAllIndex),
          pathSegments,
        ]
  ).map((path) =>
    path.map((segment) =>
      segment
        .replace(/^\[\[\.\.\.(.+?)\]\]$/, '{$1}')
        .replace(/^\[\.\.\.(.+?)\]$/, '{$1}')
        .replace(/^\[(.+)\]$/, '{$1}')
    )
  );

  return paths.map((path) => `/${path.join('/')}`);
}

function getApiSegments(apiFolder: string): string[] {
  const normalizedFolder = apiFolder.split(/[\\/]/).filter(Boolean);
  const appIndex = normalizedFolder.lastIndexOf('app');
  const pagesIndex = normalizedFolder.lastIndexOf('pages');
  const routeRootIndex = Math.max(appIndex, pagesIndex);

  return routeRootIndex === -1
    ? [normalizedFolder.at(-1) ?? 'api']
    : normalizedFolder.slice(routeRootIndex + 1);
}
