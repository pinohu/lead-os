# Complete Deployment Instructions

**Time:** 10 minutes  
**Difficulty:** Easy (just clicking buttons)

---

## Method 1: GitHub Web UI + Vercel (Recommended)

### Step 1: Create GitHub Repository (2 min)

1. Go to: **https://github.com/new**

2. Fill in:
   - Repository name: `dynasty-ai-dashboard`
   - Description: `Dynasty AI Stack monitoring dashboard`
   - **Private** (important - check this box)
   - **Do NOT** check "Initialize with README"

3. Click **"Create repository"**

4. **On the next page, scroll down to "…or push an existing repository from the command line"**

5. **Copy the commands** and run on your VM:
   ```bash
   cd ~/dynasty-ai-dashboard
   git remote add origin https://github.com/pinohu/dynasty-ai-dashboard.git
   git push -u origin main
   ```

6. You'll be prompted for credentials:
   - Username: `pinohu`
   - Password: **Use a Personal Access Token** (not your password)
   
7. **If you don't have a token, create one:**
   - Go to: https://github.com/settings/tokens/new
   - Name: `Dynasty Dashboard`
   - Expiration: `90 days`
   - Scopes: Check **`repo`** (all sub-boxes)
   - Click **"Generate token"**
   - **Copy the token** (you won't see it again!)
   - Use this as your password when pushing

8. Push completes → ✅ Code is on GitHub!

---

### Step 2: Deploy to Vercel (3 min)

1. Go to: **https://vercel.com**

2. **Sign in** (or create account)
   - Recommended: Sign in with GitHub

3. Click **"Add New Project"**

4. **Import Repository:**
   - You should see `dynasty-ai-dashboard` in the list
   - Click **"Import"** next to it

5. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

6. **Add Environment Variables** (click "Environment Variables"):

   **Required (add these now):**
   ```
   NEXTAUTH_URL
   Value: https://dynasty-ai-dashboard.vercel.app
   
   NEXTAUTH_SECRET
   Value: (generate by running: openssl rand -base64 32)
   
   ALLOWED_EMAILS
   Value: your-email@example.com
   ```

   **Service URLs (add after Cloudflare Tunnel):**
   ```
   LANGFUSE_URL
   Value: http://YOUR-VM-IP:3000
   
   ANYTHINGLLM_URL
   Value: http://YOUR-VM-IP:3001
   
   OLLAMA_URL
   Value: http://YOUR-VM-IP:11434
   
   QDRANT_URL
   Value: http://YOUR-VM-IP:6333
   
   CHROMA_URL
   Value: http://YOUR-VM-IP:8000
   
   SEARXNG_URL
   Value: http://YOUR-VM-IP:8080
   ```

7. Click **"Deploy"**

8. **Wait ~2 minutes** while Vercel builds and deploys

9. **Success!** You'll see:
   - "Congratulations!" message
   - Your dashboard URL: `https://dynasty-ai-dashboard.vercel.app`

---

### Step 3: Test Your Dashboard (1 min)

1. Click the deployment URL

2. You should see the sign-in page

3. Enter your email (from `ALLOWED_EMAILS`)

4. You should be redirected to the dashboard

5. Service status will show "offline" until you add service URLs

---

### Step 4: Set Up Cloudflare Tunnel (Optional, 10 min)

**Why:** Makes your VM services securely accessible from anywhere

1. On your VM:
   ```bash
   cd ~/ai-stack
   sudo bash DEPLOY-TO-PUBLIC.sh
   ```

2. Follow the prompts to:
   - Install cloudflared
   - Authenticate with Cloudflare
   - Create tunnel

3. **You'll get URLs like:**
   ```
   https://langfuse-dynasty.xxx.cfargotunnel.com
   https://knowledge-dynasty.xxx.cfargotunnel.com
   ```

4. **Update Vercel environment variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update the service URLs with your Cloudflare Tunnel URLs
   - Click "Save"

5. **Redeploy:**
   - Go to Deployments tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"

6. **Done!** Services should now show "online" in your dashboard

---

## Method 2: Automated Script (Requires GitHub Token)

If you prefer automation:

1. **Create GitHub Token:**
   - https://github.com/settings/tokens/new
   - Scopes: `repo` (all)
   - Copy token

2. **Run script:**
   ```bash
   cd ~/dynasty-ai-dashboard
   export GITHUB_TOKEN=your_token_here
   bash DEPLOY-NOW.sh
   ```

3. **Then deploy to Vercel manually** (steps from Method 1)

---

## Troubleshooting

### "Failed to push to GitHub"
- Check your Personal Access Token has `repo` scope
- Use token as password (not your GitHub password)
- Try: `git remote set-url origin https://TOKEN@github.com/pinohu/dynasty-ai-dashboard.git`

### "Build failed in Vercel"
- Check build logs in Vercel dashboard
- Ensure `NEXTAUTH_SECRET` is set
- Try redeploying

### "Can't sign in"
- Verify `ALLOWED_EMAILS` matches your email exactly
- Check `NEXTAUTH_URL` is your Vercel URL
- Look at Function logs in Vercel

### "Services show offline"
- Add service URLs to environment variables
- Or set up Cloudflare Tunnel
- Redeploy after adding variables

---

## After Deployment

### Access Your Dashboard
**URL:** https://dynasty-ai-dashboard.vercel.app

### Update Dashboard
```bash
cd ~/dynasty-ai-dashboard
# Make changes
git add .
git commit -m "Update: description"
git push
# Vercel auto-deploys in ~30 seconds!
```

### Add Custom Domain
1. Vercel Dashboard → Settings → Domains
2. Add: `ai.dynasty-empire.com`
3. Configure DNS as shown
4. SSL auto-configured

---

## What You'll Have

- ✅ Unified dashboard for all AI Stack services
- ✅ Access from anywhere (mobile, desktop, any device)
- ✅ Real-time cost tracking
- ✅ Agent activity monitoring
- ✅ Secure (only your email)
- ✅ Auto-deploys from GitHub
- ✅ Free hosting

---

## Need Help?

**Got stuck?** Show me:
1. What step you're on
2. Any error messages
3. Screenshots if helpful

I'll help you through it!

---

**Ready?** Start with Method 1, Step 1: https://github.com/new
