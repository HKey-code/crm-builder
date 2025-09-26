# SLO Monitoring for License Checks

This document describes the Service Level Objective (SLO) monitoring system for license checks in the CRM License System.

## Overview

The SLO monitoring system tracks performance and reliability metrics for license validation operations, providing real-time alerts and historical analysis.

## SLO Targets

### Performance Targets
- **P99 Latency**: < 150ms (99% of license checks complete within 150ms)
- **Success Rate**: > 99.9% (99.9% of license checks succeed)
- **Error Spike Threshold**: < 5 errors per 5-minute window

### Alert Severity Levels
- **WARNING**: Performance degradation detected
- **CRITICAL**: Service health at risk

## Architecture

### Components

1. **SLOService** (`apps/backend/src/monitoring/slo.service.ts`)
   - Records license check metrics
   - Calculates SLO status
   - Generates alerts
   - Provides historical analysis

2. **SLOController** (`apps/backend/src/monitoring/slo.controller.ts`)
   - Exposes monitoring endpoints
   - Provides health checks
   - Returns metrics and alerts

3. **LicenseGuard Integration**
   - Automatically records metrics for each license check
   - Tracks latency, success/failure, and error codes
   - Integrates with audit logging

### Database Schema

#### SLOMetric Table
```sql
model SLOMetric {
  id          String    @id @default(uuid())
  latencyMs   Int
  success     Boolean
  errorCode   String?
  userId      String?
  tenantId    String?
  licenseType String?
  timestamp   DateTime  @default(now())

  @@index([timestamp])
  @@index([success, timestamp])
  @@index([errorCode, timestamp])
}
```

#### SLOAlert Table
```sql
model SLOAlert {
  id      String   @id @default(uuid())
  type    String   // LATENCY_THRESHOLD_EXCEEDED, SUCCESS_RATE_DROPPED, ERROR_SPIKE_DETECTED
  message String
  severity String  // WARNING, CRITICAL
  timestamp DateTime @default(now())
  metrics Json?    // Store the metrics that triggered the alert

  @@index([timestamp])
  @@index([type, timestamp])
  @@index([severity, timestamp])
}
```

## API Endpoints

### Get Current SLO Status
```http
GET /monitoring/slo/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "p99Latency": 120,
  "successRate": 0.9995,
  "errorCount": 2,
  "isHealthy": true,
  "alerts": []
}
```

### Get SLO Metrics for Time Range
```http
GET /monitoring/slo/metrics?startTime=2024-01-01T00:00:00Z&endTime=2024-01-02T00:00:00Z
Authorization: Bearer <token>
```

**Response:**
```json
{
  "metrics": [
    {
      "licenseCheckLatency": 85,
      "licenseCheckSuccess": true,
      "errorCode": null,
      "userId": "user-123",
      "tenantId": "tenant-456",
      "licenseType": "SMART_SERVICE",
      "timestamp": "2024-01-01T10:30:00Z"
    }
  ],
  "summary": {
    "totalChecks": 1000,
    "successfulChecks": 999,
    "failedChecks": 1,
    "averageLatency": 95.2,
    "p95Latency": 120,
    "p99Latency": 150,
    "errorBreakdown": {
      "SEAT_EXPIRED": 1
    }
  }
}
```

### Get Error Spike Analysis
```http
GET /monitoring/slo/errors
Authorization: Bearer <token>
```

**Response:**
```json
{
  "recentErrors": [
    {
      "errorCode": "SEAT_EXPIRED",
      "count": 3,
      "percentage": 75.0
    },
    {
      "errorCode": "NO_TENANT_LICENSE",
      "count": 1,
      "percentage": 25.0
    }
  ],
  "spikeDetected": true,
  "recommendations": [
    "High error rate detected - investigate immediately",
    "Check for expired user licenses and renewal processes"
  ]
}
```

### Get SLO Health Check
```http
GET /monitoring/slo/health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "message": "All SLO thresholds met",
  "details": {
    "p99Latency": 120,
    "successRate": 0.9995,
    "errorCount": 2
  },
  "timestamp": "2024-01-01T10:30:00Z"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "message": "SLO thresholds exceeded",
  "details": {
    "p99Latency": 200,
    "successRate": 0.995,
    "errorCount": 8,
    "alerts": [
      {
        "type": "LATENCY_THRESHOLD_EXCEEDED",
        "message": "P99 latency 200ms exceeds threshold 150ms",
        "severity": "WARNING",
        "timestamp": "2024-01-01T10:30:00Z"
      }
    ]
  },
  "timestamp": "2024-01-01T10:30:00Z"
}
```

