import { cli } from 'cleye';
import { readFileSync, writeFileSync } from 'fs';

import { createSwaggerSpec } from './swagger';

// Parse argv
const argv = cli({
  name: 'next-swagger-doc-cli',

  // Define parameters
  // Becomes available in ._.filePath
  parameters: [
    '<config file>', // next swagger config file is required
  ],

  // Define flags/options
  // Becomes available in .flags
  flags: {
    // Parses `--output` as a string
    output: {
      type: String,
      description: 'Output file path',
      default: 'public/swagger.json',
    },
  },
});

const config = readFileSync(argv._.configFile);

const spec: Record<string, any> = createSwaggerSpec(
  JSON.parse(config.toString()),
);

console.log(
  `Generating swagger spec to ${argv.flags.output} with config`,
  config.toString(),
);
writeFileSync(argv.flags.output, JSON.stringify(spec, null, 2));
