import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

import { type SwaggerOptions, createSwaggerSpec } from './swagger';

function resolveOutputPath(outputFile: string, cwd = process.cwd()): string {
  return isAbsolute(outputFile) ? outputFile : join(cwd, outputFile);
}

/** Generate a spec from a JSON config file and write it to `outputFile`. */
export function writeCliSpec(configFile: string, outputFile: string): void {
  const configRaw = readFileSync(configFile, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(configRaw);
  } catch {
    throw new Error(`Invalid JSON in config file ${configFile}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Config file must contain a JSON object');
  }
  const { outputFile: _ignored, ...swaggerOptions } =
    parsed as SwaggerOptions;
  const spec = createSwaggerSpec(swaggerOptions);
  const outputPath = resolveOutputPath(outputFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(spec, null, 2));
}
