# AGENTS.md

This file provides instructions for AI coding agents working on the `next-swagger-doc` project.

## Project Overview

This is a Next.js Swagger documentation generator that reads JSDoc-annotated source code on NextJS API routes and generates OpenAPI (Swagger) specifications. The library supports both individual API documentation and comprehensive API documentation generation.

## Development Environment Tips

- Use `npm install` to install dependencies (project uses npm, not pnpm)
- Run `npm run build` to build the library using pkgroll
- Use `npm run start` for watch mode during development
- Run `npm test` to execute the Vitest test suite
- Use `npm run test:ui` for the interactive test interface
- Run `npm run coverage` to see test coverage reports

## Code Structure

- **`src/index.ts`**: Main entry point, exports the primary functions
- **`src/swagger.ts`**: Core Swagger generation logic
- **`src/cli.ts`**: Command-line interface implementation
- **`test/`**: Test files using Vitest
- **`examples/`**: Example implementations for different Next.js versions

## Testing Instructions

- All tests use Vitest framework
- Run `npm test` to execute the complete test suite
- Tests must pass before merging any changes
- Add tests for any new functionality you implement
- Focus on testing the Swagger generation logic and CLI functionality

## Code Style and Linting

- Code is formatted using Biome: `npm run format`
- Linting is handled by Biome: `npm run lint`
- Use pre-commit hooks to ensure code quality
- Follow the existing TypeScript patterns in the codebase

## API Documentation Guidelines

When adding new features:

1. **JSDoc Comments**: Always add comprehensive JSDoc comments for new functions
2. **OpenAPI Annotations**: Include proper OpenAPI/Swagger annotations in examples
3. **Type Safety**: Maintain strong TypeScript typing throughout
4. **Example Updates**: Update relevant examples in the `examples/` directory

## Build and Distribution

- The library builds to both CommonJS (`dist/index.cjs`) and ESM (`dist/index.js`)
- TypeScript definitions are generated in `dist/index.d.ts`
- CLI is built to `dist/cli.js`
- Use `npm run prepare` to ensure build before publishing

## Contributing Workflow

- Create feature branches from `main`
- Run linting and tests before committing: `npm run lint && npm test`
- Ensure your code works with the examples in the `examples/` directory
- Update documentation if you change public APIs
- All builds must pass before merging

## Key Dependencies

- **swagger-jsdoc**: Core dependency for Swagger spec generation
- **cleye**: CLI argument parsing
- **Next.js**: Peer dependency (version 9+)
- **TypeScript**: Development and type checking

## Common Tasks

- **Adding a new API route example**: Update the appropriate example in `examples/`
- **Modifying Swagger generation**: Focus on `src/swagger.ts`
- **CLI changes**: Modify `src/cli.ts`
- **Adding new export**: Update `src/index.ts`

## Debugging Tips

- Use `npm run test:ui` for interactive debugging of tests
- Check the `examples/` directory for working implementations
- Verify OpenAPI spec generation with online Swagger validators
- Test CLI functionality with `node dist/cli.js --help`

Remember: This library helps developers generate Swagger documentation from Next.js API routes, so focus on developer experience and accurate OpenAPI spec generation.
