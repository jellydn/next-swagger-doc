/**
 * Configuration types and validation for auto-generation feature
 * @module auto-generate/config
 */

/**
 * Performance tuning options for auto-generation
 */
export interface PerformanceConfig {
  /** Enable AST caching between runs */
  cacheEnabled: boolean;
  /** Cache time-to-live in milliseconds */
  cacheTTL: number;
  /** Number of parallel file processors */
  parallelism: number;
  /** Maximum file size to parse (bytes) */
  maxFileSize: number;
  /** Timeout for parsing single file (ms) */
  timeoutPerFile: number;
}

/**
 * Configuration options for auto-generation feature
 */
export interface AutoGenerateConfig {
  /** Master switch for auto-generation */
  enabled: boolean;
  /** Folders to scan for Zod schemas */
  zodSchemaFolders?: string[];
  /** Whether to extract TypeScript types as fallback */
  includeTypeScript: boolean;
  /** Which router types to process */
  routerTypes: ('pages' | 'app')[];
  /** Whether to infer descriptions from code comments */
  inferDescriptions: boolean;
  /** Whether to deduplicate schemas into components */
  componentReuse: boolean;
  /** Whether to add default error responses (400, 500) */
  defaultResponses: boolean;
  /** Glob patterns to exclude from scanning */
  excludePatterns?: string[];
  /** Performance tuning options */
  performance: PerformanceConfig;
}

/**
 * Result of configuration validation
 */
export interface ValidatedConfig {
  /** Normalized configuration with defaults applied */
  config: AutoGenerateConfig;
  /** Validation errors (fatal) */
  errors: string[];
  /** Non-fatal warnings */
  warnings: string[];
}

/**
 * Default performance configuration
 */
const DEFAULT_PERFORMANCE: PerformanceConfig = {
  cacheEnabled: true,
  cacheTTL: 5000, // 5 seconds
  parallelism: 4,
  maxFileSize: 1024 * 1024, // 1MB
  timeoutPerFile: 5000, // 5 seconds
};

/**
 * Default auto-generation configuration
 */
const DEFAULT_CONFIG: AutoGenerateConfig = {
  enabled: false, // Opt-in
  includeTypeScript: true,
  routerTypes: ['pages', 'app'],
  inferDescriptions: true,
  componentReuse: true,
  defaultResponses: false,
  performance: DEFAULT_PERFORMANCE,
};

/**
 * Validates and normalizes auto-generation configuration
 *
 * @param config - Partial configuration from user
 * @returns Validated configuration with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateAutoGenerateConfig({ enabled: true });
 * if (result.errors.length > 0) {
 *   throw new Error(`Invalid config: ${result.errors.join(', ')}`);
 * }
 * // Use result.config
 * ```
 */
export function validateAutoGenerateConfig(
  config: Partial<AutoGenerateConfig> = {}
): ValidatedConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Merge with defaults
  const normalized: AutoGenerateConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    performance: {
      ...DEFAULT_PERFORMANCE,
      ...config.performance,
    },
  };

  // Validate performance settings
  if (normalized.performance.parallelism <= 0) {
    errors.push('performance.parallelism must be > 0');
  }

  if (normalized.performance.maxFileSize <= 0) {
    errors.push('performance.maxFileSize must be > 0');
  }

  if (normalized.performance.timeoutPerFile <= 0 || normalized.performance.timeoutPerFile > 30000) {
    errors.push('performance.timeoutPerFile must be between 1 and 30000ms');
  }

  if (normalized.performance.cacheTTL < 0) {
    errors.push('performance.cacheTTL must be >= 0');
  }

  // Validate router types
  if (normalized.routerTypes.length === 0) {
    errors.push('At least one router type must be enabled');
  }

  // Validate exclude patterns (basic check)
  if (normalized.excludePatterns) {
    for (const pattern of normalized.excludePatterns) {
      if (typeof pattern !== 'string' || pattern.length === 0) {
        errors.push(`Invalid exclude pattern: ${pattern}`);
      }
    }
  }

  // Warnings
  if (!normalized.enabled) {
    warnings.push('Auto-generation is disabled (enabled: false)');
  }

  if (normalized.zodSchemaFolders && normalized.zodSchemaFolders.length > 10) {
    warnings.push('Large number of zodSchemaFolders may impact performance');
  }

  if (normalized.performance.parallelism > 8) {
    warnings.push('High parallelism (>8) may cause memory issues');
  }

  return {
    config: normalized,
    errors,
    warnings,
  };
}

/**
 * Normalizes configuration for internal use
 * Throws error if configuration is invalid
 *
 * @param config - Configuration to normalize (boolean or object)
 * @returns Normalized configuration
 * @throws Error if configuration is invalid
 *
 * @example
 * ```typescript
 * // Boolean shorthand
 * const config1 = normalizeConfig(true); // Uses all defaults
 *
 * // Full configuration
 * const config2 = normalizeConfig({
 *   enabled: true,
 *   includeTypeScript: false,
 * });
 * ```
 */
export function normalizeConfig(
  config: boolean | Partial<AutoGenerateConfig>
): AutoGenerateConfig {
  // Handle boolean shorthand
  const partialConfig: Partial<AutoGenerateConfig> =
    typeof config === 'boolean' ? { enabled: config } : config;

  const result = validateAutoGenerateConfig(partialConfig);

  if (result.errors.length > 0) {
    throw new Error(`Invalid auto-generation config: ${result.errors.join(', ')}`);
  }

  // Log warnings if present
  for (const warning of result.warnings) {
    console.warn(`[next-swagger-doc] ${warning}`);
  }

  return result.config;
}
