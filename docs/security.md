# Security Guide

This document outlines security best practices and guidelines for using
GitXab.vim.

## Token Security

### Personal Access Token Requirements

GitLab Personal Access Tokens (PATs) are the primary authentication method for
GitXab.vim.

**Required Scopes:**

- `api` - Full API access (required for all operations)

**Optional but Recommended Scopes:**

- `read_user` - Read user information
- `read_repository` - Read repository information

**Security Recommendations:**

1. Create tokens with minimum required scopes
2. Use different tokens for different purposes
3. Set expiration dates (e.g., 90 days)
4. Rotate tokens regularly
5. Revoke compromised tokens immediately

### Token Storage Methods

#### Method 1: Environment Variables (Current - Recommended)

**Setup:**

```bash
# In ~/.bashrc, ~/.zshrc, or similar
export GITLAB_TOKEN='glpat-xxxxxxxxxxxxxxxxxxxx'
```

**Pros:**

- Simple to set up
- Works across all sessions
- Not stored in version control
- Standard practice

**Cons:**

- Visible in process environment
- Accessible to all processes run by user
- Not encrypted at rest

**Security Tips:**

- Never echo or print the variable unnecessarily
- Use shell history settings to prevent token exposure
- Clear history after setting: `history -d $(history 1)`

#### Method 2: Configuration File (Future)

**Planned Location:** `~/.config/gitxab/config.json`

**Pros:**

- Centralized configuration
- Can be encrypted
- Per-project overrides possible

**Cons:**

- File permissions critical
- Risk of accidental commits
- Must be managed separately

**Security Requirements:**

- File permissions: `chmod 600 ~/.config/gitxab/config.json`
- Owner only read/write
- Never commit to version control
- Add to `.gitignore`

#### Method 3: OS Keyring Integration (Future - Most Secure)

**Planned Support:**

- Linux: `libsecret` (GNOME Keyring, KWallet)
- macOS: Keychain
- Windows: Credential Manager

**Pros:**

- Encrypted at rest
- OS-managed security
- Integration with system auth
- Protected against memory dumps

**Cons:**

- Requires additional dependencies
- Platform-specific implementation
- Initial setup more complex

### Token Creation Best Practices

1. **Use Descriptive Names:**
   ```
   GitXab.vim - Development Machine - 2025-11-24
   ```

2. **Set Expiration Dates:**
   - Personal use: 90 days
   - Testing: 30 days
   - CI/CD: Based on rotation schedule

3. **Review Active Tokens Regularly:**
   - GitLab Settings → Access Tokens
   - Revoke unused tokens
   - Check last used dates

4. **Separate Tokens by Environment:**
   - Development machine
   - Testing environment
   - CI/CD pipelines
   - Each with appropriate scopes

### What to Do If Token is Compromised

**Immediate Actions:**

1. Revoke the token in GitLab (Settings → Access Tokens)
2. Generate a new token
3. Update environment variables/configuration
4. Review GitLab audit logs for suspicious activity
5. Check recent API activity for the token

**Prevention:**

1. Never commit tokens to version control
2. Don't paste tokens in chat/email
3. Use token names without revealing purpose
4. Avoid logging tokens in application logs

## Network Security

### HTTPS/TLS

GitXab.vim always uses HTTPS for API communication:

- All requests to GitLab API use TLS
- Certificate verification enabled by default
- Self-signed certificates rejected (unless configured)

**Custom CA Certificates (Future):**

```lua
vim.env.GITLAB_CA_CERT = '/path/to/custom-ca.pem'
```

### Proxy Support (Future)

For environments requiring proxy:

```bash
export HTTPS_PROXY='https://proxy.example.com:3128'
export NO_PROXY='localhost,127.0.0.1'
```

### Certificate Pinning (Future)

For high-security environments:

```lua
vim.g.gitxab = {
  security = {
    certificatePinning = true,
    pinnedCertificates = {
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    }
  }
}
```

## Data Privacy

### What Data is Stored

**In Memory:**

- API responses (temporary)
- ETag cache (temporary)
- Buffer contents (temporary)

**On Disk:**

- Nothing currently
- Future: Optional persistent cache
- Future: Configuration file (if used)

### What Data is Transmitted

**To GitLab API:**

- Authentication token (in headers)
- API requests (projects, issues, MRs)
- User-created content (comments, descriptions)
- Search queries

**Not Transmitted:**

- Local file contents
- Other environment variables
- System information
- Usage analytics

### Third-Party Data Sharing

GitXab.vim does NOT:

- Send telemetry
- Phone home
- Share data with third parties
- Include analytics
- Track usage

## Secure Configuration

### Neovim Configuration

**DO:**

