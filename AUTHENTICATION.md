# OpenMemory Dashboard Authentication

This document describes the flexible authentication system for the OpenMemory dashboard, which supports both password authentication and GitHub OAuth with independent toggle controls.

## Table of Contents

- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Docker Deployment](#docker-deployment)
- [Render.com Deployment](#rendercom-deployment)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Overview

The OpenMemory dashboard uses NextAuth.js v5 (next-auth@beta) to provide a flexible authentication system with the following features:

- **Password Authentication**: Simple username/password login with configurable credentials
- **GitHub OAuth**: Single Sign-On with GitHub, restricted to specific GitHub usernames
- **Independent Toggle**: Each authentication method can be enabled/disabled independently
- **Session Management**: JWT-based sessions with 7-day expiration
- **Secure Cookies**: HTTP-only cookies for enhanced security
- **Route Protection**: Middleware-based protection for all dashboard routes
- **Dark Theme UI**: Login page matches the dashboard's dark theme

## Authentication Methods

### Password Authentication

When enabled, users can log in with:

- **Username**: `admin` (hardcoded)
- **Password**: Configured via `DASHBOARD_PASSWORD` environment variable

### GitHub OAuth

When enabled, users can log in with their GitHub account, but access is restricted to:

- Only the GitHub username specified in `ALLOWED_GITHUB_USERNAME` can log in
- All other GitHub users will be denied access

### Dual Authentication

Both methods can be enabled simultaneously, giving users the choice of authentication method.

## Environment Variables

### Required Variables (All Deployments)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXTAUTH_SECRET` | Secret key for signing JWT tokens | `O4dUkfKVLsgN8gEc4IHyVcVYF4TG5MTrSOsmPRW24dQ=` | ✅ Yes |
| `NEXTAUTH_URL` | Full URL of your dashboard | `http://localhost:3000` or `https://your-domain.com` | ✅ Yes |

### Password Authentication Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENABLE_PASSWORD_AUTH` | Enable password authentication | `true` or `false` | ✅ Yes |
| `NEXT_PUBLIC_ENABLE_PASSWORD_AUTH` | Client-side flag (must match above) | `true` or `false` | ✅ Yes |
| `DASHBOARD_PASSWORD` | Password for admin user | `your-secure-password` | Only if password auth enabled |

### GitHub OAuth Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENABLE_GITHUB_SSO` | Enable GitHub OAuth | `true` or `false` | ✅ Yes |
| `NEXT_PUBLIC_ENABLE_GITHUB_SSO` | Client-side flag (must match above) | `true` or `false` | ✅ Yes |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID | `Iv1.a1b2c3d4e5f6g7h8` | Only if GitHub SSO enabled |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | `1234567890abcdef...` | Only if GitHub SSO enabled |
| `ALLOWED_GITHUB_USERNAME` | GitHub username allowed to log in | `yourusername` | Only if GitHub SSO enabled |

### Generating NEXTAUTH_SECRET

Generate a secure random secret using one of these methods:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Local Development Setup

### 1. Configure Environment Variables

Create or update your `.env` file in the project root:

```bash
# Authentication Configuration
ENABLE_PASSWORD_AUTH=true
ENABLE_GITHUB_SSO=false

# Password Authentication
DASHBOARD_PASSWORD=your-secure-password

# NextAuth Configuration
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth (optional, only if ENABLE_GITHUB_SSO=true)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
ALLOWED_GITHUB_USERNAME=
```

### 2. Start the Dashboard

```bash
# Using Docker Compose (recommended)
docker-compose up --build -d dashboard

# Or run locally
cd dashboard
npm install
npm run dev
```

### 3. Access the Dashboard

Navigate to `http://localhost:3000` and log in with your configured credentials.

## Docker Deployment

### Important: Build Arguments

The `NEXT_PUBLIC_*` environment variables must be passed as **build arguments** to Docker because Next.js needs them at build time for client-side code.

### docker-compose.yml Configuration

```yaml
dashboard:
  build:
    context: ./dashboard
    dockerfile: Dockerfile
    args:
      - NEXT_PUBLIC_ENABLE_PASSWORD_AUTH=${ENABLE_PASSWORD_AUTH:-true}
      - NEXT_PUBLIC_ENABLE_GITHUB_SSO=${ENABLE_GITHUB_SSO:-false}
  environment:
    # Runtime environment variables
    - ENABLE_PASSWORD_AUTH=${ENABLE_PASSWORD_AUTH:-true}
    - ENABLE_GITHUB_SSO=${ENABLE_GITHUB_SSO:-false}
    - NEXT_PUBLIC_ENABLE_PASSWORD_AUTH=${ENABLE_PASSWORD_AUTH:-true}
    - NEXT_PUBLIC_ENABLE_GITHUB_SSO=${ENABLE_GITHUB_SSO:-false}
    - DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD:-}
    - AUTH_GITHUB_ID=${AUTH_GITHUB_ID:-}
    - AUTH_GITHUB_SECRET=${AUTH_GITHUB_SECRET:-}
    - ALLOWED_GITHUB_USERNAME=${ALLOWED_GITHUB_USERNAME:-}
    - NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-}
    - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
```

### Rebuilding After Configuration Changes

When you change authentication settings, rebuild the dashboard:

```bash
docker-compose up --build -d dashboard
```

## Render.com Deployment

### 1. Update render.yaml

The `render.yaml` file has been updated with all necessary authentication environment variables. The configuration includes:

- Default values for authentication toggles
- Placeholder secrets (marked with `sync: false`)
- Proper NEXTAUTH_URL for production

### 2. Set Secret Environment Variables

In the Render.com dashboard, navigate to your `openmemory-dashboard` service and set these secret values:

**Required Secrets:**

- `NEXTAUTH_SECRET`: Generate using the methods above
- `DASHBOARD_PASSWORD`: Your chosen password (if using password auth)

**Optional Secrets (only if using GitHub OAuth):**

- `AUTH_GITHUB_ID`: Your GitHub OAuth App Client ID
- `AUTH_GITHUB_SECRET`: Your GitHub OAuth App Client Secret
- `ALLOWED_GITHUB_USERNAME`: Your GitHub username

### 3. Enable/Disable Authentication Methods

To change which authentication methods are enabled, update these variables in Render.com:

- `ENABLE_PASSWORD_AUTH`: Set to `true` or `false`
- `ENABLE_GITHUB_SSO`: Set to `true` or `false`
- `NEXT_PUBLIC_ENABLE_PASSWORD_AUTH`: Must match `ENABLE_PASSWORD_AUTH`
- `NEXT_PUBLIC_ENABLE_GITHUB_SSO`: Must match `ENABLE_GITHUB_SSO`

**Important**: After changing these values, you must trigger a new deployment for the changes to take effect.

### 4. Update NEXTAUTH_URL

If your dashboard URL is different from `https://openmemory-dashboard.onrender.com`, update the `NEXTAUTH_URL` variable to match your actual URL.

## GitHub OAuth Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: OpenMemory Dashboard
   - **Homepage URL**: Your dashboard URL (e.g., `http://localhost:3000` or `https://your-domain.com`)
   - **Authorization callback URL**: `{NEXTAUTH_URL}/api/auth/callback/github`
     - Local: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://your-domain.com/api/auth/callback/github`
4. Click "Register application"

### 2. Get Client ID and Secret

After creating the app:

1. Copy the **Client ID**
2. Click "Generate a new client secret"
3. Copy the **Client Secret** (you won't be able to see it again)

### 3. Configure Environment Variables

Update your environment variables:

```bash
ENABLE_GITHUB_SSO=true
NEXT_PUBLIC_ENABLE_GITHUB_SSO=true
AUTH_GITHUB_ID=your-client-id
AUTH_GITHUB_SECRET=your-client-secret
ALLOWED_GITHUB_USERNAME=your-github-username
```

### 4. Rebuild and Test

```bash
# Local development
docker-compose up --build -d dashboard

# Then test by navigating to http://localhost:3000
```

### 5. Multiple Allowed Users (Future Enhancement)

Currently, only one GitHub username is allowed. To support multiple users, you would need to:

1. Modify `dashboard/auth.ts` to accept a comma-separated list
2. Update the `signIn` callback to check against the list
3. Update documentation accordingly

## Troubleshooting

### Login Page Shows No Login Options

**Problem**: The login page is blank or shows "No authentication methods enabled"

**Solution**:

1. Verify `NEXT_PUBLIC_ENABLE_PASSWORD_AUTH` and/or `NEXT_PUBLIC_ENABLE_GITHUB_SSO` are set to `true`
2. If using Docker, ensure these variables are passed as **build arguments**
3. Rebuild the dashboard: `docker-compose up --build -d dashboard`

### UntrustedHost Error

**Problem**: Error message about untrusted host

**Solution**: The `trustHost: true` option is already configured in `dashboard/auth.ts`. If you still see this error:

1. Verify `NEXTAUTH_URL` matches your actual dashboard URL
2. Ensure the URL includes the protocol (`http://` or `https://`)

### GitHub OAuth Fails

**Problem**: GitHub login redirects but shows an error

**Solutions**:

1. Verify the callback URL in your GitHub OAuth App matches: `{NEXTAUTH_URL}/api/auth/callback/github`
2. Check that `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are correct
3. Ensure `ALLOWED_GITHUB_USERNAME` matches your GitHub username exactly (case-sensitive)
4. Verify `ENABLE_GITHUB_SSO` and `NEXT_PUBLIC_ENABLE_GITHUB_SSO` are both `true`

### Session Expires Too Quickly

**Problem**: Users are logged out frequently

**Solution**: The session is configured for 7 days. To change this, modify the `maxAge` value in `dashboard/auth.ts`:

```typescript
session: { 
  strategy: "jwt", 
  maxAge: 7 * 24 * 60 * 60  // 7 days in seconds
}
```

### Password Authentication Not Working

**Problem**: Correct password is rejected

**Solutions**:

1. Verify `DASHBOARD_PASSWORD` is set correctly
2. Check that `ENABLE_PASSWORD_AUTH` and `NEXT_PUBLIC_ENABLE_PASSWORD_AUTH` are both `true`
3. Ensure you're using username `admin` (hardcoded)
4. Rebuild if using Docker: `docker-compose up --build -d dashboard`

### Environment Variables Not Taking Effect

**Problem**: Changes to environment variables don't work

**Solutions**:

1. For `NEXT_PUBLIC_*` variables: Must rebuild the Docker image
2. For other variables: Restart the container is sufficient
3. Verify variables are set in the correct `.env` file
4. Check for typos in variable names

## Security Considerations

### Best Practices

1. **Strong Secrets**: Always use cryptographically secure random values for `NEXTAUTH_SECRET`
2. **Strong Passwords**: Use long, random passwords for `DASHBOARD_PASSWORD`
3. **HTTPS in Production**: Always use HTTPS for production deployments
4. **Secure Storage**: Never commit secrets to version control
5. **Regular Rotation**: Rotate secrets periodically
6. **Minimal Access**: Use GitHub OAuth allowlist to restrict access to specific users

### Environment Variable Security

- **Local Development**: Use `.env` file (already in `.gitignore`)
- **Docker**: Use `.env` file or Docker secrets
- **Render.com**: Use the dashboard's secret management (variables marked with `sync: false`)

### Session Security

- Sessions use JWT tokens stored in HTTP-only cookies
- Tokens are signed with `NEXTAUTH_SECRET`
- Sessions expire after 7 days of inactivity
- Cookies are not accessible via JavaScript (XSS protection)

### GitHub OAuth Security

- Only the specified GitHub username can log in
- OAuth tokens are handled by NextAuth.js
- Client secrets are never exposed to the browser
- Callback URLs are validated by GitHub

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
