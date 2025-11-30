# Authentication Quick Start Guide

Quick reference for setting up OpenMemory dashboard authentication.

## 🚀 Quick Setup (Local Development)

### 1. Generate Secret

```bash
openssl rand -base64 32
```

### 2. Update .env

```bash
# Required
NEXTAUTH_SECRET=<your-generated-secret>
NEXTAUTH_URL=http://localhost:3000

# Password Auth (recommended for local dev)
ENABLE_PASSWORD_AUTH=true
NEXT_PUBLIC_ENABLE_PASSWORD_AUTH=true
DASHBOARD_PASSWORD=your-secure-password

# GitHub OAuth (optional)
ENABLE_GITHUB_SSO=false
NEXT_PUBLIC_ENABLE_GITHUB_SSO=false
```

### 3. Start Dashboard

```bash
docker-compose up --build -d dashboard
```

### 4. Login

- Navigate to `http://localhost:3000`
- Username: `admin`
- Password: `<your-secure-password>`

## 🔐 Authentication Methods

| Method | Username | Password/Auth | Toggle Variables |
|--------|----------|---------------|------------------|
| **Password** | `admin` | `DASHBOARD_PASSWORD` | `ENABLE_PASSWORD_AUTH`<br>`NEXT_PUBLIC_ENABLE_PASSWORD_AUTH` |
| **GitHub OAuth** | GitHub username | GitHub OAuth flow | `ENABLE_GITHUB_SSO`<br>`NEXT_PUBLIC_ENABLE_GITHUB_SSO`<br>`AUTH_GITHUB_ID`<br>`AUTH_GITHUB_SECRET`<br>`ALLOWED_GITHUB_USERNAME` |

## 🔧 Common Tasks

### Enable GitHub OAuth

1. **Create GitHub OAuth App**: <https://github.com/settings/developers>
   - Callback URL: `http://localhost:3000/api/auth/callback/github`

2. **Update .env**:

   ```bash
   ENABLE_GITHUB_SSO=true
   NEXT_PUBLIC_ENABLE_GITHUB_SSO=true
   AUTH_GITHUB_ID=<your-client-id>
   AUTH_GITHUB_SECRET=<your-client-secret>
   ALLOWED_GITHUB_USERNAME=<your-github-username>
   ```

3. **Rebuild**:

   ```bash
   docker-compose up --build -d dashboard
   ```

### Disable Password Auth (GitHub Only)

```bash
ENABLE_PASSWORD_AUTH=false
NEXT_PUBLIC_ENABLE_PASSWORD_AUTH=false
ENABLE_GITHUB_SSO=true
NEXT_PUBLIC_ENABLE_GITHUB_SSO=true
```

Then rebuild: `docker-compose up --build -d dashboard`

### Enable Both Methods

```bash
ENABLE_PASSWORD_AUTH=true
NEXT_PUBLIC_ENABLE_PASSWORD_AUTH=true
ENABLE_GITHUB_SSO=true
NEXT_PUBLIC_ENABLE_GITHUB_SSO=true
```

Users can choose either method on the login page.

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Login page shows no options | Verify `NEXT_PUBLIC_*` variables are set and rebuild |
| Password rejected | Check `DASHBOARD_PASSWORD` is set, username is `admin` |
| GitHub OAuth fails | Verify callback URL, credentials, and allowed username |
| UntrustedHost error | Verify `NEXTAUTH_URL` matches your actual URL |

## 📚 Full Documentation

For detailed information, see [AUTHENTICATION.md](./AUTHENTICATION.md)

## 🔑 Environment Variables Checklist

### Required (All Deployments)

- [ ] `NEXTAUTH_SECRET` - Generated random secret
- [ ] `NEXTAUTH_URL` - Full dashboard URL

### Password Authentication

- [ ] `ENABLE_PASSWORD_AUTH` - `true` or `false`
- [ ] `NEXT_PUBLIC_ENABLE_PASSWORD_AUTH` - Must match above
- [ ] `DASHBOARD_PASSWORD` - Your password (if enabled)

### GitHub OAuth

- [ ] `ENABLE_GITHUB_SSO` - `true` or `false`
- [ ] `NEXT_PUBLIC_ENABLE_GITHUB_SSO` - Must match above
- [ ] `AUTH_GITHUB_ID` - GitHub OAuth Client ID (if enabled)
- [ ] `AUTH_GITHUB_SECRET` - GitHub OAuth Client Secret (if enabled)
- [ ] `ALLOWED_GITHUB_USERNAME` - GitHub username (if enabled)

## ⚠️ Important Notes

1. **Build Arguments**: `NEXT_PUBLIC_*` variables must be passed as Docker build arguments
2. **Rebuild Required**: Changes to `NEXT_PUBLIC_*` variables require rebuilding the image
3. **Security**: Never commit secrets to version control
4. **Production**: Always use HTTPS and strong secrets in production