```lua
-- Read from environment
vim.env.GITLAB_TOKEN = os.getenv('GITLAB_TOKEN')

-- Or use secure config file (future)
local config = require('gitxab.config').load()
```

**DON'T:**

```lua
-- NEVER hardcode tokens
vim.env.GITLAB_TOKEN = 'glpat-xxxxxxxxxxxxxxxxxxxx'  -- ❌ BAD

-- Don't store in easily accessible globals
vim.g.gitlab_token = 'glpat-xxxxxxxxxxxxxxxxxxxx'   -- ❌ BAD
```

### Version Control

**Required `.gitignore` entries:**

```gitignore
# GitXab configuration
.config/gitxab/config.json
.gitxab.json

# Environment files
.env
.env.local

# Cache (if future feature)
.cache/gitxab/
```

**Pre-commit Hook (Recommended):**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for potential token exposure
if git diff --cached | grep -i 'glpat-\|gitlab_token'; then
    echo "ERROR: Potential GitLab token in commit!"
    echo "Please remove tokens before committing."
    exit 1
fi
```

## Access Control

### File Permissions

**Configuration file (future):**

```bash
chmod 600 ~/.config/gitxab/config.json
chown $USER:$USER ~/.config/gitxab/config.json
```

**Cache directory (future):**

```bash
chmod 700 ~/.cache/gitxab/
```

### Multi-User Systems

On shared systems:

1. **Use user-specific tokens** - Never share tokens
2. **Separate home directories** - Standard Unix permissions
3. **Process isolation** - denops runs as your user
4. **No privilege escalation** - Plugin runs with user permissions

## Rate Limiting and Abuse Prevention

### GitLab API Rate Limits

**GitLab.com:**

- 2000 requests per minute per token
- 10 requests per second per token

**Self-Hosted:**

- Configurable by administrator
- Check with your GitLab admin

### How GitXab.vim Helps

1. **ETag Caching:**
   - Reduces redundant API calls
   - 304 responses don't count against rate limit
   - Automatic cache validation

2. **Smart Pagination:**
   - Only fetches what's needed
   - Configurable page sizes
   - Avoids over-fetching

3. **Request Debouncing (Future):**
   - Prevents rapid repeated requests
   - Queues multiple requests
   - Batches where possible

### What to Do if Rate Limited

If you see rate limit errors:

1. Wait for the limit to reset (typically 1 minute)
2. Reduce frequency of operations
3. Enable caching (if disabled)
4. Check for runaway scripts/automation
5. Contact GitLab admin (self-hosted)

## Vulnerability Reporting

### Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security contact (see SECURITY.md)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Security Updates

- Subscribe to repository releases
- Check CHANGELOG for security fixes
- Update regularly
- Review security advisories

## Compliance Considerations

### GDPR (EU)

GitXab.vim:

- Processes minimal personal data
- No data retention beyond session
- No cross-border transfers (data stays with GitLab)
- User controls all data

### SOC 2 / ISO 27001

For organizations with compliance requirements:

1. **Token Management:**
   - Use OS keyring when available
   - Implement token rotation
   - Audit token usage

2. **Access Logging:**
   - Enable GitLab audit logs
   - Monitor API access
   - Review regularly

3. **Least Privilege:**
   - Minimal token scopes
   - User-specific tokens
   - Regular access reviews

## Security Checklist

### Initial Setup

- [ ] Create token with minimal scopes
- [ ] Set token expiration date
- [ ] Store token in environment variable
- [ ] Verify HTTPS connection
- [ ] Test token permissions
- [ ] Add config to .gitignore

### Regular Maintenance

- [ ] Review active tokens monthly
- [ ] Rotate tokens every 90 days
- [ ] Check GitLab audit logs
- [ ] Update GitXab.vim regularly
- [ ] Review API usage
- [ ] Verify no token leaks in logs

### Incident Response

- [ ] Document incident response plan
- [ ] Know how to revoke tokens quickly
- [ ] Have token rotation procedure
- [ ] Monitor for suspicious activity
- [ ] Regular security training

## Future Security Features

### Planned Enhancements

1. **Token Encryption:**
   - Encrypted config file support
   - Key derivation from user password
   - Hardware security module support

2. **Two-Factor Authentication:**
   - GitLab 2FA integration
   - TOTP support
   - Backup codes

3. **Audit Logging:**
   - Local operation logs
   - API call logging
   - Security event tracking

4. **Permission Scoping:**
   - Per-command scope requirements
   - Runtime permission requests
   - Principle of least privilege

5. **Security Scanning:**
   - Dependency vulnerability scanning
   - Code security analysis
   - Regular security audits

## Resources

- [GitLab Token Security](https://docs.gitlab.com/ee/security/token_overview.html)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Deno Security](https://deno.land/manual/getting_started/permissions)
