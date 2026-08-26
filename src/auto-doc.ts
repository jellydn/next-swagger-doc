import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { HTTP_METHODS, getExportedMethods } from './route-parser';
import { routeToOpenApiPaths } from './route-path';
import {
  discoverSpecLocations,
  shouldScanBuildDirectory,
} from './spec-source';

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

/** Extract App Router API paths and exported HTTP methods from route files. */
export function extractApiInfo(
  apiFolder: string,
  cwd = process.cwd(),
  options?: { scanBuildOutput?: boolean; nextPhase?: string }
): ApiInfo[] {
  const { sourceDirs, buildDirs } = discoverSpecLocations([apiFolder], cwd);
  const directories: string[] = [];
  for (let index = 0; index < sourceDirs.length; index += 1) {
    const sourceDirectory = sourceDirs[index];
    if (!sourceDirectory) {
      continue;
    }
    if (existsSync(sourceDirectory)) {
      directories.push(sourceDirectory);
    }
    const buildDirectory = buildDirs[index];
    if (
      buildDirectory &&
      shouldScanBuildDirectory({
        sourceDirectory,
        buildDirectory,
        scanBuildOutput: options?.scanBuildOutput,
        nextPhase: options?.nextPhase,
      })
    ) {
      directories.push(buildDirectory);
    }
  }
  const apiInfos = new Map<string, Set<string>>();

  for (const apiDirectory of directories) {
    for (const file of getRouteFiles(apiDirectory)) {
      const routeSegments = relative(apiDirectory, file)
        .split(sep)
        .slice(0, -1);
      const methods = getExportedMethods(readFileSync(file, 'utf8'), file);
      for (const path of routeToOpenApiPaths(apiFolder, routeSegments)) {
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
