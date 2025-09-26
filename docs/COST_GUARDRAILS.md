# Cost Guardrails - Seat Usage Monitoring & Alerts

This document provides comprehensive information about the cost guardrails system that monitors seat usage, provides dashboard insights, and sends automated email alerts when usage exceeds thresholds.

## Overview

The cost guardrails system provides:
- **Real-time seat usage monitoring** across all tenants
- **Dashboard cards** showing "activeSeats / totalSeats (% used)" by tenant
- **Automated email alerts** when usage exceeds 85% (configurable)
- **Weekly reports** with usage trends and recommendations
- **Cost analysis** with optimization recommendations
- **Scheduled monitoring** with configurable thresholds

## Dashboard Features

### 1. Seat Usage Dashboard Card

#### Purpose
Provides a quick overview of seat usage for each tenant with percentage utilization.

#### Dashboard Card Data
```json
{
  "tenantId": "tenant-123",
  "tenantName": "Acme Corp",
  "totalActiveSeats": 85,
  "totalSeats": 100,
  "averageUsage": 85.0,
  "usagePercentage": 85.0,
  "alerts": [
    {
      "alertType": "WARNING",
      "message": "WARNING: Tenant Acme Corp has reached 85% seat usage for SMART_SERVICE license. Consider expanding capacity."
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

#### API Endpoint
```http
GET /guardrails/dashboard/card/{tenantId}
```

### 2. Summary Metrics Dashboard

#### Purpose
Provides high-level overview of seat usage across all tenants.

#### Dashboard Summary
```json
{
  "summary": {
    "totalTenants": 25,
    "totalLicenses": 50,
    "totalSeats": 2500,
    "activeSeats": 2100,
    "averageUsage": 84.0,
    "highUsageTenants": 8,
    "criticalTenants": 3,
    "activeAlerts": 11
  },
  "topTenants": [
    {
      "tenantId": "tenant-123",
      "tenantName": "Acme Corp",
      "licenseType": "SMART_SERVICE",
      "activeSeats": 85,
      "totalSeats": 100,
      "usagePercentage": 85.0
    }
  ],
  "recentAlerts": [
    {
      "alertType": "WARNING",
      "tenantName": "Acme Corp",
      "message": "WARNING: Tenant Acme Corp has reached 85% seat usage..."
    }
  ]
}
```

#### API Endpoint
```http
GET /guardrails/metrics/summary
```

## Email Alert System

### 1. Weekly Reports

#### Schedule
- **Frequency**: Every Monday at 9 AM
- **Recipients**: Configurable list of email addresses
- **Content**: Usage summary, high usage tenants, alerts, recommendations

#### Weekly Report Content
```
Weekly Seat Usage Report - January 15, 2024

SUMMARY:
- Total Tenants: 25
- Total Licenses: 50
- Average Usage: 84.0%

HIGH USAGE TENANTS (>70%):
Acme Corp (SMART_SERVICE):
  - Active Seats: 85/100
  - Usage: 85.0%

TechStart Inc (SMART_SALES):
  - Active Seats: 42/50
  - Usage: 84.0%

ALERTS:
- WARNING: Tenant Acme Corp has reached 85% seat usage for SMART_SERVICE license. Consider expanding capacity.
- WARNING: Tenant TechStart Inc has reached 84% seat usage for SMART_SALES license. Consider expanding capacity.
```

### 2. High Usage Alerts

#### Schedule
- **Frequency**: Every 6 hours
- **Trigger**: Usage >= 85%
- **Recipients**: Admin and finance teams

#### Alert Content
```
High Usage Alert - January 15, 2024

Found 3 tenants with usage >=85%:

Acme Corp (SMART_SERVICE): 85/100 seats (85.0%)
TechStart Inc (SMART_SALES): 42/50 seats (84.0%)
Global Solutions (SMART_SERVICE): 38/45 seats (84.4%)

Total tenants monitored: 25
Average usage across all tenants: 84.0%
```

### 3. Monthly Cost Analysis

#### Schedule
- **Frequency**: First day of every month at midnight
- **Content**: Cost breakdown, efficiency analysis, recommendations

#### Monthly Report Content
```
Monthly Cost Analysis Report - January 1, 2024

SUMMARY:
- Total Tenants: 25
- Total Cost: $250,000
- Unused Cost: $40,000
- Average Efficiency: 84.0%

TOP TENANTS BY COST:
Acme Corp: $10,000 (85% efficiency)
TechStart Inc: $5,000 (84% efficiency)
Global Solutions: $4,500 (84% efficiency)

RECOMMENDATIONS:
- Optimize seat allocation for 5 tenants with low efficiency (<50%)
- Consider expanding capacity for 8 tenants with high efficiency (>85%)
- Potential cost savings of $40,000 through seat optimization
```

## Configuration

### Guardrail Settings

#### Default Configuration
```json
{
  "warningThreshold": 85,
  "criticalThreshold": 95,
  "emailEnabled": true,
  "weeklyReportEnabled": true,
  "alertRecipients": [
    "admin@company.com",
    "finance@company.com"
  ]
}
```

#### Update Configuration
```http
POST /guardrails/config
Content-Type: application/json

