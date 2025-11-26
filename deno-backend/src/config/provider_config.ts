/**
 * Provider Configuration and Detection
 * 
 * This module handles:
 * - Auto-detection of provider from git remote URL
 * - Auto-detection of provider from environment tokens
 * - Provider configuration from config file
 * - Manual provider selection
 * 
 * @module
 */

/**
 * Provider type
 */
export type ProviderType = 'gitlab' | 'github';

/**
 * Provider configuration
 */
export interface ProviderConfig {
  provider: ProviderType;
  baseUrl: string;
  token?: string;
}

/**
 * GitXab configuration file structure
 */
export interface GitXabConfig {
  defaultProvider?: ProviderType;
  providers?: {
    gitlab?: {
      baseUrl?: string;
      token?: string;
    };
    github?: {
      baseUrl?: string;
      token?: string;
    };
  };
}

/**
 * Default base URLs for providers
 */
export const DEFAULT_BASE_URLS: Record<ProviderType, string> = {
  gitlab: "https://gitlab.com",
  github: "https://api.github.com",
};

/**
 * Detect provider from git remote URL
 * 
 * @param remoteUrl - Git remote URL (e.g., from `git remote get-url origin`)
 * @returns Detected provider type or null
 * 
 * @example
 * detectProviderFromUrl("https://github.com/user/repo.git") // => "github"
 * detectProviderFromUrl("git@gitlab.com:user/repo.git") // => "gitlab"
 * detectProviderFromUrl("https://gitlab.example.com/group/project.git") // => "gitlab"
 */
export function detectProviderFromUrl(remoteUrl: string): ProviderType | null {
  if (!remoteUrl) return null;
  
  const url = remoteUrl.toLowerCase();
  
  // GitHub detection
  if (url.includes("github.com")) {
    return "github";
  }
  
  // GitLab detection
  if (url.includes("gitlab.com") || url.includes("gitlab")) {
    return "gitlab";
  }
  
  return null;
}

/**
 * Detect provider from environment variables
 * 
 * Checks for the presence of provider-specific tokens:
 * - GITHUB_TOKEN or GH_TOKEN → github
 * - GITLAB_TOKEN → gitlab
 * 
 * @returns Detected provider type or null
 */
export function detectProviderFromEnv(): ProviderType | null {
  const githubToken = Deno.env.get("GITHUB_TOKEN") || Deno.env.get("GH_TOKEN");
  const gitlabToken = Deno.env.get("GITLAB_TOKEN");
  
  // If both tokens are present, prefer GitHub (more common)
  if (githubToken) {
    return "github";
  }
  
  if (gitlabToken) {
    return "gitlab";
  }
  
  return null;
}

/**
 * Get git remote URL for current directory
 * 
 * @returns Remote URL or null if not in a git repository
 */
export async function getGitRemoteUrl(): Promise<string | null> {
  try {
    const command = new Deno.Command("git", {
      args: ["remote", "get-url", "origin"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { code, stdout } = await command.output();
    
    if (code === 0) {
      const url = new TextDecoder().decode(stdout).trim();
      return url || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Auto-detect provider
 * 
 * Detection order:
 * 1. Git remote URL (if in a git repository)
 * 2. Environment tokens
 * 3. Default to GitLab (for backward compatibility)
 * 
 * @returns Detected provider type
 */
export async function autoDetectProvider(): Promise<ProviderType> {
  // Try git remote URL first
  const remoteUrl = await getGitRemoteUrl();
  if (remoteUrl) {
    const provider = detectProviderFromUrl(remoteUrl);
    if (provider) {
      return provider;
    }
  }
  
  // Try environment tokens
  const envProvider = detectProviderFromEnv();
  if (envProvider) {
    return envProvider;
  }
  
  // Default to GitLab for backward compatibility
  return "gitlab";
}

/**
 * Load configuration from config file
 * 
 * Config file location: ~/.config/gitxab/config.json
 * 
 * @returns Loaded configuration or null if file doesn't exist
 */
export async function loadConfig(): Promise<GitXabConfig | null> {
  try {
    const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
    if (!homeDir) return null;
    
    const configPath = `${homeDir}/.config/gitxab/config.json`;
    
    const content = await Deno.readTextFile(configPath);
    const config = JSON.parse(content) as GitXabConfig;
    
    return config;
  } catch {
    return null;
  }
}

/**
 * Save configuration to config file
 * 
 * @param config - Configuration to save
 */
export async function saveConfig(config: GitXabConfig): Promise<void> {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  if (!homeDir) {
    throw new Error("Cannot determine home directory");
  }
  
  const configDir = `${homeDir}/.config/gitxab`;
  const configPath = `${configDir}/config.json`;
  
  // Create config directory if it doesn't exist
  try {
    await Deno.mkdir(configDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
  
  // Write config file
  const content = JSON.stringify(config, null, 2);
  await Deno.writeTextFile(configPath, content);
}

/**
 * Get provider configuration
 * 
 * Priority order:
 * 1. Environment variables (GITHUB_TOKEN/GITLAB_TOKEN)
 * 2. Config file
 * 3. Default values
 * 
 * @param provider - Provider type
 * @param config - Optional loaded configuration
 * @returns Provider configuration
 */
export function getProviderConfig(
  provider: ProviderType,
  config?: GitXabConfig | null
): ProviderConfig {
  const baseUrl = config?.providers?.[provider]?.baseUrl || 
                  Deno.env.get(`${provider.toUpperCase()}_BASE_URL`) ||
                  DEFAULT_BASE_URLS[provider];
  
  let token: string | undefined;
  
  if (provider === "github") {
    token = Deno.env.get("GITHUB_TOKEN") || 
            Deno.env.get("GH_TOKEN") ||
            config?.providers?.github?.token;
  } else if (provider === "gitlab") {
    token = Deno.env.get("GITLAB_TOKEN") ||
            config?.providers?.gitlab?.token;
  }
  
  return {
    provider,
    baseUrl,
    token,
  };
}

/**
 * Get base URL for a provider from environment or config
 * 
 * @param provider - Provider type
 * @returns Base URL
 */
export function getBaseUrl(provider: ProviderType): string {
  if (provider === "gitlab") {
    return Deno.env.get("GITLAB_BASE_URL") || DEFAULT_BASE_URLS.gitlab;
  } else {
    return Deno.env.get("GITHUB_BASE_URL") || DEFAULT_BASE_URLS.github;
  }
}

/**
 * Parse repository identifier from various formats
 * 
 * Supports:
 * - "owner/repo" (GitHub style)
 * - "123" (GitLab numeric ID)
 * - "group/subgroup/project" (GitLab path)
 * 
 * @param id - Repository identifier
 * @returns Normalized identifier
 */
export function parseRepositoryId(id: string | number): string {
  if (typeof id === "number") {
    return id.toString();
  }
  return id;
}

/**
 * Extract owner and repo from full name
 * 
 * @param fullName - Full repository name (e.g., "owner/repo")
 * @returns Object with owner and repo
 */
export function extractOwnerAndRepo(fullName: string): { owner: string; repo: string } {
  const parts = fullName.split("/");
  
  if (parts.length < 2) {
    throw new Error(`Invalid repository format: ${fullName}`);
  }
  
  // For GitHub: owner/repo
  // For GitLab: group/subgroup/project (use last two parts)
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  } else {
    // Multiple slashes - assume last part is repo, everything else is owner
    const repo = parts[parts.length - 1];
    const owner = parts.slice(0, -1).join("/");
    return { owner, repo };
  }
}
