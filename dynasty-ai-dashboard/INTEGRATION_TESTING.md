# Dynasty AI Dashboard - Integration Testing Guide

## Testing Real API Endpoints

### 1. Service Status Integration

#### API Endpoint
```
GET /api/services/status
```

#### Expected Response
```json
[
  {
    "id": "service-1",
    "name": "API Gateway",
    "status": "healthy|degraded|down|maintenance",
    "uptime": 99.95,
    "responseTime": 145,
    "lastCheck": "2024-02-19T12:34:56Z",
    "details": "All systems operational"
  }
]
```

#### Test Procedure
1. Start the dashboard: `npm run dev`
2. Navigate to Services page (`/services`)
3. Verify services load from API
4. Check status badges update correctly
5. Confirm uptime percentages display
6. Monitor response time metrics

#### Validation Checklist
- [ ] Services load without errors
- [ ] Status badges show correct colors
- [ ] Uptime bars are accurate
- [ ] Response times are realistic
- [ ] Auto-refresh updates data
- [ ] Error handling works

---

### 2. Cost Tracking Integration

#### API Endpoints
```
GET /api/costs
GET /api/costs/trend?days=30
GET /api/costs/breakdown
```

#### Expected Response
```json
{
  "totalCost": 2456.78,
  "monthlyBudget": 5000,
  "costPerDay": 78.45,
  "costTrend": [
    {
      "date": "Feb 01",
      "cost": 75.50,
      "budget": 166.67
    }
  ],
  "breakdown": {
    "compute": 1200,
    "storage": 456,
    "network": 534,
    "services": 267
  },
  "alerts": [
    {
      "id": "alert-1",
      "severity": "warning|info|critical",
      "message": "Cost is 50% of monthly budget",
      "timestamp": "2024-02-19T12:34:56Z"
    }
  ]
}
```

#### Test Procedure
1. Navigate to Costs page (`/costs`)
2. Verify cost summary cards display
3. Check trend chart renders
4. Confirm breakdown chart shows
5. Test alert notifications
6. Validate budget progress bar

#### Validation Checklist
- [ ] Total cost displays correctly
- [ ] Budget remaining calculates
- [ ] Trend chart data is accurate
- [ ] Breakdown pie/bar chart works
- [ ] Budget alerts trigger
- [ ] Charts render without errors

---

### 3. Agent Activity Integration

#### API Endpoints
```
GET /api/agents/activity
GET /api/dashboard/stream (SSE)
```

#### Expected Response
```json
[
  {
    "id": "agent-1",
    "agentName": "ContentGenerator",
    "status": "active|idle|offline",
    "lastHeartbeat": "2024-02-19T12:30:00Z",
    "sessionStarted": "2024-02-19T10:00:00Z",
    "tasksCompleted": 23,
    "currentTask": "Generating blog post"
  }
]
```

#### Server-Sent Events Format
```json
{
  "type": "agent_update|service_update|cost_update|alert",
  "data": { /* event-specific data */ },
  "timestamp": "2024-02-19T12:34:56Z"
}
```

#### Test Procedure
1. Navigate to Agents page (`/agents`)
2. Verify agent list loads
3. Check status indicators
4. Confirm task counts display
5. Monitor real-time SSE updates
6. Test connection/disconnection

#### Validation Checklist
- [ ] Agents load from API
- [ ] Status badges update
- [ ] Task counts are accurate
- [ ] Real-time events arrive
- [ ] Connection status shows
- [ ] Disconnection handling works

---

### 4. Knowledge Base Integration

#### API Endpoint
```
GET /api/knowledge-base
```

#### Expected Response
```json
{
  "memory": {
    "content": "# System Memory\n...",
    "lastUpdated": "2024-02-19T12:34:56Z"
  },
  "docs": [
    {
      "id": "doc-1",
      "title": "Setup Guide",
      "content": "# Installation\n...",
      "category": "Getting Started"
    }
  ]
}
```

#### Test Procedure
1. Navigate to Knowledge Base (`/knowledge-base`)
2. Verify memory section displays
3. Check documentation loads
4. Test search functionality
5. Click document categories
6. Verify Markdown rendering

#### Validation Checklist
- [ ] Memory content displays
- [ ] Docs list loads
- [ ] Search filters documents
- [ ] Markdown renders correctly
- [ ] Document selection works
- [ ] Categories organize properly

---

### 5. Settings Integration

#### API Endpoints
```
GET /api/settings
POST /api/settings
```

#### Request Body
```json
{
  "thresholds": {
    "costAlertThreshold": 80,
    "uptimeAlertThreshold": 95,
    "responseTimeAlert": 1000
  },
  "alerts": {
    "email": true,
    "inApp": true,
    "slack": false
  },
  "preferences": {
    "theme": "light|dark|auto",
    "updateFrequency": 30,
    "autoRefresh": true
  }
}
```

