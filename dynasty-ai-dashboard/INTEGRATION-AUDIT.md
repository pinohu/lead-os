# Dashboard Integration Audit

**Status:** Auth working ✅ | UI complete ✅ | Backend integrations **PENDING**

## What's Working
- ✅ Authentication (polycarpohu@gmail.com)
- ✅ Dashboard UI layout
- ✅ Service status cards (UI)
- ✅ Cost tracking cards (UI)
- ✅ Agent activity list (UI)

## What's Missing (Mock Data Currently)

### 1. Service Status Endpoints
**Location:** `/api/services/status`

**Required Services:**
- Languase - Clawdbot language model service
- Anythinglin - Domain service monitor
- Oliama - AI model provider
- Odrant - Vector database
- Chroma - Vector database
- Searxng - Search service

**Integration needed:**
```typescript
// /app/api/services/status/route.ts
- Ping each service
- Return { status: 'online' | 'offline', latency: ms }
- Cache results for 30s
```

### 2. Cost Tracking Data
**Current:** Mock data ($5.42 today, $152.34/month)

**Sources to integrate:**
- Clawdbot session metrics → `/api/session-metrics`
- Anthropic API usage → Query `/api/usage`
- n8n workflow costs → Pull from n8n at http://172.20.192.47:30678
- Vercel costs → Vercel API

**Integration:**
```typescript
// /app/api/cost-tracking/route.ts
- Fetch costs from all sources
- Aggregate by day/month
- Compare vs budget targets
```

### 3. Agent Activity (Heartbeats)
**Current:** Mock agent list (Flint, ContentBot, LeadBot, etc.)

**Source:**
- Clawdbot sessions list → `sessions_list()`
- Filter by active/heartbeat
- Show last activity timestamp

**Integration:**
```typescript
// /app/api/agent-activity/route.ts
- Query Clawdbot sessions
- Return recent activity
- Real-time updates via WebSocket
```

### 4. Knowledge Base
**Current:** Stub page

**Should link to:**
- `/memory/` documents
- `MEMORY.md` summaries
- Agent docs
- Skill references

### 5. Settings Panel
**Current:** Stub

**Should include:**
- Alert thresholds
- Budget limits
- Service whitelist
- Notification channels

## Priority Fix Order

1. **HIGH:** Service Status API (10 min)
   - Implement `/api/services/status`
   - Test with real services
   
2. **HIGH:** Cost Tracking API (15 min)
   - Pull real Clawdbot metrics
   - Connect n8n costs
   
3. **MEDIUM:** Agent Activity API (10 min)
   - Real session data
   - Live heartbeat view
   
4. **MEDIUM:** Knowledge Base (20 min)
   - Link to memory files
   - Search implementation
   
5. **LOW:** Settings UI (30 min)
   - Config forms
   - Persistence layer

## Next Steps

**Assign to:** devbot (backend API development)

**Deliverable:** All APIs functional and returning real data by EOD

**Test:** Each endpoint independently, then full dashboard load test
