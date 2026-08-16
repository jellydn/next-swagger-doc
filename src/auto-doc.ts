import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

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

function sanitizeSource(source: string): string {
  let code = '';
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    const nextCharacter = source[index + 1];
    if (character === '/' && nextCharacter === '/') {
      index = source.indexOf('\n', index);
      if (index === -1) {
        break;
      }
      code += '\n';
    } else if (character === '/' && nextCharacter === '*') {
      const commentEnd = source.indexOf('*/', index + 2);
      index = commentEnd === -1 ? source.length : commentEnd + 1;
    } else if (character === "'" || character === '"' || character === '`') {
      const quote = character;
      index += 1;
      while (index < source.length && source[index] !== quote) {
        index += source[index] === '\\' ? 2 : 1;
      }
    } else {
      code += character;
    }
    index += 1;
  }

  return code;
}

function getExportedMethods(source: string): string[] {
  const code = sanitizeSource(source);
  const normalizedCode = Array.from(code)
    .map((character) => (character <= ' ' ? ' ' : character))
    .join('')
    .split(' ')
    .filter(Boolean)
    .join(' ');
  const methods = new Set<string>();
  const methodPattern = HTTP_METHODS.join('|');
  const directExportPattern = new RegExp(
    `\bexport\s+(?:async\s+)?(?:function|const|let|var)\s+(${methodPattern})\b`,
    'g'
  );
  const specifierExportPattern = /\bexport\s*{([^}]*)}/g;

  let match = directExportPattern.exec(code);
  while (match) {
    methods.add(match[1] ?? '');
    match = directExportPattern.exec(code);
  }
  for (const method of HTTP_METHODS) {
    if (
      [
        `export function ${method}`,
        `export async function ${method}`,
        `export const ${method}`,
        `export let ${method}`,
        `export var ${method}`,
      ].some((declaration) => normalizedCode.includes(declaration))
    ) {
      methods.add(method);
    }
  }
  match = specifierExportPattern.exec(code);
  while (match) {
    for (const specifier of match[1].split(',')) {
      const exportedName = specifier
        .trim()
        .split(/\s+as\s+/)
        .at(-1);
      if (
        exportedName &&
        HTTP_METHODS.includes(exportedName as (typeof HTTP_METHODS)[number])
      ) {
        methods.add(exportedName);
      }
    }
    match = specifierExportPattern.exec(code);
  }

  let exportStart = code.indexOf('export {');
  while (exportStart !== -1) {
    const specifiersStart = exportStart + 'export {'.length;
    const specifiersEnd = code.indexOf('}', specifiersStart);
    if (specifiersEnd === -1) {
      break;
    }
    for (const specifier of code
      .slice(specifiersStart, specifiersEnd)
      .split(',')) {
      const exportedName = specifier.trim().split(' as ').at(-1);
      if (
        exportedName &&
        HTTP_METHODS.includes(exportedName as (typeof HTTP_METHODS)[number])
      ) {
        methods.add(exportedName);
      }
    }
    exportStart = code.indexOf('export {', specifiersEnd);
  }

  return HTTP_METHODS.filter((method) => methods.has(method)).map((method) =>
    method.toLowerCase()
  );
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