## Error Codes

### License Check Error Codes
- `SEAT_EXPIRED`: User's seat license has expired
- `NO_TENANT_LICENSE`: Tenant doesn't have the required license
- `LICENSE_NOT_ASSIGNED`: User doesn't have the required license assigned
- `DATABASE_ERROR`: Database connection or query error
- `UNKNOWN`: Unknown error occurred

### Alert Types
- `LATENCY_THRESHOLD_EXCEEDED`: P99 latency exceeds 150ms
- `SUCCESS_RATE_DROPPED`: Success rate below 99.9%
- `ERROR_SPIKE_DETECTED`: More than 5 errors in 5 minutes

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Real-time Performance**
   - Current P99 latency
   - Success rate over last 5 minutes
   - Error count in current window

2. **Historical Trends**
   - Daily/weekly/monthly performance trends
   - Peak usage patterns
   - Error rate patterns

3. **Error Analysis**
   - Most common error codes
   - Error spike detection
   - Root cause recommendations

### Alerting Strategy

#### Warning Alerts
- P99 latency > 150ms
- Success rate < 99.9%
- Error count > 5 in 5 minutes

#### Critical Alerts
- P99 latency > 300ms
- Success rate < 99%
- Error count > 10 in 5 minutes
- Consecutive failures > 3

## Integration with LicenseGuard

The `LicenseGuard` automatically records metrics for every license check:

```typescript
// In LicenseGuard.canActivate()
const startTime = Date.now();
let licenseCheckSuccess = false;
let errorCode: string | undefined;

try {
  // License validation logic
  licenseCheckSuccess = true;
} catch (error) {
  errorCode = determineErrorCode(error);
  throw error;
} finally {
  // Record SLO metrics
  await this.sloService.recordLicenseCheck({
    licenseCheckLatency: Date.now() - startTime,
    licenseCheckSuccess,
    errorCode,
    userId: user?.id,
    tenantId,
    licenseType: this.required,
    timestamp: new Date(),
  });
}
```

## Alert Recommendations

### For SEAT_EXPIRED Errors
1. Check license renewal processes
2. Verify automatic renewal workflows
3. Review user notification systems
4. Monitor license expiration schedules

### For NO_TENANT_LICENSE Errors
1. Verify tenant license configuration
2. Check license activation status
3. Review license assignment workflows
4. Monitor tenant onboarding processes

### For DATABASE_ERROR
1. Check database connectivity
2. Monitor database performance
3. Review connection pool settings
4. Verify database schema integrity

## Performance Optimization

### Database Indexes
- `SLOMetric.timestamp` - For time-based queries
- `SLOMetric.success` + `SLOMetric.timestamp` - For success rate calculations
- `SLOMetric.errorCode` + `SLOMetric.timestamp` - For error analysis

### Caching Strategy
- Cache recent metrics in memory (last 1000 records)
- Use sliding window for real-time calculations
- Implement TTL for historical data

### Data Retention
- Keep detailed metrics for 30 days
- Aggregate data for long-term trends
- Archive old data for compliance

## Troubleshooting

### Common Issues

1. **High Latency**
   - Check database performance
   - Review network connectivity
   - Monitor server resources
   - Optimize database queries

2. **High Error Rate**
   - Check license configuration
   - Verify user assignments
   - Review error handling
   - Monitor system health

3. **Alert Fatigue**
   - Adjust threshold values
   - Implement alert deduplication
   - Use different severity levels
   - Set up escalation policies

### Debugging Commands

```bash
# Check current SLO status
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/monitoring/slo/status

# Get error analysis
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/monitoring/slo/errors

# Check health endpoint
curl https://api.example.com/monitoring/slo/health
```

## Best Practices

### Monitoring
1. Set up automated dashboards
2. Configure alert notifications
3. Regular review of thresholds
4. Document incident responses

### Performance
1. Monitor database performance
2. Optimize query patterns
3. Use connection pooling
4. Implement caching strategies

### Reliability
1. Set up redundancy
2. Implement circuit breakers
3. Use health checks
4. Plan for failure scenarios

## Future Enhancements

### Planned Features
1. **Predictive Alerts**: ML-based anomaly detection
2. **Custom Thresholds**: Per-tenant SLO targets
3. **Advanced Analytics**: Trend analysis and forecasting
4. **Integration**: Connect with external monitoring tools

### Metrics Expansion
1. **Business Metrics**: License utilization rates
2. **User Experience**: Response time percentiles
3. **System Health**: Resource utilization
4. **Security**: Failed authentication attempts
