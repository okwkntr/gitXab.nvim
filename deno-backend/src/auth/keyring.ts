/**
 * Simple token provider for GitLab access.
 * Strategy:
 * 1. Check environment variable GITLAB_TOKEN
 * 2. Check config file at $XDG_CONFIG_HOME/gitxab/token (plaintext) as fallback
 *
 * Note: For production, integrate OS keyring (libsecret / keychain) via platform-specific
 * helpers or a small native helper binary. This module keeps a simple, permission-light
 * approach for development and CI.
 */

export async function getToken(): Promise<string | null> {
  // 1) env var
  const envToken = Deno.env.get("GITLAB_TOKEN");
  if (envToken && envToken.trim().length > 0) return envToken.trim();

  // 2) config file fallback
  const xdgConfig = Deno.env.get("XDG_CONFIG_HOME") || (Deno.env.get("HOME") ? `${Deno.env.get("HOME")}/.config` : undefined);
  if (xdgConfig) {
    const path = `${xdgConfig}/gitxab/token`;
    try {
      const text = await Deno.readTextFile(path);
      const tok = text.trim();
      if (tok.length > 0) return tok;
    } catch (e) {
      // no file or unreadable, ignore
    }
  }

  return null;
}

export async function storeTokenFallback(token: string): Promise<void> {
  const xdgConfig = Deno.env.get("XDG_CONFIG_HOME") || (Deno.env.get("HOME") ? `${Deno.env.get("HOME")}/.config` : undefined);
  if (!xdgConfig) throw new Error("XDG_CONFIG_HOME or HOME must be set to store token");
  const dir = `${xdgConfig}/gitxab`;
  try { await Deno.mkdir(dir, { recursive: true }); } catch {}
  const path = `${dir}/token`;
  await Deno.writeTextFile(path, token, { mode: 0o600 });
}
