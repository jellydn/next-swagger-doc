import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { HTTP_METHODS, getExportedMethods } from './route-parser';

export type ApiInfo = {
  path: string;
  methods: string[];
};

function isRouteFile(name: string): boolean {
  return ['ts', 'tsx', 'js', 'jsx', 'mts', 'mtsx', 'mjs', 'mjsx'].includes(
    name.startsWith('route.') ? name.slice('route.'.length) : ''
  );
}

function getRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return getRouteFiles(path);
    }
    return entry.isFile() && isRouteFile(entry.name) ? [path] : [];
  });
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

function toOpenApiSegment(segment: string): string {
  if (segment.startsWith('[[...') && segment.endsWith(']]')) {
    return `{${segment.slice(5, -2)}}`;
  }
  if (segment.startsWith('[...') && segment.endsWith(']')) {
    return `{${segment.slice(4, -1)}}`;
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return `{${segment.slice(1, -1)}}`;
  }
  return segment;
}

function toOpenApiPaths(segments: string[]): string[] {
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

  return paths.map((path) => `/${path.map(toOpenApiSegment).join('/')}`);
}

/** Extract App Router API paths and exported HTTP methods from route files. */
export function extractApiInfo(
  apiFolder: string,
  cwd = process.cwd()
): ApiInfo[] {
  const directories = [
    join(cwd, apiFolder),
    join(cwd, '.next/server', apiFolder),
  ].filter(existsSync);
  const apiInfos = new Map<string, Set<string>>();

  for (const apiDirectory of directories) {
    for (const file of getRouteFiles(apiDirectory)) {
      const routeSegments = relative(apiDirectory, file)
        .split(sep)
        .slice(0, -1);
      const methods = getExportedMethods(readFileSync(file, 'utf8'));
      for (const path of toOpenApiPaths([
        ...getApiSegments(apiFolder),
        ...routeSegments,
      ])) {
        const pathMethods = apiInfos.get(path) ?? new Set<string>();
        methods.forEach((method) => pathMethods.add(method));
        apiInfos.set(path, pathMethods);
      }
    }
  }

  return Array.from(apiInfos.entries())
    .sort(([firstPath], [secondPath]) => firstPath.localeCompare(secondPath))
    .map(([path, methods]) => ({
      path,
      methods: HTTP_METHODS.filter((method) =>
        methods.has(method.toLowerCase())
      ).map((method) => method.toLowerCase()),
    }))
    .filter((api) => api.methods.length > 0);
}

export function generateAutoDoc(apiInfos: ApiInfo[]) {
  return Object.fromEntries(
    apiInfos.map(({ path, methods }) => [
      path,
      {
        ...Object.fromEntries(
          methods.map((method) => [
            method,
            {
              summary: `${method.toUpperCase()} ${path}`,
              parameters: getPathParameters(path),
              responses: {
                200: { description: 'Successful response' },
              },
            },
          ])
        ),
      },
    ])
  );
}

function getPathParameters(path: string) {
  const parameters = [];
  const parameterPattern = /\{(.+?)}/g;
  let match = parameterPattern.exec(path);

  while (match) {
    parameters.push({
      name: match[1],
      in: 'path' as const,
      required: true,
      schema: { type: 'string' },
    });
    match = parameterPattern.exec(path);
  }

  return parameters;
}
