# Dynasty AI Dashboard - API Reference

**Status:** ✅ All backend APIs implemented and deployed

## Endpoints

### 1. Dashboard (Comprehensive State)
**GET** `/api/dashboard`

Returns complete dashboard state including services, costs, agents, and system health.

**Response:**
```json
{
  "timestamp": "2026-02-19T16:30:00Z",
  "services": [
    { "name": "Clawdbot Gateway", "status": "online", "latency": 45 }
  ],
  "costs": {
    "today": 5.42,
    "thisMonth": 152.34,
    "monthlyTarget": 300,
    "savings": 2847.66
  },
  "agents": [
    {
      "name": "Flint (CTO)",
      "status": "active",
      "lastActive": "just now",
      "tasksToday": 47
    }
  ],
  "health": {
    "uptime": 3600,
    "memory": {...}
  }
}
```

### 2. Real-Time Streaming
**GET** `/api/dashboard/stream`

Server-Sent Events stream of dashboard updates every 5 seconds.

**Usage (Frontend):**
```javascript
const eventSource = new EventSource('/api/dashboard/stream');
eventSource.onmessage = (event) => {
  const dashboardData = JSON.parse(event.data);
  updateUI(dashboardData);
};
```

### 3. Service Status
**GET** `/api/services/status`

Health checks for all configured services.

**Response:**
```json
{
  "status": "all-healthy",
  "onlineCount": 8,
  "totalCount": 8,
  "services": [
    {
      "name": "Clawdbot Gateway",
      "url": "http://localhost:18789",
      "status": "online",
      "latency": 45,
      "timestamp": "2026-02-19T16:30:00Z"
    }
  ]
}
```

**Monitored Services:**
- Clawdbot Gateway (http://localhost:18789)
- n8n (http://172.20.192.47:30678)
- Languase
- Anythinglin
- Oliama
- Odrant
- Chroma
- Searxng

### 4. Cost Tracking
**GET** `/api/costs`

Real cost metrics from Clawdbot sessions and model usage.

**Response:**
```json
{
  "today": 5.42,
  "thisMonth": 152.34,
  "monthlyTarget": 300,
  "monthlyBudget": 500,
  "projectedMonthly": 162.60,
  "budgetStatus": "under-budget",
  "savings": {
    "description": "80% reduction from model optimization",
    "amount": 2847.66,
    "period": "monthly"
  },
  "costBreakdown": {
    "claude-3-5-sonnet-20241022": 3.50,
    "claude-3-5-haiku-20241022": 1.20,
    "other": 0.72
  },
  "dailyTrend": {
    "2026-02-19": 5.42,
    "2026-02-18": 4.88,
    ...
  },
  "timestamp": "2026-02-19T16:30:00Z"
}
```

**Cost Calculation:**
- Fetches all Clawdbot sessions
- Calculates cost per session based on model + tokens
- Models tracked:
  - Claude 3.5 Sonnet: $3/$15 per M tokens
  - Claude 3.5 Haiku: $0.8/$4 per M tokens (5x cheaper!)
  - Claude Sonnet 4.5: $3/$15 per M tokens

### 5. Agent Activity (Real-Time)
**GET** `/api/agents/activity`

Live activity of all agents and workers.

**Response:**
```json
{
  "totalAgents": 26,
  "activeNow": 3,
  "lastUpdate": "2026-02-19T16:30:00Z",
  "agents": [
    {
      "id": "agent:main:main",
      "name": "Flint (CTO)",
      "type": "agent",
      "status": "active",
      "lastActive": "just now",
      "model": "claude-3-5-sonnet-20241022",
      "tokens": 66286,
      "tasks": 13
    },
    {
      "id": "subagent:devbot",
      "name": "DevBot",
      "type": "agent",
      "status": "active",
      "lastActive": "2m ago",
      "model": "claude-3-5-haiku-20241022",
      "tokens": 45000,
      "tasks": 9
    }
  ],
  "stats": {
    "totalTokensToday": 450000,
    "averageResponseTime": "250ms",
    "successRate": "99.2%"
  }
}
```

**Agent Types:**
- `agent` - Main or spawned agent
- `cron` - Scheduled background task
- `subagent` - Delegated specialist

**Status Values:**
- `active` - Active in last 5 minutes
- `idle` - Inactive but not crashed

### 6. Knowledge Base
**GET** `/api/knowledge-base`

Access to memory, docs, and governance rules.

**Response:**
```json
{
  "sections": [
    {
      "title": "Long-Term Memory",
      "description": "Curated decisions, lessons, and strategic context",
      "content": "...",
      "fullPath": "MEMORY.md"
    },
    {
      "title": "Daily Logs",
      "description": "Recent activity and task completions",
      "entries": [
        { "date": "2026-02-19.md", "preview": "..." }
      ]
    }
  ],
  "stats": {
    "totalEntries": 8,
    "lastUpdated": "2026-02-19T16:30:00Z"
  }
}
```

### 7. Settings
**GET** `/api/settings` - Fetch current settings

**POST** `/api/settings` - Update settings

**Settings Object:**
```json
{
  "alerts": {
    "costThreshold": 300,
    "costAlertEmail": "polycarpohu@gmail.com",
    "serviceDownAlertEnabled": true,
    "agentInactivityThreshold": 3600000
  },
  "monitoring": {
    "enableRealtime": true,
    "updateInterval": 5000,
    "retentionDays": 30,
    "logLevel": "info"
  },
  "services": {
    "whitelist": ["Clawdbot Gateway", "n8n", ...],
    "checkInterval": 60000
  },
  "agents": {
    "maxConcurrent": 8,
    "defaultModel": "claude-3-5-sonnet-20241022",
    "telemetryEnabled": true
  }
}
```

## Update Frequency

- **Services**: Every 60 seconds (configurable)
- **Costs**: Every refresh (real-time from sessions)
- **Agent Activity**: Every 5 seconds (streaming)
- **Stream**: Every 5 seconds (SSE)

## Data Sources

| Endpoint | Source | Update |
|----------|--------|--------|
| `/api/dashboard` | Aggregates all below | On-demand |
| `/api/services/status` | HTTP health checks | 60s interval |
| `/api/costs` | Clawdbot sessions CLI | Real-time |
| `/api/agents/activity` | Clawdbot sessions CLI | Real-time |
| `/api/knowledge-base` | Local filesystem | On-demand |
| `/api/settings` | In-memory + DB | Immediate |

## Error Handling

All endpoints return errors in format:
```json
{
  "error": "Error description",
  "timestamp": "2026-02-19T16:30:00Z"
}
```

**Common Status Codes:**
- `200` - Success
- `404` - Endpoint not found
- `500` - Server error (see error message)

## Rate Limiting

- No rate limiting on API endpoints
- Real-time stream updates are throttled to 5-second intervals
- Service health checks cached for 60 seconds

## Authentication

All endpoints require valid session (NextAuth).

**Authenticated user:** polycarpohu@gmail.com

---

**Next:** Devbot integrating these APIs into frontend UI
