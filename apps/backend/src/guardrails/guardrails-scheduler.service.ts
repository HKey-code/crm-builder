import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuardrailsService } from './guardrails.service';

@Injectable()
export class GuardrailsSchedulerService {
  private readonly logger = new Logger(GuardrailsSchedulerService.name);

  constructor(private readonly guardrailsService: GuardrailsService) {}

  /**
   * Send weekly seat usage report every Monday at 9 AM
   */
  @Cron(CronExpression.EVERY_WEEK_AT_9AM)
  async sendWeeklyReport() {
    this.logger.log('Running scheduled weekly seat usage report...');
    
    try {
      await this.guardrailsService.sendWeeklyReport();
      this.logger.log('Weekly seat usage report sent successfully');
    } catch (error) {
      this.logger.error(`Failed to send weekly report: ${error.message}`);
    }
  }

  /**
   * Check for guardrail violations every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkGuardrailViolations() {
    this.logger.log('Checking for guardrail violations...');
    
    try {
      const alerts = await this.guardrailsService.checkGuardrailViolations();
      
      if (alerts.length > 0) {
        this.logger.warn(`Found ${alerts.length} guardrail violations`);
        await this.guardrailsService.sendGuardrailAlerts(alerts);
      } else {
        this.logger.log('No guardrail violations found');
      }
    } catch (error) {
      this.logger.error(`Failed to check guardrail violations: ${error.message}`);
    }
  }

  /**
   * Generate daily seat usage metrics (for trending)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyMetrics() {
    this.logger.log('Generating daily seat usage metrics...');
    
    try {
      const metrics = await this.guardrailsService.getSeatUsageMetrics();
      
      // Store daily metrics for trending (this would typically save to a metrics table)
      this.logger.log(`Generated daily metrics for ${metrics.length} tenant licenses`);
      
      // Log daily metrics generation for audit
      await this.guardrailsService['auditService'].logEvent({
        actorId: 'system',
        action: 'DAILY_METRICS_GENERATED',
        targetType: 'System',
        targetId: 'guardrails',
      });
    } catch (error) {
      this.logger.error(`Failed to generate daily metrics: ${error.message}`);
    }
  }

  /**
   * Send high usage alerts every 6 hours
   */
  @Cron('0 */6 * * *')
  async sendHighUsageAlerts() {
    this.logger.log('Checking for high usage tenants...');
    
    try {
      const metrics = await this.guardrailsService.getSeatUsageMetrics();
      const highUsageTenants = metrics.filter(m => m.usagePercentage >= 85);
      
      if (highUsageTenants.length > 0) {
        this.logger.warn(`Found ${highUsageTenants.length} tenants with high usage (>=85%)`);
        
        // Generate high usage report
        const report = {
          reportDate: new Date(),
          highUsageTenants,
          totalTenants: metrics.length,
          averageUsage: metrics.reduce((sum, m) => sum + m.usagePercentage, 0) / metrics.length,
        };
        
        // Send high usage alert email
        await this.sendHighUsageAlert(report);
      }
    } catch (error) {
      this.logger.error(`Failed to send high usage alerts: ${error.message}`);
    }
  }

  /**
   * Send high usage alert email
   */
  private async sendHighUsageAlert(report: any): Promise<void> {
    const content = `
High Usage Alert - ${report.reportDate.toLocaleDateString()}

Found ${report.highUsageTenants.length} tenants with usage >=85%:

${report.highUsageTenants.map(tenant => 
  `${tenant.tenantName} (${tenant.licenseType}): ${tenant.activeSeats}/${tenant.totalSeats} seats (${tenant.usagePercentage}%)`
).join('\n')}

Total tenants monitored: ${report.totalTenants}
Average usage across all tenants: ${Math.round(report.averageUsage * 100) / 100}%
    `;
    
    this.logger.log(`High Usage Alert Email Content:\n${content}`);
    
    // Example email integration:
    // await this.emailService.send({
    //   to: ['admin@company.com', 'finance@company.com'],
    //   subject: 'High Usage Alert - Seat Usage Monitoring',
    //   body: content,
    // });
  }