#### Test Procedure
1. Navigate to Settings (`/settings`)
2. Adjust threshold sliders
3. Toggle alert channels
4. Change theme preference
5. Set update frequency
6. Click Save Settings
7. Verify successful save notification

#### Validation Checklist
- [ ] Settings load from API
- [ ] Threshold sliders work
- [ ] Toggle switches functional
- [ ] Theme selector works
- [ ] Frequency dropdown works
- [ ] Save button submits
- [ ] Notification confirms save
- [ ] Settings persist

---

### 6. Real-Time Streaming Integration

#### Server-Sent Events Stream
```
GET /api/dashboard/stream
```

#### Test Procedure
1. Open browser DevTools (Network tab)
2. Filter for EventStream
3. Navigate to Dashboard
4. Watch for incoming SSE connections
5. Trigger updates on backend
6. Observe event messages
7. Check auto-update behavior

#### Event Types Expected
```
service_update - Service status changed
cost_update - New cost data
agent_update - Agent session changed
alert - New alert issued
```

#### Validation Checklist
- [ ] SSE connection establishes
- [ ] Events arrive in real-time
- [ ] Components update from events
- [ ] Auto-refresh respects settings
- [ ] Reconnection works
- [ ] Error handling graceful

---

## Load Testing

### Scenario 1: Rapid Refreshes
1. Enable auto-refresh (10 seconds)
2. Run dashboard for 5 minutes
3. Monitor browser memory
4. Check network request pattern
5. Verify no memory leaks

### Scenario 2: Concurrent Connections
1. Open dashboard in multiple tabs
2. Enable real-time streaming
3. Monitor simultaneous SSE connections
4. Verify data consistency
5. Test reconnection handling

### Scenario 3: Slow Network
1. Open DevTools throttling
2. Set to "Slow 4G"
3. Navigate between pages
4. Test timeout behavior
5. Verify error messages

---

## Error Scenarios

### 1. API Unavailable
- Stop API server
- Reload dashboard
- Verify error messages display
- Check retry logic
- Confirm graceful degradation

### 2. Network Timeout
- Throttle network to very slow
- Wait for timeout
- Check error handling
- Verify retry attempts
- Test fallback UI

### 3. Invalid Data
- Modify API response format
- Check validation logic
- Verify error handling
- Confirm UI stability

### 4. Real-time Stream Disconnection
- Kill SSE connection
- Observe reconnection
- Check event buffering
- Verify state recovery

---

## Performance Benchmarks

### Target Metrics
- **Page Load**: < 2 seconds
- **API Response**: < 500ms
- **Real-time Update**: < 100ms
- **Search**: < 200ms
- **Chart Render**: < 1 second

### Measurement Tools
1. Chrome DevTools Performance
2. Lighthouse Audit
3. WebPageTest
4. Custom monitoring

### Test Procedure
```bash
# Build for production
npm run build

# Start production server
npm start

# Run lighthouse audit
npm audit
```

---

## Browser Compatibility Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Test Checklist Per Browser
- [ ] Page loads
- [ ] Navigation works
- [ ] Forms functional
- [ ] Charts render
- [ ] Real-time updates work
- [ ] Responsive layout

---

## Monitoring & Alerting Tests

### Alert Triggers
1. Budget threshold exceeded
2. Service downtime detected
3. High response times
4. Agent offline
5. Cost spike

### Test Procedure
1. Set low threshold values
2. Modify backend data to trigger condition
3. Observe alert notification
4. Check alert channel (email/slack/inapp)
5. Verify alert UI updates
6. Test alert dismissal

---

## Final Sign-Off Checklist

- [ ] All API endpoints tested
- [ ] Real-time updates verified
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Browser compatibility confirmed
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested
- [ ] Security concerns addressed
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## Reporting Issues

When an issue is found:

1. **Document**: What happened, when, and how to reproduce
2. **Screenshot**: Include relevant UI state
3. **Logs**: Browser console errors
4. **Network**: Request/response data
5. **Environment**: Browser, OS, API URL
6. **Expected**: What should happen
7. **Actual**: What actually happened

---

## Test Report Template

```
## Test Report: [Date]

### Environment
- API URL: [URL]
- Dashboard Version: [Version]
- Browser: [Browser/Version]
- OS: [OS/Version]

### Results
- [Feature]: ✓ PASS / ✗ FAIL
- [Feature]: ✓ PASS / ✗ FAIL

### Issues Found
1. [Issue Description]
2. [Issue Description]

### Performance
- Page Load: [Time]
- API Response: [Time]
- Real-time Update: [Time]

### Conclusion
Status: READY FOR PRODUCTION / NEEDS FIXES

### Notes
[Additional notes]
```
