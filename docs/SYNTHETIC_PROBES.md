# Synthetic Probes for License Health Monitoring

This document describes the synthetic probe system that monitors license health endpoints with known seeded users.

## Overview

Synthetic probes are automated tests that simulate real user behavior to monitor the health and performance of license validation endpoints. They run hourly and alert when failures exceed thresholds.

## Architecture

### Components

1. **SyntheticProbeService** (`apps/backend/src/monitoring/synthetic-probe.service.ts`)
   - Runs scheduled probe tests
   - Monitors license health endpoints
   - Tracks consecutive failures
   - Generates alerts for failures

2. **SyntheticProbeController** (`apps/backend/src/monitoring/synthetic-probe.controller.ts`)
   - Exposes probe management endpoints
   - Provides probe statistics
   - Allows manual probe execution

3. **Probe Configuration**
   - Default probes for SMART_SERVICE and SMART_SALES
   - Configurable endpoints and timeouts
   - Known seeded users for consistent testing

### Probe Users

The system uses dedicated probe users for monitoring:

- **Email**: `probe@system.com`
- **Tenant**: `SYSTEM-PROBE-TENANT`
- **User Type**: `SERVICE` (system user)
- **Status**: `active`

## Probe Configuration

### Default Probes

```typescript
const defaultProbes: ProbeConfig[] = [
  {
    userId: 'probe@system.com',
    tenantId: 'SYSTEM-PROBE-TENANT',
    licenseType: 'SMART_SERVICE',
    endpoint: '/health/license',
    expectedStatus: 200,
    timeoutMs: 5000,
  },
  {
    userId: 'probe@system.com',
    tenantId: 'SYSTEM-PROBE-TENANT',
    licenseType: 'SMART_SALES',
    endpoint: '/health/license',
    expectedStatus: 200,
    timeoutMs: 5000,
  },
];
```

### Probe Config Interface

```typescript
interface ProbeConfig {
  userId: string;        // Email of probe user
  tenantId: string;      // Tenant name
  licenseType: string;   // License type to test
  endpoint: string;      // Health endpoint to test
  expectedStatus: number; // Expected HTTP status
  timeoutMs: number;     // Timeout in milliseconds
}
```

## API Endpoints

### Get Probe Statistics
```http
GET /monitoring/probes/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalProbes": 24,
  "successfulProbes": 23,
  "failedProbes": 1,
  "successRate": 0.9583,
  "averageLatency": 85.2,
  "recentResults": [
    {
      "success": true,
      "latency": 75,
      "timestamp": "2024-01-01T10:00:00Z",
      "endpoint": "/health/license",
      "userId": "probe@system.com",
      "tenantId": "SYSTEM-PROBE-TENANT",
      "licenseType": "SMART_SERVICE"
    }
  ]
}
```

### Get Probe Results for Time Range
```http
GET /monitoring/probes/results?startTime=2024-01-01T00:00:00Z&endTime=2024-01-02T00:00:00Z
Authorization: Bearer <token>
```

### Run Probes Manually
```http
POST /monitoring/probes/run
Authorization: Bearer <token>
```

### Add Custom Probe
```http
POST /monitoring/probes/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "custom-probe@example.com",
  "tenantId": "CUSTOM-TENANT",
  "licenseType": "SMART_GRANTS",
  "endpoint": "/health/license",
  "expectedStatus": 200,
  "timeoutMs": 5000
}
```

### Remove Probe
```http
DELETE /monitoring/probes/remove?endpoint=/health/license
Authorization: Bearer <token>
```

