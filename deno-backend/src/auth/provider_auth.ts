/**
 * Provider Authentication
 *
 * This module handles token resolution and authentication for different providers.
 *
 * Token resolution order:
 * 1. Environment variables (GITHUB_TOKEN/GITLAB_TOKEN)
 * 2. Configuration file (~/.config/gitxab/config.json)
 * 3. Legacy token file (for backward compatibility)
 *
 * @module
 */

import type { GitXabConfig, ProviderType } from "../config/provider_config.ts";

/**
 * Get authentication token for a provider
 *
 * Resolution order:
 * 1. Environment variable
 * 2. Config file
 * 3. Legacy token file (GitLab only, for backward compatibility)
 *
 * @param provider - Provider type
 * @param config - Optional loaded configuration
 * @returns Authentication token or null
 */
export async function getProviderToken(
  provider: ProviderType,
  config?: GitXabConfig | null,
): Promise<string | null> {
  // Try environment variable first
  const envToken = getTokenFromEnv(provider);
  if (envToken) {
    return envToken;
  }

  // Try config file
  if (config?.providers?.[provider]?.token) {
    return config.providers[provider].token;
  }

  // For GitLab, try legacy token file for backward compatibility
  if (provider === "gitlab") {
    const legacyToken = await getLegacyGitLabToken();
    if (legacyToken) {
      return legacyToken;
    }
  }

  return null;
}

/**
 * Get token from environment variables
 *
 * @param provider - Provider type
 * @returns Token from environment or null
 */
export function getTokenFromEnv(provider: ProviderType): string | null {
  if (provider === "github") {
    // GitHub accepts both GITHUB_TOKEN and GH_TOKEN
    const token = Deno.env.get("GITHUB_TOKEN") || Deno.env.get("GH_TOKEN");
    return token && token.trim().length > 0 ? token.trim() : null;
  } else if (provider === "gitlab") {
    const token = Deno.env.get("GITLAB_TOKEN");
    return token && token.trim().length > 0 ? token.trim() : null;
  }

  return null;
}

/**
 * Get legacy GitLab token from old config file
 *
 * This is for backward compatibility with the existing keyring.ts implementation.
 * Location: $XDG_CONFIG_HOME/gitxab/token or ~/.config/gitxab/token
 *
 * @returns Legacy token or null
 */
async function getLegacyGitLabToken(): Promise<string | null> {
  try {
    const xdgConfig = Deno.env.get("XDG_CONFIG_HOME") ||
      (Deno.env.get("HOME") ? `${Deno.env.get("HOME")}/.config` : undefined);

    if (!xdgConfig) return null;

    const path = `${xdgConfig}/gitxab/token`;
    const content = await Deno.readTextFile(path);
    const token = content.trim();

    return token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/**
 * Validate authentication token format
 *
 * Basic validation to catch obvious issues before making API calls.
 *
 * @param token - Token to validate
 * @param provider - Provider type
 * @returns True if token format looks valid
 */
export function validateTokenFormat(
  token: string,
  provider: ProviderType,
): boolean {
  if (!token || token.trim().length === 0) {
    return false;
  }

  const trimmed = token.trim();

  if (provider === "github") {
    // GitHub tokens:
    // - Classic: ghp_... (40 chars)
    // - Fine-grained: github_pat_... (93+ chars)
    // - OAuth: gho_... (40 chars)
    return trimmed.startsWith("ghp_") ||
      trimmed.startsWith("github_pat_") ||
      trimmed.startsWith("gho_") ||
      trimmed.startsWith("ghs_") ||
      trimmed.length >= 20; // Fallback for other formats
  } else if (provider === "gitlab") {
    // GitLab personal access tokens:
    // - glpat-... (20 chars)
    // - or any string (GitLab is more flexible)
    return trimmed.length >= 20;
  }

  return false;
}

/**
 * Check if authentication is configured for a provider
 *
 * This checks if a token is available without actually validating it against the API.
 *
 * @param provider - Provider type
 * @param config - Optional loaded configuration
 * @returns True if token is available
 */
export async function isAuthConfigured(
  provider: ProviderType,
  config?: GitXabConfig | null,
): Promise<boolean> {
  const token = await getProviderToken(provider, config);
  return token !== null && validateTokenFormat(token, provider);
}

/**
 * Create authentication headers for API requests
 *
 * @param token - Authentication token
 * @param provider - Provider type
 * @returns Headers object for fetch
 */
export function createAuthHeaders(
  token: string,
  provider: ProviderType,
): Record<string, string> {
  if (provider === "github") {
    // GitHub uses Bearer token or token authentication
    // Bearer is preferred for newer APIs
    return {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  } else if (provider === "gitlab") {
    // GitLab uses PRIVATE-TOKEN header
    return {
      "PRIVATE-TOKEN": token,
      "Content-Type": "application/json",
    };
  }

  return {};
}

/**
 * Get user agent string for API requests
 *
 * @returns User agent string
 */
export function getUserAgent(): string {
  return "gitXab.nvim/1.0";
}

/**
 * Create complete headers for API requests
 *
 * Combines authentication headers with other required headers.
 *
 * @param token - Authentication token
 * @param provider - Provider type
 * @returns Complete headers object
 */
export function createRequestHeaders(
  token: string,
  provider: ProviderType,
): Record<string, string> {
  const authHeaders = createAuthHeaders(token, provider);

  return {
    ...authHeaders,
    "User-Agent": getUserAgent(),
  };
}
