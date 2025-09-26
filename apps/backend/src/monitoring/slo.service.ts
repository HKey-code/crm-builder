import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

export interface SLOMetrics {
  licenseCheckLatency: number;
  licenseCheckSuccess: boolean;
  errorCode?: string;
  userId?: string;
  tenantId?: string;
  licenseType?: string;
  timestamp: Date;
}

export interface SLOThresholds {
  p99LatencyMs: number;
  successRateThreshold: number;
  errorSpikeThreshold: number;
}

export interface SLOAlert {
  type: 'LATENCY_THRESHOLD_EXCEEDED' | 'SUCCESS_RATE_DROPPED' | 'ERROR_SPIKE_DETECTED';
  message: string;
  severity: 'WARNING' | 'CRITICAL';
  metrics: SLOMetrics;
  timestamp: Date;
}

@Injectable()
export class SLOService {
  private readonly logger = new Logger(SLOService.name);
  private readonly metrics: SLOMetrics[] = [];
  private readonly maxMetricsHistory = 1000; // Keep last 1000 metrics

  // Default SLO thresholds
  private readonly defaultThresholds: SLOThresholds = {
    p99LatencyMs: 150,
    successRateThreshold: 0.999, // 99.9%
    errorSpikeThreshold: 5, // Alert if more than 5 errors in 5 minutes
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Record a license check metric
   */
  async recordLicenseCheck(metric: SLOMetrics): Promise<void> {
    try {
      // Add to in-memory metrics
      this.metrics.push(metric);
      
      // Keep only recent metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics.splice(0, this.metrics.length - this.maxMetricsHistory);
      }

      // Store in database for persistence
      await this.storeMetric(metric);

      // Check for SLO violations
      await this.checkSLOViolations(metric);

      this.logger.debug(`SLO metric recorded: ${metric.licenseCheckLatency}ms, success: ${metric.licenseCheckSuccess}`);
    } catch (error) {
      this.logger.error('Failed to record SLO metric', error);
    }
  }

  /**
   * Get current SLO status
   */
  async getSLOStatus(): Promise<{
    p99Latency: number;
    successRate: number;
    errorCount: number;
    isHealthy: boolean;
    alerts: SLOAlert[];
  }> {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes

    if (recentMetrics.length === 0) {
      return {
        p99Latency: 0,
        successRate: 1,
        errorCount: 0,
        isHealthy: true,
        alerts: [],
      };
    }

    const latencies = recentMetrics.map(m => m.licenseCheckLatency).sort((a, b) => a - b);
    const p99Index = Math.floor(latencies.length * 0.99);
    const p99Latency = latencies[p99Index] || 0;

    const successCount = recentMetrics.filter(m => m.licenseCheckSuccess).length;
    const successRate = recentMetrics.length > 0 ? successCount / recentMetrics.length : 1;

    const errorCount = recentMetrics.filter(m => !m.licenseCheckSuccess).length;

    const isHealthy = 
      p99Latency <= this.defaultThresholds.p99LatencyMs &&
      successRate >= this.defaultThresholds.successRateThreshold &&
      errorCount <= this.defaultThresholds.errorSpikeThreshold;

    const alerts = await this.generateAlerts(recentMetrics, p99Latency, successRate, errorCount);

    return {
      p99Latency,
      successRate,
      errorCount,
      isHealthy,
      alerts,
    };
  }

  /**
   * Get SLO metrics for a specific time range
   */
  async getSLOMetrics(
    startTime: Date,
    endTime: Date,
  ): Promise<{
    metrics: SLOMetrics[];
    summary: {
      totalChecks: number;
      successfulChecks: number;
      failedChecks: number;
      averageLatency: number;
      p95Latency: number;
      p99Latency: number;
      errorBreakdown: Record<string, number>;
    };
  }> {
    const metrics = await this.prisma.sLOMetric.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    const totalChecks = metrics.length;
    const successfulChecks = metrics.filter(m => m.success).length;
    const failedChecks = totalChecks - successfulChecks;

    const latencies = metrics.map(m => m.latencyMs).sort((a, b) => a - b);
    const averageLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);
    const p95Latency = latencies[p95Index] || 0;
    const p99Latency = latencies[p99Index] || 0;

    const errorBreakdown: Record<string, number> = {};
    metrics
      .filter(m => !m.success && m.errorCode)
      .forEach(m => {
        errorBreakdown[m.errorCode] = (errorBreakdown[m.errorCode] || 0) + 1;
      });

