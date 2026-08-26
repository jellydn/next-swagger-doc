import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type SpecLocations = {
  sourceDirs: string[];
  buildDirs: string[];
  publicDir: string;
};

/** Next.js phases that rewrite `.next` and must not be scanned. */
const NEXT_BUILD_PHASES = new Set([
  'phase-production-build',
  'phase-production-compile',
  'phase-export',
]);

/**
 * Whether compiled files under `.next/server` should be scanned.
 *
 * Globbing `.next` while Next.js is compiling can fail Vercel builds with
 * `ENOENT: .../.next/export-detail.json`. Prefer source files; scan compiled
 * output only as a runtime fallback when the source folder is gone.
 */
export function shouldScanBuildDirectory({
  sourceDirectory,
  buildDirectory,
  scanBuildOutput,
  nextPhase = process.env.NEXT_PHASE,
}: {
  sourceDirectory: string;
  buildDirectory: string;
  scanBuildOutput?: boolean;
  nextPhase?: string;
}): boolean {
  if (!existsSync(buildDirectory) || scanBuildOutput === false) {
    return false;
  }
  if (scanBuildOutput === true) {
    return true;
  }
  if (nextPhase && NEXT_BUILD_PHASES.has(nextPhase)) {
    return false;
  }
  return !existsSync(sourceDirectory);
}

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
