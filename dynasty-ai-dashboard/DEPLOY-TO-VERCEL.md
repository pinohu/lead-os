# Deploy Dynasty AI Dashboard to Vercel

**Status:** ✅ Build successful, ready to deploy!

---

## Quick Deploy (5 minutes)

### Step 1: Create GitHub Repository

Option A - Using GitHub CLI:
```bash
cd ~/dynasty-ai-dashboard
gh repo create dynasty-ai-dashboard --private --source=. --remote=origin --push
```

Option B - Manual:
1. Go to https://github.com/new
2. Repository name: `dynasty-ai-dashboard`
3. Make it **Private**
4. Don't initialize with README (we already have code)
5. Click "Create repository"
6. Run:
```bash
cd ~/dynasty-ai-dashboard
git remote add origin https://github.com/pinohu/dynasty-ai-dashboard.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to **https://vercel.com**
2. Click **"Add New Project"**
3. Import your `dynasty-ai-dashboard` repository
4. Configure:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
# Required - Authentication
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secret-here-generate-below
ALLOWED_EMAILS=your-email@example.com

# Service URLs (you'll add these after Cloudflare Tunnel)
LANGFUSE_URL=http://YOUR-VM-IP:3000
ANYTHINGLLM_URL=http://YOUR-VM-IP:3001
OLLAMA_URL=http://YOUR-VM-IP:11434
QDRANT_URL=http://YOUR-VM-IP:6333
CHROMA_URL=http://YOUR-VM-IP:8000
SEARXNG_URL=http://YOUR-VM-IP:8080
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Deploy!

Click **"Deploy"** in Vercel.

Your dashboard will be live in ~2 minutes at:
**https://dynasty-ai-dashboard.vercel.app**

---

## Authentication

**How it works:**
- Enter your email on sign-in page
- If your email matches `ALLOWED_EMAILS`, you're signed in
- If not, access denied

**No magic links needed** - simplified for quick deployment!

---

## Connecting to Your VM Services

### Option A: Direct IP (Quick)

Use your VM's IP address in environment variables:
```env
LANGFUSE_URL=http://123.45.67.89:3000
```

**Requirements:**
- Vercel can reach your VM IP
- Ports are open
- Or use Tailscale/VPN

### Option B: Cloudflare Tunnel (Recommended)

Run on your VM:
```bash
cd ~/ai-stack
sudo bash DEPLOY-TO-PUBLIC.sh
```

Then use the tunnel URLs:
```env
LANGFUSE_URL=https://langfuse-dynasty.xxx.cfargotunnel.com
```

---

## Testing

1. Visit your Vercel URL
2. Enter your email from `ALLOWED_EMAILS`
3. Should redirect to dashboard
4. Check service status (will show offline until you configure service URLs)

---

## Troubleshooting

### Build Fails in Vercel
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Try redeploying

### Can't Sign In
- Verify `ALLOWED_EMAILS` matches exactly
- Check `NEXTAUTH_URL` is your Vercel URL
- Check `NEXTAUTH_SECRET` is set

### Services Show Offline
- Verify service URLs are correct
- Test URLs directly in browser
- Check VM services are running: `docker ps`
- If using Cloudflare Tunnel, verify it's running:
  `sudo systemctl status cloudflared-tunnel`

---

## Update Dashboard

After making changes:

```bash
cd ~/dynasty-ai-dashboard
# Make your changes
git add .
git commit -m "Update: description"
git push

# Vercel auto-deploys in ~30 seconds!
```

---

## Custom Domain (Optional)

In Vercel Dashboard → Settings → Domains:
1. Add your domain: `ai.dynasty-empire.com`
2. Configure DNS as instructed
3. SSL certificate auto-generated

---

## Next Steps

1. ✅ Dashboard deployed
2. Set up Cloudflare Tunnel for service URLs
3. Add production service URLs to Vercel env vars
4. Redeploy to apply new URLs
5. Access your dashboard from anywhere!

---

**Ready to deploy?**

```bash
# If you have gh CLI:
gh repo create dynasty-ai-dashboard --private --source=. --remote=origin --push

# Then go to vercel.com and import!
```
