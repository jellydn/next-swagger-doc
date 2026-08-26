import { cli } from 'cleye';

import { writeCliSpec } from './cli-write';

const argv = cli({
  name: 'next-swagger-doc-cli',

  // Becomes available in ._.configFile
  parameters: [
    '<config file>', // Next swagger config file is required
  ],

  flags: {
    output: {
      type: String,
      description: 'Output file path',
      default: 'public/swagger.json',
    },
  },
});

try {
  writeCliSpec(argv._.configFile, argv.flags.output);
  console.log(`Generating swagger spec to ${argv.flags.output}`);
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Failed to generate swagger spec';
  console.error(message);
  process.exitCode = 1;
}
