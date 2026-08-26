import { readFileSync } from 'node:fs';

import { type SwaggerOptions, createSwaggerSpec } from './swagger';

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
  createSwaggerSpec({ ...(parsed as SwaggerOptions), outputFile });
}