### Get Probe Health
```http
GET /monitoring/probes/health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "message": "Synthetic probes are running normally",
  "details": {
    "successRate": 0.9583,
    "averageLatency": 85.2,
    "totalProbes": 24
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "message": "Synthetic probes are failing",
  "details": {
    "successRate": 0.75,
    "averageLatency": 150.5,
    "totalProbes": 24,
    "failedProbes": 6
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## Scheduling

### Hourly Execution
Probes run automatically every hour using NestJS scheduling:

```typescript
@Cron(CronExpression.EVERY_HOUR)
async scheduledProbeExecution(): Promise<void> {
  this.logger.log('⏰ Running scheduled synthetic probes...');
  await this.runProbes();
}
```

### Manual Execution
Probes can also be triggered manually via API or for testing.

## Alerting

### Consecutive Failure Detection
- Monitors last 3 probe results per endpoint
- Alerts when 2+ consecutive failures occur
- Creates critical alerts in SLO system
- Logs to audit trail

### Alert Types
- `SYNTHETIC_PROBE_FAILURE`: Consecutive probe failures
- Severity: `CRITICAL`
- Includes failure details and metrics

### Alert Message Example
```
🚨 CRITICAL ALERT: Synthetic probe failed 2 consecutive times for /health/license
```

## Probe Execution Flow

### 1. User Lookup
```typescript
const user = await this.prisma.user.findUnique({
  where: { email: config.userId },
  select: { id: true },
});
```

### 2. Tenant Lookup
```typescript
const tenant = await this.prisma.tenant.findUnique({
  where: { name: config.tenantId },
  select: { id: true },
});
```

### 3. License Validation
```typescript
const licenseCheck = await this.prisma.userTenantLicense.findFirst({
  where: {
    userId: user.id,
    status: 'active',
    expiresAt: { gt: new Date() },
    tenantLicense: {
      tenantId: tenant.id,
      licenseType: config.licenseType,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  },
});
```

### 4. Health Check Simulation
```typescript
const sloStatus = await this.sloService.getSLOStatus();
if (!sloStatus.isHealthy) {
  return { success: false, errorMessage: 'SLO thresholds exceeded' };
}
```

## Error Handling

### Common Probe Errors
1. **Probe user not found**: User doesn't exist in database
2. **Probe tenant not found**: Tenant doesn't exist
3. **License not found or expired**: No valid license for probe user
4. **SLO thresholds exceeded**: System performance degraded
5. **Database error**: Connection or query issues

### Error Recovery
- Automatic retry on transient failures
- Graceful degradation when probes fail
- Detailed error logging for debugging
- Alert escalation for persistent failures

## Monitoring Dashboard

### Key Metrics
1. **Success Rate**: Percentage of successful probes
2. **Average Latency**: Response time across all probes
3. **Failure Count**: Number of failed probes
4. **Consecutive Failures**: Streak of failures per endpoint

### Health Indicators
- **Green**: Success rate ≥ 95%
- **Yellow**: Success rate 80-95%
- **Red**: Success rate < 80%

## Configuration

### Environment Variables
```bash
# Probe scheduling (optional)
PROBE_SCHEDULE=EVERY_HOUR
PROBE_TIMEOUT_MS=5000
PROBE_MAX_RETRIES=3
```

### Custom Probe Configuration
```typescript
// Add custom probe
await probeService.addProbe({
  userId: 'custom@example.com',
  tenantId: 'CUSTOM-TENANT',
  licenseType: 'SMART_GRANTS',
  endpoint: '/health/license',
  expectedStatus: 200,
  timeoutMs: 5000,
});
```

## Best Practices

### Probe Design
1. **Use dedicated users**: Separate probe users from real users
2. **Test critical paths**: Focus on essential license validation
3. **Realistic scenarios**: Simulate actual user behavior
4. **Consistent timing**: Run at regular intervals

### Alert Management
1. **Set appropriate thresholds**: 2+ consecutive failures
2. **Monitor alert fatigue**: Avoid too many false positives
3. **Escalate critical failures**: Immediate response for system issues
4. **Document procedures**: Clear response playbooks

### Performance Considerations
1. **Minimal impact**: Probes should not affect system performance
2. **Efficient queries**: Optimize database lookups
3. **Timeout handling**: Prevent hanging probes
4. **Resource cleanup**: Clear probe result history periodically

## Troubleshooting

### Probe Failures
1. **Check probe users**: Verify users exist and are active
2. **Verify licenses**: Ensure probe users have valid licenses
3. **Database connectivity**: Check database connection
4. **SLO status**: Review system performance metrics

### Debugging Commands
```bash
# Check probe statistics
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/monitoring/probes/stats

# Run manual probe
curl -X POST -H "Authorization: Bearer <token>" \
  https://api.example.com/monitoring/probes/run

# Check probe health
curl https://api.example.com/monitoring/probes/health
```

### Common Issues
1. **Probe user missing**: Run seed script to create probe users
2. **License expired**: Renew probe user licenses
3. **Database errors**: Check database connectivity and schema
4. **Scheduling issues**: Verify cron job configuration

## Integration with SLO Monitoring

### SLO Integration
- Probe results feed into SLO metrics
- Alerts integrated with SLO alerting system
- Performance data used for trend analysis
- Health status affects overall system health

### Metrics Correlation
- Probe latency vs SLO latency
- Probe success rate vs SLO success rate
- Error patterns across probes and real users
- Performance trends over time

## Future Enhancements

### Planned Features
1. **Multi-region probes**: Test from different geographic locations
2. **Custom probe scripts**: Allow custom probe logic
3. **Advanced alerting**: ML-based anomaly detection
4. **Probe analytics**: Detailed performance analysis

### Monitoring Expansion
1. **Business metrics**: License utilization tracking
2. **User experience**: End-to-end journey monitoring
3. **System health**: Resource utilization tracking
4. **Security monitoring**: Failed authentication attempts
