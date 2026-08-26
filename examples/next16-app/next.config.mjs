import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nested example has its own lockfile; keep Turbopack rooted here.
  turbopack: {
    root: __dirname,
  },
  // Transpile Swagger UI React https://github.com/swagger-api/swagger-ui/issues/8245
  transpilePackages: [
    'react-syntax-highlighter',
    'swagger-client',
    'swagger-ui-react',
  ],
};

export default nextConfig;
