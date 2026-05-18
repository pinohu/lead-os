#!/bin/bash
# Automated Deployment to GitHub and Vercel

echo "🚀 Dynasty AI Dashboard - Automated Deployment"
echo "================================================"
echo ""

cd ~/dynasty-ai-dashboard

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GitHub token not found"
    echo ""
    echo "To deploy automatically, you need a GitHub Personal Access Token."
    echo ""
    echo "Quick setup:"
    echo "  1. Go to: https://github.com/settings/tokens/new"
    echo "  2. Name: 'Dynasty Dashboard Deploy'"
    echo "  3. Expiration: 90 days"
    echo "  4. Scopes: Select 'repo' (all)"
    echo "  5. Click 'Generate token'"
    echo "  6. Copy the token"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo "  bash DEPLOY-NOW.sh"
    echo ""
    exit 1
fi

# GitHub repository details
GITHUB_USER="pinohu"
REPO_NAME="dynasty-ai-dashboard"

echo "📝 Creating GitHub repository..."
echo ""

# Create repo using GitHub API
REPO_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Dynasty AI Stack - Unified monitoring dashboard\",
    \"private\": true,
    \"auto_init\": false
  }")

# Check if repo was created or already exists
if echo "$REPO_RESPONSE" | grep -q "\"name\": \"$REPO_NAME\""; then
    echo "✅ Repository created: $REPO_NAME"
elif echo "$REPO_RESPONSE" | grep -q "already exists"; then
    echo "✅ Repository already exists: $REPO_NAME"
else
    echo "⚠️  Repository creation response:"
    echo "$REPO_RESPONSE" | head -5
fi

echo ""
echo "📤 Pushing code to GitHub..."
echo ""

# Add remote if not exists
if ! git remote | grep -q origin; then
    git remote add origin https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git
else
    git remote set-url origin https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git
fi

# Push to GitHub
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code pushed to GitHub successfully!"
    echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
else
    echo "❌ Push failed. Check your GitHub token and permissions."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GitHub Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Repository: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Next: Deploy to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Vercel CLI is available
if command -v vercel &> /dev/null; then
    echo "Vercel CLI found! Deploying..."
    echo ""
    
    # Deploy to Vercel
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployed to Vercel successfully!"
        echo ""
        echo "Your dashboard is live!"
    fi
else
    echo "Vercel CLI not installed."
    echo ""
    echo "To deploy to Vercel:"
    echo ""
    echo "Option 1 - Install Vercel CLI and deploy:"
    echo "  npm i -g vercel"
    echo "  vercel login"
    echo "  vercel --prod"
    echo ""
    echo "Option 2 - Deploy via Vercel Dashboard (recommended):"
    echo "  1. Go to: https://vercel.com/new"
    echo "  2. Click 'Import Git Repository'"
    echo "  3. Select: $GITHUB_USER/$REPO_NAME"
    echo "  4. Framework Preset: Next.js"
    echo "  5. Add Environment Variables:"
    echo ""
    echo "     NEXTAUTH_URL=https://your-app.vercel.app"
    echo "     NEXTAUTH_SECRET=run: openssl rand -base64 32"
    echo "     ALLOWED_EMAILS=your-email@example.com"
    echo ""
    echo "     # Service URLs (update with your VM IP or Cloudflare URLs)"
    echo "     LANGFUSE_URL=http://YOUR-VM-IP:3000"
    echo "     ANYTHINGLLM_URL=http://YOUR-VM-IP:3001"
    echo "     OLLAMA_URL=http://YOUR-VM-IP:11434"
    echo "     QDRANT_URL=http://YOUR-VM-IP:6333"
    echo "     CHROMA_URL=http://YOUR-VM-IP:8000"
    echo "     SEARXNG_URL=http://YOUR-VM-IP:8080"
    echo ""
    echo "  6. Click 'Deploy'"
    echo ""
    echo "Your dashboard will be live in ~2 minutes!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Deploy to Vercel (if not done above)"
echo "2. Add environment variables in Vercel"
echo "3. Set up Cloudflare Tunnel for VM services:"
echo "   cd ~/ai-stack && sudo bash DEPLOY-TO-PUBLIC.sh"
echo "4. Update service URLs in Vercel with tunnel URLs"
echo "5. Redeploy in Vercel"
echo "6. Access your dashboard!"
echo ""
