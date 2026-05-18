# Dynasty AI Dashboard - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Access to API server
- Environment variables configured

## Local Development Setup

### 1. Install Dependencies
```bash
cd dashboard
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

Dashboard available at: http://localhost:3000

## Production Build

### 1. Build for Production
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Verify Build
```bash
# Check for build errors
npm run build 2>&1 | grep -i error

# Test production build locally
npm start
# Visit http://localhost:3000
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is optimized for Next.js applications.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_BASE_URL

# View dashboard
vercel logs
```

### Option 2: Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

#### Build & Run
```bash
# Build image
docker build -t dynasty-dashboard:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://api:3000 \
  dynasty-dashboard:latest
```

#### Docker Compose
```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://api:3000
    depends_on:
      - api

  api:
    image: dynasty-api:latest
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgres://...
```

### Option 3: Traditional Hosting

#### Static Export
```bash
# Add to next.config.js
module.exports = {
  output: 'export',
}

# Build static files
npm run build

# Upload 'out' directory to static hosting
```

#### Node.js Server (AWS EC2, DigitalOcean, etc.)
```bash
# SSH into server
ssh user@server-ip

# Clone repository
git clone https://github.com/dynasty/dashboard.git
cd dashboard

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "dashboard" -- start
pm2 save
pm2 startup

# Configure reverse proxy (Nginx)
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name dashboard.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE support
    location /api/dashboard/stream {
        proxy_pass http://localhost:3000;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

## Environment Configuration

### Required Variables
```env
NEXT_PUBLIC_API_BASE_URL=http://api.example.com
```

### Optional Variables
```env
NEXT_PUBLIC_ANALYTICS_ID=UA-XXXXX-X
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_STREAMING=true
NODE_ENV=production
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Certbot
```bash
sudo apt-get install certbot python3-certbot-nginx

sudo certbot certonly --nginx -d dashboard.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.example.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.example.com/privkey.pem;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name dashboard.example.com;
    return 301 https://$server_name$request_uri;
}
```

## Performance Optimization

### 1. Enable Caching
```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Enable Compression
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/javascript;
gzip_min_length 1000;
gzip_vary on;
```

### 3. Enable HTTP/2
```nginx
listen 443 ssl http2;
```

### 4. Image Optimization
```bash
# Install sharp for image optimization
npm install sharp

# Images are automatically optimized by Next.js
```

## Monitoring

### Application Monitoring
```bash
# PM2 Monitoring
pm2 monit

# View logs
pm2 logs dashboard
```

### Server Monitoring
```bash
# CPU, Memory, Network
top
htop

# Disk usage
df -h

# Monitor API calls
tail -f /var/log/nginx/access.log | grep api
```

### Uptime Monitoring
Set up external monitoring:
- Datadog
- New Relic
- Sentry (error tracking)
- CloudFlare (DDoS protection)

## Backup & Recovery

### Backup Environment Files
```bash
# Backup .env.local
cp .env.local .env.backup

# Store in secure location
# Never commit to git
```

### Database Backups (if needed)
```bash
# Automated daily backup
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/dashboard-$(date +\%Y-\%m-\%d).sql.gz
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Dashboard

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Rollback Procedure

### Rollback to Previous Version
```bash
# Check deployment history
vercel ls

# Rollback
vercel rollback

# Or manually
git revert HEAD
npm run build
npm start
```

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### API Connection Fails
```bash
# Check API_BASE_URL in .env.local
echo $NEXT_PUBLIC_API_BASE_URL

# Test API endpoint
curl $NEXT_PUBLIC_API_BASE_URL/api/dashboard

# Check CORS headers
```

#### Memory Issues
```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm start

# Monitor memory
node --expose-gc app.js
```

## Health Checks

### Endpoint Health
```bash
# Health check endpoint
curl http://dashboard.example.com/api/health

# API connectivity
curl http://dashboard.example.com/api/dashboard
```

### Uptime Monitoring Script
```bash
#!/bin/bash
while true; do
  STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://dashboard.example.com)
  if [ $STATUS -ne 200 ]; then
    echo "Dashboard is down: HTTP $STATUS"
    # Send alert
  fi
  sleep 300  # Check every 5 minutes
done
```

## Performance Metrics

### Track Key Metrics
- Page load time
- Time to first contentful paint (FCP)
- Largest contentful paint (LCP)
- API response times
- Real-time event latency
- Memory usage
- CPU usage

### Enable Analytics
```bash
# Add to next.config.js
analytics: {
  enabled: true,
}
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables not in code
- [ ] API keys secured
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] XSS protection enabled
- [ ] CSRF tokens validated
- [ ] Regular security updates

## Post-Deployment

1. **Verify Functionality**
   - Test all pages load
   - Check API connectivity
   - Verify real-time updates
   - Test on mobile devices

2. **Monitor Performance**
   - Check page load times
   - Monitor API response times
   - Track error rates
   - Watch memory usage

3. **Update Documentation**
   - Record deployment details
   - Update runbooks
   - Document any customizations

4. **Communicate Status**
   - Notify team of deployment
   - Update status pages
   - Log deployment details

## Support

For deployment issues, check:
1. Application logs
2. Server logs
3. API connectivity
4. Environment configuration
5. Browser console errors

Contact the team for additional support.
