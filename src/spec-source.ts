import { join } from 'node:path';

export type SpecLocations = {
  sourceDirs: string[];
  buildDirs: string[];
  publicDir: string;
};

/**
 * Discover where route documentation can live for a set of folders.
 *
 * Owns the Next.js build-output layout (`.next/server/<folder>`) and the
 * public static-docs directory, so consumers don't re-derive them.
 */
export function discoverSpecLocations(
  folders: string[],
  cwd = process.cwd()
): SpecLocations {
  return {
    sourceDirs: folders.map((folder) => join(cwd, folder)),
    buildDirs: folders.map((folder) => join(cwd, '.next/server', folder)),
    publicDir: join(cwd, 'public'),
  };
}
