# Chaos Testing for CRM License System

This document provides comprehensive information about the chaos testing system that validates license guard behavior, rollback mechanisms, and system resilience under failure conditions.

## Overview

The chaos testing system performs controlled failure scenarios to validate:
- **License guard behavior** under various failure conditions
- **Rollback mechanisms** for license and seat changes
- **System resilience** during concurrent failures
- **Performance characteristics** under chaos conditions
- **Edge case handling** for invalid inputs and expired licenses

## Test Scenarios

### 1. Initial State Validation

#### Purpose
Validates that the system starts in a known good state before chaos testing.

#### Tests Performed
- **System health check**: Verifies API endpoints are accessible
- **Tenant license validation**: Confirms tenant license is active
- **User seat validation**: Confirms user seat is active
- **Service endpoint access**: Tests SMART_SERVICE license access
- **Sales endpoint access**: Tests SMART_SALES license access

#### Expected Results
```
[SUCCESS] System health check passed
[SUCCESS] Tenant license is active
[SUCCESS] User seat is active
[SUCCESS] Service endpoint access granted
[SUCCESS] Sales endpoint access granted
```

### 2. Tenant License Deactivation

#### Purpose
Tests system behavior when a tenant license is deactivated.

#### Chaos Action
```bash
# Deactivate tenant license
POST /licenses/deactivate
{
  "tenantId": "test-tenant-123",
  "licenseType": "SMART_SERVICE",
  "status": "inactive",
  "reason": "Chaos test deactivation"
}
```

#### Expected Behavior
- **Service endpoints**: Should return 403 Forbidden
- **Sales endpoints**: May still work if different license
- **License validation**: Should fail for deactivated license
- **Guard behavior**: Should deny access appropriately

#### Validation Tests
```bash
# Test service endpoint (should be denied)
GET /service/health → 403 Forbidden

# Test license validation (should fail)
GET /licenses/validate?userId=test-user&tenantId=test-tenant&licenseType=SMART_SERVICE → 403 Forbidden
```

### 3. Seat Expiration

#### Purpose
Tests system behavior when a user seat expires.

#### Chaos Action
```bash
# Expire user seat
POST /licenses/expire-seat
{
  "userId": "test-user-456",
  "tenantId": "test-tenant-123",
  "licenseType": "SMART_SALES",
  "expiresAt": "2024-01-01T10:00:00Z",
  "reason": "Chaos test expiration"
}
```

#### Expected Behavior
- **Sales endpoints**: Should return 403 Forbidden
- **Service endpoints**: May still work if different license
- **Seat validation**: Should fail for expired seat
- **Guard behavior**: Should deny access appropriately

#### Validation Tests
```bash
# Test sales endpoint (should be denied)
GET /sales/health → 403 Forbidden

# Test seat validation (should fail)
GET /licenses/validate?userId=test-user&tenantId=test-tenant&licenseType=SMART_SALES → 403 Forbidden
```

### 4. System User Bypass

#### Purpose
Tests that system users can bypass license checks.

#### Chaos Action
```bash
# Test system user access with deactivated license
GET /service/health?userId=system-user-999
GET /sales/health?userId=system-user-999
```

#### Expected Behavior
- **System users**: Should bypass all license checks
- **Access granted**: Should return 200 OK regardless of license status
- **Guard behavior**: Should allow system user access

#### Validation Tests
```bash
# Test system user with deactivated license
GET /service/health?userId=system-user-999 → 200 OK

# Test system user with expired seat
GET /sales/health?userId=system-user-999 → 200 OK
```

### 5. Rollback Mechanisms

#### Purpose
Tests that license and seat changes can be rolled back cleanly.

#### Rollback Actions
```bash
# Reactivate tenant license
POST /licenses/activate
{
  "tenantId": "test-tenant-123",
  "licenseType": "SMART_SERVICE",
  "status": "active",
  "reason": "Chaos test rollback"
}

# Renew user seat
POST /licenses/renew-seat
{
  "userId": "test-user-456",
  "tenantId": "test-tenant-123",
  "licenseType": "SMART_SALES",
  "expiresAt": "2025-01-01T00:00:00Z",
  "reason": "Chaos test rollback"
}
```

#### Expected Behavior
- **Service endpoints**: Should be restored to 200 OK
- **Sales endpoints**: Should be restored to 200 OK
- **License validation**: Should succeed after rollback
- **Seat validation**: Should succeed after rollback

#### Validation Tests
```bash
# Test service endpoint after rollback
GET /service/health → 200 OK

# Test sales endpoint after rollback
GET /sales/health → 200 OK

# Test license validation after rollback
GET /licenses/validate?userId=test-user&tenantId=test-tenant&licenseType=SMART_SERVICE → 200 OK
```

### 6. Edge Cases