    return {
      metrics: metrics.map(m => ({
        licenseCheckLatency: m.latencyMs,
        licenseCheckSuccess: m.success,
        errorCode: m.errorCode,
        userId: m.userId,
        tenantId: m.tenantId,
        licenseType: m.licenseType,
        timestamp: m.timestamp,
      })),
      summary: {
        totalChecks,
        successfulChecks,
        failedChecks,
        averageLatency,
        p95Latency,
        p99Latency,
        errorBreakdown,
      },
    };
  }

  /**
   * Get error spike analysis
   */
  async getErrorSpikeAnalysis(): Promise<{
    recentErrors: Array<{
      errorCode: string;
      count: number;
      percentage: number;
    }>;
    spikeDetected: boolean;
    recommendations: string[];
  }> {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    const errors = recentMetrics.filter(m => !m.licenseCheckSuccess);

    const errorCounts: Record<string, number> = {};
    errors.forEach(error => {
      const code = error.errorCode || 'UNKNOWN';
      errorCounts[code] = (errorCounts[code] || 0) + 1;
    });

    const totalErrors = errors.length;
    const recentErrors = Object.entries(errorCounts)
      .map(([code, count]) => ({
        errorCode: code,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const spikeDetected = totalErrors > this.defaultThresholds.errorSpikeThreshold;

    const recommendations: string[] = [];
    if (spikeDetected) {
      recommendations.push('High error rate detected - investigate immediately');
      
      const topError = recentErrors[0];
      if (topError) {
        switch (topError.errorCode) {
          case 'SEAT_EXPIRED':
            recommendations.push('Check for expired user licenses and renewal processes');
            break;
          case 'NO_TENANT_LICENSE':
            recommendations.push('Verify tenant license configuration and activation');
            break;
          case 'LICENSE_NOT_ASSIGNED':
            recommendations.push('Review user license assignment workflows');
            break;
          default:
            recommendations.push(`Investigate ${topError.errorCode} errors`);
        }
      }
    }

    return {
      recentErrors,
      spikeDetected,
      recommendations,
    };
  }

  /**
   * Private methods
   */
  private async storeMetric(metric: SLOMetrics): Promise<void> {
    await this.prisma.sLOMetric.create({
      data: {
        latencyMs: metric.licenseCheckLatency,
        success: metric.licenseCheckSuccess,
        errorCode: metric.errorCode,
        userId: metric.userId,
        tenantId: metric.tenantId,
        licenseType: metric.licenseType,
        timestamp: metric.timestamp,
      },
    });
  }

  private getRecentMetrics(timeWindowMs: number): SLOMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  private async checkSLOViolations(metric: SLOMetrics): Promise<void> {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    
    if (recentMetrics.length < 10) return; // Need minimum data points

    const latencies = recentMetrics.map(m => m.licenseCheckLatency).sort((a, b) => a - b);
    const p99Index = Math.floor(latencies.length * 0.99);
    const p99Latency = latencies[p99Index] || 0;

    const successCount = recentMetrics.filter(m => m.licenseCheckSuccess).length;
    const successRate = recentMetrics.length > 0 ? successCount / recentMetrics.length : 1;

    const errorCount = recentMetrics.filter(m => !m.licenseCheckSuccess).length;

    // Check for violations
    if (p99Latency > this.defaultThresholds.p99LatencyMs) {
      await this.createAlert({
        type: 'LATENCY_THRESHOLD_EXCEEDED',
        message: `P99 latency ${p99Latency}ms exceeds threshold ${this.defaultThresholds.p99LatencyMs}ms`,
        severity: 'WARNING',
        metrics: metric,
        timestamp: new Date(),
      });
    }

    if (successRate < this.defaultThresholds.successRateThreshold) {
      await this.createAlert({
        type: 'SUCCESS_RATE_DROPPED',
        message: `Success rate ${(successRate * 100).toFixed(2)}% below threshold ${(this.defaultThresholds.successRateThreshold * 100).toFixed(2)}%`,
        severity: 'CRITICAL',
        metrics: metric,
        timestamp: new Date(),
      });
    }

    if (errorCount > this.defaultThresholds.errorSpikeThreshold) {
      await this.createAlert({
        type: 'ERROR_SPIKE_DETECTED',
        message: `${errorCount} errors detected in last 5 minutes, exceeding threshold ${this.defaultThresholds.errorSpikeThreshold}`,
        severity: 'CRITICAL',
        metrics: metric,
        timestamp: new Date(),
      });
    }
  }

  private async generateAlerts(
    recentMetrics: SLOMetrics[],
    p99Latency: number,
    successRate: number,
    errorCount: number,
  ): Promise<SLOAlert[]> {
    const alerts: SLOAlert[] = [];

    if (p99Latency > this.defaultThresholds.p99LatencyMs) {
      alerts.push({
        type: 'LATENCY_THRESHOLD_EXCEEDED',
        message: `P99 latency ${p99Latency}ms exceeds threshold ${this.defaultThresholds.p99LatencyMs}ms`,
        severity: 'WARNING',
        metrics: recentMetrics[recentMetrics.length - 1],
        timestamp: new Date(),
      });
    }

    if (successRate < this.defaultThresholds.successRateThreshold) {
      alerts.push({
        type: 'SUCCESS_RATE_DROPPED',
        message: `Success rate ${(successRate * 100).toFixed(2)}% below threshold ${(this.defaultThresholds.successRateThreshold * 100).toFixed(2)}%`,
        severity: 'CRITICAL',
        metrics: recentMetrics[recentMetrics.length - 1],
        timestamp: new Date(),
      });
    }

    if (errorCount > this.defaultThresholds.errorSpikeThreshold) {
      alerts.push({
        type: 'ERROR_SPIKE_DETECTED',
        message: `${errorCount} errors detected in last 5 minutes, exceeding threshold ${this.defaultThresholds.errorSpikeThreshold}`,
        severity: 'CRITICAL',
        metrics: recentMetrics[recentMetrics.length - 1],
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  private async createAlert(alert: SLOAlert): Promise<void> {
    // Log the alert
    this.logger.warn(`SLO Alert: ${alert.type} - ${alert.message}`);

    // Store in database
    await this.prisma.sLOAlert.create({
      data: {
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp,
        metrics: {
          latencyMs: alert.metrics.licenseCheckLatency,
          success: alert.metrics.licenseCheckSuccess,
          errorCode: alert.metrics.errorCode,
          userId: alert.metrics.userId,
          tenantId: alert.metrics.tenantId,
          licenseType: alert.metrics.licenseType,
        },
      },
    });

    // Audit log the alert
    await this.auditService.logEvent({
      actorId: 'system',
      action: 'SLO_ALERT',
      targetType: 'LICENSE_CHECK',
      targetId: 'system',
    });
  }
}