{
  "warningThreshold": 80,
  "criticalThreshold": 90,
  "emailEnabled": true,
  "weeklyReportEnabled": true,
  "alertRecipients": [
    "admin@company.com",
    "finance@company.com",
    "executives@company.com"
  ]
}
```

### Thresholds
- **Warning Threshold**: Default 85% - sends warning alerts
- **Critical Threshold**: Default 95% - sends critical alerts
- **High Usage**: 70%+ - included in weekly reports
- **Low Efficiency**: <50% - flagged for optimization

## API Endpoints

### Dashboard & Metrics

#### Get Dashboard Data
```http
GET /guardrails/dashboard
Authorization: Bearer {token}
```

#### Get Seat Usage Metrics
```http
GET /guardrails/seat-usage
Authorization: Bearer {token}
```

#### Get Tenant Seat Usage
```http
GET /guardrails/seat-usage/{tenantId}
Authorization: Bearer {token}
```

#### Get Dashboard Card
```http
GET /guardrails/dashboard/card/{tenantId}
Authorization: Bearer {token}
```

### Alerts & Monitoring

#### Get Guardrail Alerts
```http
GET /guardrails/alerts
Authorization: Bearer {token}
```

#### Send Guardrail Alerts
```http
POST /guardrails/alerts/send
Authorization: Bearer {token}
```

#### Get Alert History
```http
GET /guardrails/alerts/history?days=30
Authorization: Bearer {token}
```

### Reports & Analysis

#### Generate Weekly Report
```http
GET /guardrails/weekly-report
Authorization: Bearer {token}
```

#### Send Weekly Report
```http
POST /guardrails/weekly-report/send
Authorization: Bearer {token}
```

#### Get Cost Analysis
```http
GET /guardrails/cost-analysis
Authorization: Bearer {token}
```

#### Get Seat Usage Trends
```http
GET /guardrails/trends/{tenantId}?days=30
Authorization: Bearer {token}
```

### Configuration

#### Get Configuration
```http
GET /guardrails/config
Authorization: Bearer {token}
```

#### Update Configuration
```http
POST /guardrails/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "warningThreshold": 80,
  "criticalThreshold": 90,
  "emailEnabled": true,
  "weeklyReportEnabled": true,
  "alertRecipients": ["admin@company.com"]
}
```

## Scheduled Tasks

### Automated Monitoring

#### Hourly Guardrail Checks
```typescript
@Cron(CronExpression.EVERY_HOUR)
async checkGuardrailViolations() {
  // Check for violations and send alerts
}
```

#### Weekly Reports
```typescript
@Cron(CronExpression.EVERY_WEEK_AT_9AM)
async sendWeeklyReport() {
  // Generate and send weekly report
}
```

#### Daily Metrics
```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async generateDailyMetrics() {
  // Store daily metrics for trending
}
```

#### High Usage Alerts
```typescript
@Cron('0 */6 * * *') // Every 6 hours
async sendHighUsageAlerts() {
  // Send alerts for high usage tenants
}
```

#### Monthly Cost Reports
```typescript
@Cron('0 0 1 * *') // First day of every month
async generateMonthlyCostReport() {
  // Generate monthly cost analysis
}
```

## Cost Analysis

### Cost Metrics
- **Total Cost**: Sum of all seat costs across tenants
- **Active Cost**: Cost of actively used seats
- **Unused Cost**: Cost of unused seats
- **Efficiency**: Percentage of seats actively used

### Cost Optimization
- **Low Efficiency Detection**: Tenants with <50% usage
- **High Usage Detection**: Tenants with >85% usage
- **Cost Savings Calculation**: Potential savings from optimization
- **Recommendations**: Actionable optimization suggestions

### Example Cost Analysis
```json
{
  "summary": {
    "totalCost": 250000,
    "totalActiveCost": 210000,
    "totalUnusedCost": 40000,
    "averageEfficiency": 84.0,
    "totalTenants": 25
  },
  "tenantBreakdown": [
    {
      "tenantId": "tenant-123",
      "tenantName": "Acme Corp",
      "licenseType": "SMART_SERVICE",
      "totalCost": 10000,
      "activeCost": 8500,
      "unusedCost": 1500,
      "costEfficiency": 85.0,
      "usagePercentage": 85.0
    }
  ],
  "recommendations": [
    "Consider reducing seat allocation for 5 tenants with low usage (<50%)",
    "Consider expanding seat allocation for 8 tenants with high usage (>85%)",
    "Significant unused capacity detected. Consider seat optimization strategies."
  ]
}
```

## Integration Examples

### Frontend Dashboard Integration

#### React Component Example
```typescript
import React, { useEffect, useState } from 'react';

interface DashboardCard {
  tenantId: string;
  tenantName: string;
  totalActiveSeats: number;
  totalSeats: number;
  usagePercentage: number;
  alerts: any[];
}