#### Purpose
Tests system behavior with invalid inputs and edge conditions.

#### Edge Case Tests

##### Invalid Tenant ID
```bash
GET /licenses/validate?userId=test-user&tenantId=invalid-tenant&licenseType=SMART_SERVICE → 403 Forbidden
```

##### Invalid User ID
```bash
GET /licenses/validate?userId=invalid-user&tenantId=test-tenant&licenseType=SMART_SERVICE → 403 Forbidden
```

##### Expired License with Valid Seat
```bash
# Expire license
POST /licenses/expire-license
{
  "tenantId": "test-tenant-123",
  "licenseType": "SMART_SERVICE",
  "expiresAt": "2024-01-01T10:00:00Z",
  "reason": "Chaos test edge case"
}

# Test access (should be denied)
GET /service/health → 403 Forbidden
```

### 7. Performance Under Chaos

#### Purpose
Tests system performance characteristics during chaos conditions.

#### Performance Tests
- **Normal response time**: Baseline performance measurement
- **Chaos response time**: Performance during license deactivation
- **Performance ratio**: Compare chaos vs normal performance
- **Acceptable degradation**: Within 50% of normal performance

#### Expected Results
```
Normal response time: 45ms
Chaos response time: 52ms
Performance under chaos is acceptable (115% of normal)
```

### 8. Concurrent Chaos

#### Purpose
Tests system behavior during concurrent failure scenarios.

#### Concurrent Actions
```bash
# Concurrent license deactivation and seat expiration
POST /licenses/deactivate &
POST /licenses/expire-seat &
wait
```

#### Expected Behavior
- **Concurrent operations**: Should complete without conflicts
- **System stability**: Should handle concurrent failures gracefully
- **Rollback capability**: Should rollback concurrent changes cleanly

#### Validation Tests
```bash
# Test both endpoints after concurrent chaos
GET /service/health → 403 Forbidden
GET /sales/health → 403 Forbidden

# Test rollback of concurrent changes
POST /licenses/activate &
POST /licenses/renew-seat &
wait

# Verify restoration
GET /service/health → 200 OK
GET /sales/health → 200 OK
```

### 9. Final State Validation

#### Purpose
Validates that the system returns to a known good state after chaos testing.

#### Final State Tests
- **System health**: API endpoints accessible
- **Tenant license**: Active and valid
- **User seat**: Active and valid
- **Service access**: Restored to normal
- **Sales access**: Restored to normal

## Usage

### Basic Usage

#### Run Full Chaos Test Suite
```bash
# Run all chaos tests
./scripts/chaos-test.sh

# With custom configuration
BASE_URL="http://localhost:3000" \
TEST_TENANT_ID="my-tenant-123" \
TEST_USER_ID="my-user-456" \
./scripts/chaos-test.sh
```

#### Run Individual Test Scenarios
```bash
# Test initial state only
./scripts/chaos-test.sh initial

# Test license deactivation only
./scripts/chaos-test.sh deactivation

# Test seat expiration only
./scripts/chaos-test.sh expiration

# Test rollback mechanisms only
./scripts/chaos-test.sh rollback

# Test performance under chaos only
./scripts/chaos-test.sh performance

# Test concurrent chaos only
./scripts/chaos-test.sh concurrent

# Test final state only
./scripts/chaos-test.sh final
```

### Configuration

#### Environment Variables
```bash
# Base URL for API endpoints
BASE_URL="http://localhost:3000"

# Authentication token (optional)
AUTH_TOKEN="your-auth-token"

# Test tenant ID
TEST_TENANT_ID="test-tenant-123"

# Test user ID
TEST_USER_ID="test-user-456"

# Admin user ID
ADMIN_USER_ID="admin-789"
```

#### Log File
```bash
# Log file location
LOG_FILE="/tmp/chaos-test-$(date '+%Y%m%d-%H%M%S').log"

# View logs in real-time
tail -f /tmp/chaos-test-*.log
```

### Expected Output

