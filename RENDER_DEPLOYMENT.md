# OpenMemory Render Deployment Guide

Complete guide to deploying your OpenMemory fork (with PostgreSQL + pgvector and Dashboard) to Render.

## 📋 Prerequisites

- GitHub account with your OpenMemory fork
- Render account (free to create at <https://render.com>)
- ~10 minutes for deployment

## 💰 Cost Breakdown

| Service | Plan | Cost/Month | Region |
|---------|------|------------|--------|
| PostgreSQL (with pgvector) | Starter | $7 | Frankfurt (EU) |
| Backend API | Starter | $7 | Frankfurt (EU) |
| Dashboard | Starter | $7 | Frankfurt (EU) |
| **Total** | | **~$21/month** | |

> **Note**: You can use the free tier for backend/dashboard during testing, but PostgreSQL requires the paid Starter tier ($7/month) for pgvector support. All services are deployed in the **Frankfurt region** for optimal European latency.

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

1. **Commit and push** your changes to GitHub:

   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Verify** your repository includes:
   - ✅ Updated `render.yaml`
   - ✅ `dashboard/Dockerfile`
   - ✅ `dashboard/next.config.ts` (with `output: 'standalone'`)
   - ✅ `dashboard/.dockerignore`

### Step 2: Deploy to Render

1. **Go to Render Dashboard**: <https://dashboard.render.com>

2. **Click "New +"** → **"Blueprint"**

3. **Connect your GitHub repository**:
   - Select your OpenMemory fork
   - Grant Render access if prompted

4. **Render will detect** `render.yaml` and show:
   - ✅ openmemory-db (PostgreSQL)
   - ✅ openmemory-backend (Web Service)
   - ✅ openmemory-dashboard (Web Service)

5. **Click "Apply"** to start deployment

### Step 3: Enable pgvector Extension

After PostgreSQL is created:

1. **Go to** your `openmemory-db` service in Render

2. **Click "Shell"** to open database console

3. **Run this SQL**:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. **Verify** it worked:

   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

### Step 4: Generate and Set API Key

1. **Generate a secure API key** on your local machine:

   ```bash
   openssl rand -base64 32
   ```

   Example output: `xK9mP2vL8nQ4rT6wY1zB3cD5fG7hJ9kM0oP2qR4sT6u=`

2. **In Render Dashboard**:
   - Go to `openmemory-backend` service
   - Click **"Environment"** tab
   - Find `OM_API_KEY` variable
   - Click **"Edit"** and paste your generated key
   - Click **"Save Changes"**

3. **Save this API key securely** - you'll need it to connect your AI tools!

### Step 5: Update Dashboard URL (Optional)

If your dashboard URL is different from the default:

1. Go to `openmemory-backend` service
2. Edit `OM_IDE_ALLOWED_ORIGINS` environment variable
3. Replace `https://openmemory-dashboard.onrender.com` with your actual dashboard URL
4. Save changes

### Step 6: Verify Deployment

1. **Check Backend Health**:
   - Visit: `https://openmemory-backend.onrender.com/health`
   - Should return: `{"ok":true,...}`

2. **Check Dashboard**:
   - Visit: `https://openmemory-dashboard.onrender.com`
   - Should load the OpenMemory dashboard UI

3. **Test API with curl**:

   ```bash
   curl -H "X-API-Key: YOUR_API_KEY_HERE" \
        https://openmemory-backend.onrender.com/memory/all?l=5
   ```

---

## 🔧 Configuration

### Environment Variables

All configuration is done via environment variables in Render. Key variables:

#### Security

- `OM_API_KEY` - **REQUIRED** - Your secret API key (set manually)
- `OM_RATE_LIMIT_ENABLED` - Enable rate limiting (default: true)
- `OM_RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

#### Embeddings

- `OM_EMBEDDINGS` - Provider: `synthetic`, `openai`, `gemini`, `ollama`
- `OPENAI_API_KEY` - If using OpenAI embeddings (set manually)

#### Database

- `OM_METADATA_BACKEND` - Always `postgres` for Render
- `OM_VECTOR_BACKEND` - Always `pgvector` for Render
- Database credentials auto-populated by Render

### Using OpenAI Embeddings (Optional)

For better semantic search quality:

1. Get an OpenAI API key from <https://platform.openai.com>
2. In Render, edit `openmemory-backend` environment:
   - Set `OM_EMBEDDINGS` to `openai`
   - Set `OPENAI_API_KEY` to your key
   - Set `OM_TIER` to `deep` (for best results)
3. Save and redeploy

---

## 🔌 Connecting AI Tools

### Cline (VS Code Extension)

1. **Create/edit** `.vscode/mcp.json` in your project:

   ```json
   {
     "mcpServers": {
       "openmemory": {
         "type": "http",
         "url": "https://openmemory-backend.onrender.com/mcp",
         "headers": {
           "X-API-Key": "YOUR_API_KEY_HERE"
         }
       }
     }
   }
   ```

2. **Restart Cline** - it will now have access to OpenMemory tools

### Claude Desktop

1. **Locate config file**:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add OpenMemory**:

   ```json
   {
     "mcpServers": {
       "openmemory": {
         "command": "curl",
         "args": [
           "-X", "POST",
           "-H", "Content-Type: application/json",
           "-H", "X-API-Key: YOUR_API_KEY_HERE",
           "https://openmemory-backend.onrender.com/mcp"
         ]
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### ChatGPT (Custom GPT)

1. **Create a Custom GPT** in ChatGPT
2. **Add Actions** with this OpenAPI schema:

   ```yaml
   openapi: 3.0.0
   info:
     title: OpenMemory API
     version: 1.0.0
   servers:
     - url: https://openmemory-backend.onrender.com
   paths:
     /memory/add:
       post:
         summary: Store a new memory
         security:
           - ApiKeyAuth: []
         requestBody:
           required: true
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   content:
                     type: string
                   tags:
                     type: array
                     items:
                       type: string
                   user_id:
                     type: string
         responses:
           '200':
             description: Memory stored successfully
     /memory/query:
       post:
         summary: Search memories
         security:
           - ApiKeyAuth: []
         requestBody:
           required: true
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   query:
                     type: string
                   k:
                     type: integer
                   user_id:
                     type: string
         responses:
           '200':
             description: Search results
   components:
     securitySchemes:
       ApiKeyAuth:
         type: apiKey
         in: header
         name: X-API-Key
   ```

3. **Set API Key** in Custom GPT settings

---

## 🔒 Security Best Practices

### API Key Management

✅ **DO:**

- Generate strong, random API keys (32+ characters)
- Store API keys in environment variables (never in code)
- Use different API keys for dev/staging/production
- Rotate API keys periodically

❌ **DON'T:**

- Commit API keys to git
- Share API keys in plain text
- Use simple/guessable API keys
- Reuse API keys across services

### Rate Limiting

The default configuration allows:

- **100 requests per minute** per API key
- Automatic blocking of excessive requests
- Rate limit headers in responses

To adjust:

```yaml
OM_RATE_LIMIT_MAX_REQUESTS: "200"  # Increase limit
OM_RATE_LIMIT_WINDOW_MS: "60000"   # 1 minute window
```

### Database Security

- ✅ PostgreSQL password auto-generated by Render
- ✅ Database only accessible from Render services (private network)
- ✅ SSL/TLS encryption enforced (`OM_PG_SSL: require`)
- ✅ Automatic backups enabled

---

## 📊 Monitoring

### Health Checks

- **Backend**: `https://openmemory-backend.onrender.com/health`
- **Dashboard**: `https://openmemory-dashboard.onrender.com`

### Logs

View logs in Render Dashboard:

1. Go to your service
2. Click **"Logs"** tab
3. Real-time log streaming

### Metrics

Render provides:

- CPU usage
- Memory usage
- Request count
- Response times

---

## 🐛 Troubleshooting

### Backend won't start

**Check:**

1. PostgreSQL is healthy and running
2. `OM_API_KEY` is set
3. Database connection variables are correct
4. Logs for specific error messages

### Dashboard can't connect to backend

**Check:**

1. `NEXT_PUBLIC_API_URL` points to correct backend URL
2. CORS is configured (`OM_IDE_ALLOWED_ORIGINS`)
3. Backend is healthy and responding

### pgvector extension not working

**Solution:**

```sql
-- Connect to database shell and run:
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify:
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Rate limit errors

**Increase limits** in backend environment:

```yaml
OM_RATE_LIMIT_MAX_REQUESTS: "200"
```

---

## 🔄 Updates and Maintenance

### Deploying Updates

1. **Push changes** to GitHub:

   ```bash
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```

2. **Auto-deploy** is enabled - Render will automatically deploy

3. **Manual deploy** (if needed):
   - Go to service in Render
   - Click **"Manual Deploy"** → **"Deploy latest commit"**

### Database Backups

Render automatically backs up PostgreSQL:

- **Daily backups** retained for 7 days
- **Manual backups** available anytime
- **Point-in-time recovery** available

To create manual backup:

1. Go to `openmemory-db` service
2. Click **"Backups"** tab
3. Click **"Create Backup"**

---

## 💡 Tips & Optimization

### Performance

1. **Use OpenAI embeddings** for better search quality:

   ```yaml
   OM_EMBEDDINGS: openai
   OM_TIER: deep
   ```

2. **Enable Redis caching** (uncomment in render.yaml):
   - Faster repeated queries
   - Reduced database load
   - +$1/month cost

3. **Upgrade to Standard plan** for better performance:
   - More CPU/RAM
   - Faster response times
   - Better for high traffic

### Cost Optimization

- **Free tier** for testing (backend + dashboard)
- **Starter tier** for production ($7 each)
- **Standard tier** for high traffic ($25 each)

### Scaling

Render auto-scales within plan limits. For high traffic:

1. Upgrade to Standard/Pro plan
2. Enable horizontal scaling
3. Add Redis for caching
4. Consider CDN for dashboard

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [OpenMemory GitHub](https://github.com/CaviraOSS/OpenMemory)
- [MCP Protocol](https://modelcontextprotocol.io)
- [PostgreSQL + pgvector](https://github.com/pgvector/pgvector)

---

## 🆘 Support
