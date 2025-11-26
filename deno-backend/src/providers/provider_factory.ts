/**
 * Provider Factory
 *
 * Creates provider instances based on configuration and auto-detection.
 *
 * @module
 */

import type { Provider } from "./provider.ts";
import { GitHubProvider } from "./github_provider.ts";
import type { ProviderType } from "../config/provider_config.ts";
import {
  autoDetectProvider,
  getProviderConfig,
  loadConfig,
} from "../config/provider_config.ts";
import { getProviderToken } from "../auth/provider_auth.ts";

/**
 * Provider factory configuration
 */
export interface ProviderFactoryConfig {
  /**
   * Force a specific provider (skip auto-detection)
   */
  provider?: ProviderType;

  /**
   * Provider-specific token (overrides auto-detection)
   */
  token?: string;

  /**
   * Provider base URL (for self-hosted instances)
   */
  baseUrl?: string;
}

/**
 * Provider factory error
 */
export class ProviderFactoryError extends Error {
  constructor(message: string, public override cause?: Error) {
    super(message);
    this.name = "ProviderFactoryError";
  }
}

/**
 * Create a provider instance
 *
 * This function handles:
 * 1. Auto-detection of provider from git remote or environment
 * 2. Token resolution from environment or config file
 * 3. Provider initialization
 *
 * @param config - Optional configuration
 * @returns Provider instance
 *
 * @example
 * ```ts
 * // Auto-detect provider and use environment token
 * const provider = await createProvider();
 *
 * // Force GitHub provider
 * const github = await createProvider({ provider: "github" });
 *
 * // Use custom token
 * const custom = await createProvider({
 *   provider: "github",
 *   token: "ghp_customtoken",
 * });
 * ```
 */
export async function createProvider(
  config?: ProviderFactoryConfig,
): Promise<Provider> {
  try {
    // Load config file if available
    const fileConfig = await loadConfig();

    // Determine provider type
    let providerType: ProviderType;
    if (config?.provider) {
      providerType = config.provider;
    } else if (fileConfig?.defaultProvider) {
      providerType = fileConfig.defaultProvider;
    } else {
      providerType = await autoDetectProvider();
    }

    // Get provider configuration
    const providerConfig = getProviderConfig(providerType, fileConfig);

    // Get authentication token
    let token: string;
    if (config?.token) {
      token = config.token;
    } else {
      const resolvedToken = await getProviderToken(providerType, fileConfig);
      if (!resolvedToken) {
        throw new ProviderFactoryError(
          `No authentication token found for ${providerType}. ` +
            `Set ${providerType.toUpperCase()}_TOKEN environment variable or configure in ~/.config/gitxab/config.json`,
        );
      }
      token = resolvedToken;
    }

    // Use custom base URL if provided
    const baseUrl = config?.baseUrl || providerConfig.baseUrl;

    // Create provider instance
    switch (providerType) {
      case "github":
        return new GitHubProvider({ token, baseUrl });

      case "gitlab":
        // TODO: Implement GitLabProvider
        throw new ProviderFactoryError(
          "GitLab provider not yet implemented. GitHub provider is currently supported.",
        );

      default:
        throw new ProviderFactoryError(
          `Unknown provider type: ${providerType}`,
        );
    }
  } catch (error) {
    if (error instanceof ProviderFactoryError) {
      throw error;
    }
    throw new ProviderFactoryError(
      `Failed to create provider: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Create a GitHub provider instance
 *
 * Convenience function for directly creating a GitHub provider.
 *
 * @param config - GitHub configuration
 * @returns GitHub provider instance
 */
export async function createGitHubProvider(config?: {
  token?: string;
  baseUrl?: string;
}): Promise<GitHubProvider> {
  const provider = await createProvider({
    provider: "github",
    token: config?.token,
    baseUrl: config?.baseUrl,
  });

  return provider as GitHubProvider;
}

/**
 * Get the current provider type for the repository
 *
 * This function attempts to determine the provider without creating
 * a full provider instance. Useful for displaying provider information.
 *
 * @returns Provider type
 */
export async function detectCurrentProvider(): Promise<ProviderType> {
  const fileConfig = await loadConfig();

  if (fileConfig?.defaultProvider) {
    return fileConfig.defaultProvider;
  }

  return await autoDetectProvider();
}