#### Successful Test Run
```
[INFO] 🚀 Starting CRM License System Chaos Test
[INFO] Base URL: http://localhost:3000
[INFO] Test Tenant ID: test-tenant-123
[INFO] Test User ID: test-user-456
[SUCCESS] Authentication token obtained

[INFO] === Testing Initial State ===
[SUCCESS] System health check passed
[SUCCESS] Tenant license is active
[SUCCESS] User seat is active
[SUCCESS] Service endpoint access granted
[SUCCESS] Sales endpoint access granted

[INFO] === Testing Tenant License Deactivation ===
[CHAOS] Deactivating tenant license for test-tenant-123...
[SUCCESS] Tenant license deactivated successfully
[SUCCESS] Service endpoint correctly denied after license deactivation
[SUCCESS] License validation correctly fails after deactivation

[INFO] === Testing Seat Expiration ===
[CHAOS] Expiring user seat for test-user-456...
[SUCCESS] User seat expired successfully
[SUCCESS] Sales endpoint correctly denied after seat expiration
[SUCCESS] Seat validation correctly fails after expiration

[INFO] === Testing System User Bypass ===
[CHAOS] Testing system user bypass with deactivated license...
[SUCCESS] System user correctly bypasses license checks
[SUCCESS] System user correctly bypasses seat expiration

[INFO] === Testing Rollback Mechanisms ===
[ROLLBACK] Rolling back tenant license deactivation...
[SUCCESS] Tenant license reactivated successfully
[SUCCESS] Service endpoint correctly restored after rollback
[ROLLBACK] Rolling back seat expiration...
[SUCCESS] User seat renewed successfully
[SUCCESS] Sales endpoint correctly restored after rollback

[INFO] === Testing Edge Cases ===
[CHAOS] Testing with invalid tenant ID...
[SUCCESS] Correctly denied access with invalid tenant ID
[CHAOS] Testing with invalid user ID...
[SUCCESS] Correctly denied access with invalid user ID
[CHAOS] Testing expired license with valid seat...
[SUCCESS] Correctly denied access with expired license

[INFO] === Testing Performance Under Chaos ===
[INFO] Normal response time: 45ms
[CHAOS] Testing response times under license deactivation...
[INFO] Chaos response time: 52ms
[SUCCESS] Performance under chaos is acceptable (115% of normal)

[INFO] === Testing Concurrent Chaos ===
[CHAOS] Testing concurrent license deactivation and seat expiration...
[SUCCESS] Concurrent chaos operations completed
[SUCCESS] System correctly handles concurrent chaos
[ROLLBACK] Rolling back concurrent chaos...
[SUCCESS] Concurrent chaos rollback completed

[INFO] === Testing Final State ===
[SUCCESS] Tenant license is active in final state
[SUCCESS] User seat is active in final state
[SUCCESS] Service endpoint access restored in final state
[SUCCESS] Sales endpoint access restored in final state

[INFO] === Chaos Test Summary ===
[INFO] Total tests: 25
[INFO] Tests passed: 25
[INFO] Tests failed: 0
[SUCCESS] 🎉 All chaos tests passed! System is resilient.
```

#### Failed Test Run
```
[ERROR] ❌ Some chaos tests failed. System needs attention.
[INFO] Total tests: 25
[INFO] Tests passed: 20
[INFO] Tests failed: 5
```

## API Endpoints Used

### License Management
```http
# Validate license
GET /licenses/validate?userId={userId}&tenantId={tenantId}&licenseType={licenseType}

# Deactivate license
POST /licenses/deactivate
{
  "tenantId": "string",
  "licenseType": "SMART_SERVICE|SMART_SALES",
  "status": "inactive",
  "reason": "string"
}

# Activate license
POST /licenses/activate
{
  "tenantId": "string",
  "licenseType": "SMART_SERVICE|SMART_SALES",
  "status": "active",
  "reason": "string"
}

# Expire seat
POST /licenses/expire-seat
{
  "userId": "string",
  "tenantId": "string",
  "licenseType": "SMART_SERVICE|SMART_SALES",
  "expiresAt": "ISO8601",
  "reason": "string"
}

# Renew seat
POST /licenses/renew-seat
{
  "userId": "string",
  "tenantId": "string",
  "licenseType": "SMART_SERVICE|SMART_SALES",
  "expiresAt": "ISO8601",
  "reason": "string"
}
```

### Health Checks
```http
# System health
GET /health

# Service health (requires SMART_SERVICE license)
GET /service/health

# Sales health (requires SMART_SALES license)
GET /sales/health
```

## Test Data Requirements

### Required Test Data
```sql
-- Test tenant
INSERT INTO "Tenant" (id, name, defaultLocale) 
VALUES ('test-tenant-123', 'Chaos Test Tenant', 'en');

-- Test user
INSERT INTO "User" (id, email, name, tenantId, status) 
VALUES ('test-user-456', 'test@chaos.com', 'Chaos Test User', 'test-tenant-123', 'active');

-- Test tenant license
INSERT INTO "TenantLicense" (id, tenantId, licenseType, status, activatedAt) 
VALUES ('tl-123', 'test-tenant-123', 'SMART_SERVICE', 'active', NOW());

-- Test user seat
INSERT INTO "UserTenantLicense" (id, userId, tenantLicenseId, roleId, status, assignedAt) 
VALUES ('utl-123', 'test-user-456', 'tl-123', 'role-123', 'active', NOW());
```

### System User Setup
```sql
-- System user for bypass testing
INSERT INTO "User" (id, email, name, isSystemUser, status) 
VALUES ('system-user-999', 'system@chaos.com', 'System User', true, 'active');
```

