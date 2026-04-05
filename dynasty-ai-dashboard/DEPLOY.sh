#!/bin/bash
# Dynasty AI Dashboard - Deployment Script

echo "🚀 Dynasty AI Dashboard Deployment"
echo "===================================="
echo ""

cd ~/dynasty-ai-dashboard

echo "📦 Step 1: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "🔧 Step 2: Creating .env.local for testing..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your actual values"
    echo "   nano .env.local"
else
    echo "✅ .env.local already exists"
fi
echo ""

echo "🧪 Step 3: Testing build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - check errors above"
    exit 1
fi
echo ""

echo "📝 Step 4: Initializing git repository..."
if [ ! -d .git ]; then
    git init
    git add .
    git commit -m "Initial commit - Dynasty AI Dashboard

- Next.js 14 with TypeScript
- Email authentication (NextAuth)
- Real-time service monitoring
- Cost tracking dashboard
- Agent activity monitor
- Ready for Vercel deployment"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Dashboard Ready for Deployment!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "1. Create GitHub repository:"
echo "   gh repo create dynasty-ai-dashboard --private --source=. --remote=origin"
echo "   (or create manually at https://github.com/new)"
echo ""
echo "2. Push to GitHub:"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/pinohu/dynasty-ai-dashboard.git"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   • Go to https://vercel.com"
echo "   • Click 'Add New Project'"
echo "   • Import your GitHub repository"
echo "   • Add environment variables (see .env.example)"
echo "   • Click 'Deploy'"
echo ""
echo "4. Set up Cloudflare Tunnel (if not done):"
echo "   cd ~/ai-stack"
echo "   sudo bash DEPLOY-TO-PUBLIC.sh"
echo ""
echo "Your dashboard will be live at:"
echo "  https://dynasty-ai-dashboard.vercel.app"
echo "  (or your custom domain)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Local Development:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To test locally:"
echo "  npm run dev"
echo "  Open http://localhost:3000"
echo ""
