# Dynasty AI Dashboard - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install & Configure (2 min)
```bash
cd dashboard
npm install
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 2. Start Development Server (1 min)
```bash
npm run dev
```

Dashboard is now running at: **http://localhost:3000**

### 3. Explore the Dashboard (2 min)
- 📊 **Dashboard** - Overview of all metrics
- 🔧 **Services** - Real-time service status
- 💰 **Costs** - Cost tracking & analysis
- 🤖 **Agents** - Agent activity monitor
- 📚 **Knowledge Base** - Documentation
- ⚙️ **Settings** - Configure alerts

---

## 📋 System Requirements

- **Node.js**: 18+ (check with `node --version`)
- **npm**: 8+ (check with `npm --version`)
- **API Server**: Running and accessible (default: http://localhost:3000)
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)

---

## 🔌 API Integration

The dashboard automatically connects to these endpoints:

```
/api/dashboard              - Main dashboard state
/api/services/status        - Service health checks
/api/costs                  - Cost tracking metrics
/api/costs/trend            - Historical cost trends
/api/costs/breakdown        - Cost breakdown by type
/api/agents/activity        - Agent sessions
/api/knowledge-base         - Memory and docs
/api/settings               - User preferences
/api/dashboard/stream       - Real-time updates (SSE)
```

If your API has different base URL or port, update `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://api.example.com:8080
```

---

## 🧪 Test API Integration

Once your API is running, test connectivity:

```bash
node scripts/test-integration.js
```

This runs integration tests against all API endpoints.

---

## 📦 Production Build

```bash
npm run build   # Build for production
npm start       # Start production server
```

Production build available at: **http://localhost:3000**

---

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t dynasty-dashboard:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://api:3000 \
  dynasty-dashboard:latest
```

---

## 📚 Key Features

### Real-Time Monitoring
- ✅ Live service status updates
- ✅ Real-time cost tracking
- ✅ Agent heartbeat monitoring
- ✅ Streaming updates (SSE)

### Analytics & Visualizations
- ✅ Cost trend charts (30-day history)
- ✅ Cost breakdown by type
- ✅ Service uptime metrics
- ✅ Agent task counters

### Configuration
- ✅ Customizable alert thresholds
- ✅ Alert channel selection
- ✅ Theme preferences (Light/Dark)
- ✅ Auto-refresh frequency

### User Experience
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support
- ✅ Real-time notifications
- ✅ Auto-refresh capability

---

## ⌨️ Keyboard Shortcuts

- `Escape` - Close modals/menus
- `?` - Show help (planned)
- `Ctrl/Cmd + K` - Search (planned)

---

## 🔍 Troubleshooting

### Dashboard Won't Load?

1. **Check API URL**
   ```bash
   curl http://localhost:3000/api/dashboard
   ```
   
2. **Check environment variable**
   ```bash
   cat .env.local | grep API_BASE_URL
   ```

3. **Clear cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

### API Connection Issues?

1. **Verify API is running**
   - Check if API server is started on the configured port

2. **Check CORS headers**
   - Ensure API allows requests from http://localhost:3000

3. **Check browser console**
   - Open DevTools (F12) and check Console tab for errors

### Build Fails?

```bash
# Clear and rebuild
rm -rf node_modules .next
npm install
npm run build
```

---

## 📖 Documentation

- **[README.md](README.md)** - Complete feature overview
- **[INTEGRATION_TESTING.md](INTEGRATION_TESTING.md)** - API testing guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)** - Project summary

---

## 🎯 Next Steps

1. ✅ Start development server (`npm run dev`)
2. ✅ Access dashboard at http://localhost:3000
3. ✅ Configure API URL in `.env.local`
4. ✅ Test API integration (`node scripts/test-integration.js`)
5. ✅ Explore all pages and features
6. ✅ Review settings and configure alerts
7. ✅ Deploy to production (see DEPLOYMENT.md)

---

## 💡 Pro Tips

### Enable Dark Mode
- Click profile icon (top right)
- Select theme preference
- Setting is auto-saved

### Configure Auto-Refresh
1. Go to Settings page
2. Set "Update Frequency" (10s - 10m)
3. Toggle "Auto-Refresh" to enable
4. Changes saved automatically

### Set Alert Thresholds
1. Go to Settings page
2. Adjust threshold sliders
3. Select alert channels (Email/In-App/Slack)
4. Click "Save Settings"

### Monitor Real-Time Updates
- Look for "Live" indicator in header
- Real-time events appear in Agent Activity
- Check browser console for event details

---

## 📞 Support

Having issues? Check:

1. **Logs**: Browser console (F12)
2. **Network**: DevTools Network tab
3. **Configuration**: `.env.local` file
4. **Documentation**: See docs folder
5. **API Health**: Test endpoint manually with curl

---

## 🎓 Learn More

### Architecture
- **Frontend**: Next.js 14 + React 18
- **Styling**: Tailwind CSS + custom components
- **State**: Zustand + React Query
- **Charts**: Recharts
- **Type Safety**: TypeScript

### Key Technologies
- Next.js 14 (App Router compatible)
- React 18 with Hooks
- Tailwind CSS 3+
- Recharts for data visualization
- React Query for server state
- Zustand for global state

---

## ✨ Features at a Glance

| Page | Features |
|------|----------|
| **Dashboard** | Service status, Cost overview, Agent activity |
| **Services** | Detailed status cards, Uptime tracking, Response times |
| **Costs** | Budget tracking, Trend charts, Cost alerts |
| **Agents** | Live sessions, Task counters, Heartbeats |
| **Knowledge Base** | Memory content, Documentation, Search |
| **Settings** | Alert thresholds, Channels, Preferences |

---

## 🚀 Ready to Deploy?

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for:
- Vercel deployment
- Docker setup
- Traditional hosting
- SSL/HTTPS configuration
- Performance optimization
- Monitoring setup

---

## 🎉 You're All Set!

The dashboard is ready to use. Start exploring and monitoring your Dynasty AI infrastructure! 

Questions? Check the documentation or review the source code comments.

**Happy monitoring! 🎯**