## Monitoring and Alerting

### Key Metrics
- **Test success rate**: Percentage of passed tests
- **Response time degradation**: Performance impact during chaos
- **Rollback success rate**: Percentage of successful rollbacks
- **Concurrent operation success**: Success rate of concurrent chaos

### Alert Thresholds
- **Test failure rate**: >5% test failures
- **Performance degradation**: >50% response time increase
- **Rollback failure rate**: >10% rollback failures
- **System instability**: Multiple concurrent failures

### Log Analysis
```bash
# Analyze test results
grep -E "\[SUCCESS\]|\[ERROR\]" /tmp/chaos-test-*.log | wc -l

# Check performance metrics
grep "response time" /tmp/chaos-test-*.log

# Monitor rollback success
grep "rollback" /tmp/chaos-test-*.log
```

## Integration with CI/CD

### GitHub Actions Integration
```yaml
# .github/workflows/chaos-test.yml
name: Chaos Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  chaos-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Start application
        run: npm run start:dev &
        
      - name: Wait for application
        run: sleep 30
        
      - name: Run chaos tests
        run: |
          BASE_URL="http://localhost:3000" \
          TEST_TENANT_ID="ci-test-tenant" \
          TEST_USER_ID="ci-test-user" \
          ./scripts/chaos-test.sh
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: chaos-test-results
          path: /tmp/chaos-test-*.log
```

### Scheduled Testing
```yaml
# .github/workflows/scheduled-chaos.yml
name: Scheduled Chaos Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  scheduled-chaos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup environment
        run: |
          echo "BASE_URL=${{ secrets.TEST_BASE_URL }}" >> $GITHUB_ENV
          echo "TEST_TENANT_ID=${{ secrets.TEST_TENANT_ID }}" >> $GITHUB_ENV
          echo "TEST_USER_ID=${{ secrets.TEST_USER_ID }}" >> $GITHUB_ENV
          
      - name: Run chaos tests
        run: ./scripts/chaos-test.sh
        
      - name: Notify on failure
        if: failure()
        run: |
          echo "Chaos tests failed! Check logs for details."
          # Add notification logic here
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failures
```bash
# Check authentication token
echo $AUTH_TOKEN

# Test authentication endpoint
curl -H "Authorization: Bearer $AUTH_TOKEN" "$BASE_URL/auth/verify"
```

#### 2. API Endpoint Not Found
```bash
# Check if application is running
curl "$BASE_URL/health"

# Verify endpoint exists
curl "$BASE_URL/licenses/validate?userId=test&tenantId=test&licenseType=SMART_SERVICE"
```

#### 3. Test Data Missing
```bash
# Check if test data exists
curl "$BASE_URL/users/test-user-456"
curl "$BASE_URL/tenants/test-tenant-123"
```

#### 4. Performance Issues
```bash
# Check system resources
top
free -h
df -h

# Check application logs
tail -f /var/log/application.log
```

### Debug Mode
```bash
# Run with debug output
DEBUG=true ./scripts/chaos-test.sh

# Run individual test with verbose output
./scripts/chaos-test.sh deactivation 2>&1 | tee debug.log
```

## Best Practices

### Test Environment
- **Isolated environment**: Use dedicated test environment
- **Clean state**: Reset test data before each run
- **Monitoring**: Monitor system resources during tests
- **Logging**: Enable detailed logging for debugging

### Test Data Management
- **Unique identifiers**: Use unique IDs for each test run
- **Cleanup**: Clean up test data after tests
- **Isolation**: Ensure tests don't interfere with each other
- **Backup**: Backup production data before testing

### Performance Considerations
- **Baseline measurement**: Establish performance baselines
- **Gradual chaos**: Start with small failures, increase complexity
- **Resource monitoring**: Monitor CPU, memory, and network usage
- **Timeout handling**: Set appropriate timeouts for API calls

### Security Considerations
- **Test credentials**: Use dedicated test credentials
- **Access control**: Ensure test users have appropriate permissions
- **Data isolation**: Ensure test data doesn't leak to production
- **Audit logging**: Log all test activities for compliance

## Future Enhancements

### Planned Features
- **Automated chaos injection**: Random failure injection
- **Load testing integration**: Chaos testing under load
- **Multi-tenant chaos**: Test chaos across multiple tenants
- **Database chaos**: Test database failure scenarios

### Advanced Scenarios
- **Network partition**: Test behavior during network failures
- **Database corruption**: Test data integrity scenarios
- **Memory leaks**: Test behavior during resource exhaustion
- **Clock skew**: Test behavior during time synchronization issues

### Monitoring Integration
- **Real-time dashboards**: Live chaos test monitoring
- **Alert integration**: Automated alerts for test failures
- **Metrics collection**: Detailed performance metrics
- **Trend analysis**: Long-term chaos test trends
