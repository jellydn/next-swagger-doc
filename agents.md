# Agents and Automation

This document describes the various AI agents and automation tools that help maintain and improve the `next-swagger-doc` project.

## AI Agents

### 🤖 GitHub Copilot

- **Purpose**: Code completion and assistance
- **Usage**: Helps developers write code, tests, and documentation
- **Integration**: Available in VS Code and other supported IDEs
- **Best Practices**:
  - Use descriptive comments to guide code generation
  - Review generated code for quality and security
  - Particularly useful for JSDoc annotations and test cases

### 🔍 CodeQL Analysis Bot

- **Purpose**: Automated security vulnerability detection
- **Configuration**: `.github/workflows/codeql-analysis.yml`
- **Schedule**: Runs on push to main, PRs, and weekly on Fridays
- **Scope**: Analyzes JavaScript code for security issues
- **Actions**: Automatically scans code and reports security findings

### 📊 CodeSee Architecture Bot

- **Purpose**: Automatically generates and maintains architecture diagrams
- **Configuration**: `.github/workflows/codesee-arch-diagram.yml`
- **Trigger**: Runs on pushes to main and pull requests
- **Benefits**: Helps visualize code structure and dependencies

## Automation Tools

### 🎯 Pre-commit Hooks

- **Tools**: Prettier, Biome
- **Configuration**: `.pre-commit-config.yaml`
- **Purpose**: Ensures code quality before commits
- **Supported Formats**:
  - Prettier: HTML, CSS, Markdown
  - Biome: JavaScript, TypeScript (linting and formatting)

### 🏗️ Build Automation

- **Tool**: pkgroll
- **Purpose**: Automated building and bundling
- **Outputs**:
  - CommonJS: `dist/index.cjs`
  - ESM: `dist/index.js`
  - TypeScript definitions: `dist/index.d.ts`
  - CLI: `dist/cli.js`

### 🧪 Testing Automation

- **Framework**: Vitest
- **Coverage**: v8 coverage reporting
- **UI**: Available via `npm run test:ui`
- **Features**:
  - Fast test execution
  - Native ES modules support
  - TypeScript support out of the box

### 📦 Dependency Management

- **Tool**: Renovate
- **Configuration**: `renovate.json`
- **Purpose**: Automated dependency updates
- **Benefits**: Keeps dependencies secure and up-to-date

### 📚 Documentation Generation

- **Tool**: TypeDoc
- **Command**: `npm run vercel-build`
- **Purpose**: Generates API documentation from TypeScript comments
- **Output**: Deployed to Vercel for public access

## Development Agents

### 🔧 Language Server Protocol (LSP)

For enhanced development experience, consider using:

- **TypeScript Language Server**: Provides IntelliSense, error detection, and refactoring
- **ESLint/Biome Language Server**: Real-time linting and formatting suggestions

### 🚀 Deployment Agents

- **Vercel**: Automated deployment of documentation
- **npm**: Automated package publishing (when configured)

## Agent Configuration Best Practices

### For Swagger Documentation

When using AI agents to help with this project:

1. **JSDoc Annotations**: Agents can help generate proper JSDoc comments for API routes
2. **OpenAPI Specs**: AI can assist in writing comprehensive OpenAPI specifications
3. **Test Cases**: Agents can generate test cases for different API scenarios
4. **Example Code**: AI can help create usage examples for documentation

### Recommended Prompts for AI Agents

```markdown
# For generating JSDoc comments:

"Generate JSDoc comments for this Next.js API route that include OpenAPI annotations"

# For creating test cases:

"Create comprehensive test cases for this Swagger documentation generator function"

# For writing examples:

"Create a complete example showing how to use next-swagger-doc with Next.js 13+ App Router"
```

## Contributing with AI Agents

When contributing to this project with AI assistance:

1. **Code Review**: Always review AI-generated code for accuracy and project standards
2. **Testing**: Ensure AI-generated code includes appropriate tests
3. **Documentation**: Verify that AI-generated documentation is accurate and helpful
4. **Security**: Review AI suggestions for potential security implications
5. **Dependencies**: Be cautious about AI-suggested dependency additions

## Monitoring and Maintenance

- **CodeQL**: Weekly security scans
- **Renovate**: Automatic dependency update PRs
- **Pre-commit**: Quality checks before each commit
- **Vitest**: Continuous testing during development

For questions about agents and automation, please check the [contributing guidelines](README.md#contributing) or open an issue.
