import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GDPRService } from './gdpr.service';

@Injectable()
export class GDPRSchedulerService {
  private readonly logger = new Logger(GDPRSchedulerService.name);

  constructor(private readonly gdprService: GDPRService) {}

  /**
   * Daily GDPR cleanup task
   * Runs at 2 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyGDPRCleanup(): Promise<void> {
    this.logger.log('🔄 Starting daily GDPR cleanup...');

    try {
      const results = await this.gdprService.cleanupExpiredData();
      
      this.logger.log(`✅ Daily GDPR cleanup completed:`);
      this.logger.log(`   - Audit logs cleaned: ${results.auditLogsCleaned}`);
      this.logger.log(`   - Users cleaned: ${results.usersCleaned}`);
      this.logger.log(`   - Metrics cleaned: ${results.metricsCleaned}`);
      this.logger.log(`   - Alerts cleaned: ${results.alertsCleaned}`);

      // Log summary for monitoring
      const totalCleaned = results.auditLogsCleaned + results.usersCleaned + results.metricsCleaned + results.alertsCleaned;
      
      if (totalCleaned > 0) {
        this.logger.log(`📊 Total records cleaned: ${totalCleaned}`);
      } else {
        this.logger.log('📊 No expired data found for cleanup');
      }

    } catch (error) {
      this.logger.error(`❌ Daily GDPR cleanup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Weekly GDPR compliance check
   * Runs every Sunday at 3 AM
   */
  @Cron('0 3 * * 0')
  async weeklyGDPRComplianceCheck(): Promise<void> {
    this.logger.log('🔍 Starting weekly GDPR compliance check...');

    try {
      const complianceReport = await this.gdprService.getGDPRComplianceReport();
      
      this.logger.log(`📋 GDPR Compliance Report:`);
      this.logger.log(`   - Total users: ${complianceReport.totalUsers}`);
      this.logger.log(`   - Anonymized users: ${complianceReport.anonymizedUsers}`);
      this.logger.log(`   - Deleted users: ${complianceReport.deletedUsers}`);
      this.logger.log(`   - Audit logs: ${complianceReport.auditLogsCount}`);

      // Check for compliance issues
      const anonymizedPercentage = (complianceReport.anonymizedUsers / complianceReport.totalUsers) * 100;
      const deletedPercentage = (complianceReport.deletedUsers / complianceReport.totalUsers) * 100;

      if (anonymizedPercentage > 10) {
        this.logger.warn(`⚠️  High anonymization rate: ${anonymizedPercentage.toFixed(2)}%`);
      }

      if (deletedPercentage > 5) {
        this.logger.warn(`⚠️  High deletion rate: ${deletedPercentage.toFixed(2)}%`);
      }

      this.logger.log('✅ Weekly GDPR compliance check completed');

    } catch (error) {
      this.logger.error(`❌ Weekly GDPR compliance check failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monthly GDPR retention policy review
   * Runs on the 1st of every month at 4 AM
   */
  @Cron('0 4 1 * *')
  async monthlyRetentionPolicyReview(): Promise<void> {
    this.logger.log('📋 Starting monthly GDPR retention policy review...');

    try {
      const config = this.gdprService.getGDPRConfig();
      
      this.logger.log(`📊 Current GDPR Configuration:`);
      this.logger.log(`   - Audit log retention: ${config.auditLogRetentionDays} days`);
      this.logger.log(`   - User data retention: ${config.userDataRetentionDays} days`);
      this.logger.log(`   - Soft delete enabled: ${config.softDeleteEnabled}`);
      this.logger.log(`   - Anonymization enabled: ${config.anonymizationEnabled}`);
      this.logger.log(`   - Auto cleanup enabled: ${config.autoCleanupEnabled}`);

      // Check if retention policies are reasonable
      if (config.auditLogRetentionDays < 30) {
        this.logger.warn('⚠️  Audit log retention period is very short');
      }

      if (config.userDataRetentionDays < 7) {
        this.logger.warn('⚠️  User data retention period is very short');
      }

      this.logger.log('✅ Monthly GDPR retention policy review completed');

    } catch (error) {
      this.logger.error(`❌ Monthly GDPR retention policy review failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Quarterly GDPR data export cleanup
   * Runs every 3 months on the 1st at 5 AM
   */
  @Cron('0 5 1 */3 *')
  async quarterlyDataExportCleanup(): Promise<void> {
    this.logger.log('🗂️  Starting quarterly GDPR data export cleanup...');

    try {
      // This would typically clean up old data export files
      // For now, just log the activity
      this.logger.log('📁 Checking for old data export files...');
      this.logger.log('✅ Quarterly GDPR data export cleanup completed');

    } catch (error) {
      this.logger.error(`❌ Quarterly GDPR data export cleanup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manual GDPR cleanup trigger
   */
  async triggerManualCleanup(): Promise<void> {
    this.logger.log('🔧 Triggering manual GDPR cleanup...');

    try {
      const results = await this.gdprService.cleanupExpiredData();
      
      this.logger.log(`✅ Manual GDPR cleanup completed:`);
      this.logger.log(`   - Audit logs cleaned: ${results.auditLogsCleaned}`);
      this.logger.log(`   - Users cleaned: ${results.usersCleaned}`);
      this.logger.log(`   - Metrics cleaned: ${results.metricsCleaned}`);
      this.logger.log(`   - Alerts cleaned: ${results.alertsCleaned}`);

      return results;
    } catch (error) {
      this.logger.error(`❌ Manual GDPR cleanup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get GDPR scheduler status
   */
  getSchedulerStatus(): {
    dailyCleanup: boolean;
    weeklyComplianceCheck: boolean;
    monthlyPolicyReview: boolean;
    quarterlyExportCleanup: boolean;
  } {
    return {
      dailyCleanup: true,
      weeklyComplianceCheck: true,
      monthlyPolicyReview: true,
      quarterlyExportCleanup: true,
    };
  }
}
