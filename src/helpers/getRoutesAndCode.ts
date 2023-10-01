import { sync } from 'glob';
import fs from 'fs';
import { join, sep } from 'path';

export function getRoutesAndCode(rootDir: string): Record<string, string> {
  const routes: Record<string, string> = {};

  const files = sync('**/*.{js,ts}', { cwd: rootDir });

  for (const filePath of files) {
    const route = filePath
      .replace(/\.[jt]s$/, '')
      .split(sep)
      .join('/');
    const resolvedPath = join(rootDir, filePath);
    const code = fs.readFileSync(resolvedPath, 'utf-8');
    routes[route] = code;
  }

  return routes;
}