const SeatUsageCard: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [cardData, setCardData] = useState<DashboardCard | null>(null);

  useEffect(() => {
    fetch(`/api/guardrails/dashboard/card/${tenantId}`)
      .then(res => res.json())
      .then(setCardData);
  }, [tenantId]);

  if (!cardData) return <div>Loading...</div>;

  return (
    <div className="seat-usage-card">
      <h3>{cardData.tenantName}</h3>
      <div className="usage-bar">
        <div 
          className="usage-fill" 
          style={{ width: `${cardData.usagePercentage}%` }}
        />
      </div>
      <div className="usage-text">
        {cardData.totalActiveSeats} / {cardData.totalSeats} seats ({cardData.usagePercentage}%)
      </div>
      {cardData.alerts.length > 0 && (
        <div className="alerts">
          {cardData.alerts.map(alert => (
            <div key={alert.timestamp} className={`alert ${alert.alertType.toLowerCase()}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Email Integration

#### Email Service Example
```typescript
// Example email service integration
class EmailService {
  async sendWeeklyReport(content: string, recipients: string[]) {
    // Integration with your email service (SendGrid, AWS SES, etc.)
    await this.emailProvider.send({
      to: recipients,
      subject: 'Weekly Seat Usage Report',
      body: content,
    });
  }

  async sendAlert(alert: GuardrailAlert, recipients: string[]) {
    await this.emailProvider.send({
      to: recipients,
      subject: `Guardrail Alert: ${alert.alertType} - ${alert.tenantName}`,
      body: alert.message,
    });
  }
}
```

## Monitoring & Alerting

### Key Metrics
- **Seat Usage Percentage**: Real-time usage across all tenants
- **Alert Frequency**: Number of alerts generated per period
- **Cost Efficiency**: Average efficiency across all tenants
- **Response Time**: Time to detect and alert on violations

### Alert Thresholds
- **Warning Level**: 85% usage (configurable)
- **Critical Level**: 95% usage (configurable)
- **High Usage**: 70%+ (included in reports)
- **Low Efficiency**: <50% (flagged for optimization)

### Alert Types
- **WARNING**: Usage >= warning threshold
- **CRITICAL**: Usage >= critical threshold
- **High Usage**: Usage >= 70% (weekly reports)
- **Cost Optimization**: Low efficiency detection

## Best Practices

### Configuration
- **Set appropriate thresholds**: Balance between early warning and alert fatigue
- **Configure recipients**: Include relevant stakeholders (admin, finance, executives)
- **Test email delivery**: Ensure alerts reach intended recipients
- **Monitor alert frequency**: Adjust thresholds if too many/few alerts

### Monitoring
- **Regular review**: Weekly review of usage trends
- **Cost optimization**: Monthly cost analysis and optimization
- **Capacity planning**: Use trends for future capacity planning
- **Alert management**: Respond to alerts promptly

### Integration
- **Dashboard integration**: Embed cards in existing dashboards
- **Email integration**: Connect with your email service provider
- **Notification channels**: Consider Slack, Teams, or other notification methods
- **Escalation procedures**: Define escalation for critical alerts

## Troubleshooting

### Common Issues

#### Alerts Not Sending
```bash
# Check email configuration
curl -X GET /guardrails/config

# Test alert generation
curl -X GET /guardrails/alerts

# Check logs for email errors
tail -f /var/log/application.log | grep -i email
```

#### Dashboard Not Loading
```bash
# Check API health
curl -X GET /guardrails/dashboard

# Verify authentication
curl -H "Authorization: Bearer {token}" /guardrails/dashboard

# Check database connectivity
curl -X GET /health
```

#### High Alert Frequency
```bash
# Adjust thresholds
curl -X POST /guardrails/config \
  -H "Content-Type: application/json" \
  -d '{"warningThreshold": 90, "criticalThreshold": 95}'

# Review current usage
curl -X GET /guardrails/seat-usage
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm run start:dev

# Check scheduled tasks
tail -f /var/log/application.log | grep -i guardrail

# Test individual components
curl -X GET /guardrails/weekly-report
curl -X POST /guardrails/weekly-report/send
```

## Future Enhancements

### Planned Features
- **Real-time notifications**: WebSocket-based real-time alerts
- **Advanced analytics**: Predictive capacity planning
- **Cost optimization**: Automated seat reallocation suggestions
- **Multi-channel alerts**: Slack, Teams, SMS integration

### Advanced Monitoring
- **Usage patterns**: Identify usage patterns and trends
- **Seasonal analysis**: Account for seasonal usage variations
- **Capacity forecasting**: Predict future capacity needs
- **Cost forecasting**: Predict future costs based on trends

### Integration Enhancements
- **BI tools integration**: Connect with Tableau, Power BI
- **CRM integration**: Link with customer data for insights
- **Billing integration**: Connect with billing systems
- **API webhooks**: Real-time notifications to external systems