  /**
   * Generate monthly cost analysis report
   */
  @Cron('0 0 1 * *') // First day of every month at midnight
  async generateMonthlyCostReport() {
    this.logger.log('Generating monthly cost analysis report...');
    
    try {
      const metrics = await this.guardrailsService.getSeatUsageMetrics();
      
      // Calculate monthly cost metrics
      const costAnalysis = metrics.map(metric => {
        const basePrice = 100; // Mock base price per seat
        const totalCost = metric.totalSeats * basePrice;
        const activeCost = metric.activeSeats * basePrice;
        const unusedCost = (metric.totalSeats - metric.activeSeats) * basePrice;
        
        return {
          tenantId: metric.tenantId,
          tenantName: metric.tenantName,
          licenseType: metric.licenseType,
          totalCost,
          activeCost,
          unusedCost,
          efficiency: metric.usagePercentage,
        };
      });
      
      const totalCost = costAnalysis.reduce((sum, c) => sum + c.totalCost, 0);
      const totalUnusedCost = costAnalysis.reduce((sum, c) => sum + c.unusedCost, 0);
      const averageEfficiency = costAnalysis.reduce((sum, c) => sum + c.efficiency, 0) / costAnalysis.length;
      
      const monthlyReport = {
        reportDate: new Date(),
        period: 'Monthly',
        totalTenants: costAnalysis.length,
        totalCost,
        totalUnusedCost,
        averageEfficiency: Math.round(averageEfficiency * 100) / 100,
        costBreakdown: costAnalysis,
        recommendations: this.generateMonthlyRecommendations(costAnalysis),
      };
      
      await this.sendMonthlyCostReport(monthlyReport);
      
      this.logger.log('Monthly cost analysis report generated and sent');
    } catch (error) {
      this.logger.error(`Failed to generate monthly cost report: ${error.message}`);
    }
  }

  /**
   * Generate monthly recommendations
   */
  private generateMonthlyRecommendations(costAnalysis: any[]): string[] {
    const recommendations: string[] = [];
    
    const lowEfficiencyTenants = costAnalysis.filter(c => c.efficiency < 50);
    const highEfficiencyTenants = costAnalysis.filter(c => c.efficiency > 85);
    const totalUnusedCost = costAnalysis.reduce((sum, c) => sum + c.unusedCost, 0);
    
    if (lowEfficiencyTenants.length > 0) {
      recommendations.push(`Optimize seat allocation for ${lowEfficiencyTenants.length} tenants with low efficiency (<50%)`);
    }
    
    if (highEfficiencyTenants.length > 0) {
      recommendations.push(`Consider expanding capacity for ${highEfficiencyTenants.length} tenants with high efficiency (>85%)`);
    }
    
    if (totalUnusedCost > 5000) {
      recommendations.push(`Potential cost savings of $${totalUnusedCost} through seat optimization`);
    }
    
    return recommendations;
  }

  /**
   * Send monthly cost report email
   */
  private async sendMonthlyCostReport(report: any): Promise<void> {
    const content = `
Monthly Cost Analysis Report - ${report.reportDate.toLocaleDateString()}

SUMMARY:
- Total Tenants: ${report.totalTenants}
- Total Cost: $${report.totalCost}
- Unused Cost: $${report.totalUnusedCost}
- Average Efficiency: ${report.averageEfficiency}%

TOP TENANTS BY COST:
${report.costBreakdown
  .sort((a: any, b: any) => b.totalCost - a.totalCost)
  .slice(0, 10)
  .map((tenant: any) => 
    `${tenant.tenantName}: $${tenant.totalCost} (${tenant.efficiency}% efficiency)`
  ).join('\n')}

RECOMMENDATIONS:
${report.recommendations.map(rec => `- ${rec}`).join('\n')}
    `;
    
    this.logger.log(`Monthly Cost Report Email Content:\n${content}`);
    
    // Example email integration:
    // await this.emailService.send({
    //   to: ['admin@company.com', 'finance@company.com', 'executives@company.com'],
    //   subject: 'Monthly Cost Analysis Report - Seat Usage',
    //   body: content,
    // });
  }
}
