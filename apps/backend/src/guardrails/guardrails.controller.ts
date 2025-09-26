import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { GuardrailsService, SeatUsageMetrics, GuardrailAlert, CostGuardrailConfig } from './guardrails.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  SeatUsageMetricsDto,
  GuardrailAlertDto,
  CostGuardrailConfigDto,
  UpdateGuardrailConfigDto,
  DashboardDataDto,
  DashboardCardDto,
  CostAnalysisDto,
  WeeklyReportDto,
  SeatUsageTrendsDto,
  AlertHistoryDto,
} from './dto/guardrails.dto';

@ApiTags('guardrails')
@ApiBearerAuth()
@Controller('guardrails')
@UseGuards(RolesGuard)
export class GuardrailsController {
  constructor(private readonly guardrailsService: GuardrailsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard data for seat usage monitoring' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully', type: DashboardDataDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getDashboardData(): Promise<DashboardDataDto> {
    return await this.guardrailsService.getDashboardData();
  }

  @Get('seat-usage')
  @ApiOperation({ summary: 'Get seat usage metrics for all tenants' })
  @ApiResponse({ status: 200, description: 'Seat usage metrics retrieved successfully', type: [SeatUsageMetricsDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getSeatUsageMetrics(): Promise<SeatUsageMetricsDto[]> {
    return await this.guardrailsService.getSeatUsageMetrics();
  }

  @Get('seat-usage/:tenantId')
  @ApiOperation({ summary: 'Get seat usage metrics for a specific tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID to get metrics for' })
  @ApiResponse({ status: 200, description: 'Tenant seat usage metrics retrieved successfully', type: [SeatUsageMetricsDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @Roles('admin')
  async getTenantSeatUsage(@Param('tenantId') tenantId: string): Promise<SeatUsageMetricsDto[]> {
    return await this.guardrailsService.getTenantSeatUsage(tenantId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Check for guardrail violations and get alerts' })
  @ApiResponse({ status: 200, description: 'Guardrail alerts retrieved successfully', type: [GuardrailAlertDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getGuardrailAlerts(): Promise<GuardrailAlertDto[]> {
    return await this.guardrailsService.checkGuardrailViolations();
  }

  @Post('alerts/send')
  @ApiOperation({ summary: 'Send email alerts for guardrail violations' })
  @ApiResponse({ status: 200, description: 'Guardrail alerts sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async sendGuardrailAlerts() {
    const alerts = await this.guardrailsService.checkGuardrailViolations();
    await this.guardrailsService.sendGuardrailAlerts(alerts);
    return { message: `Sent ${alerts.length} guardrail alerts` };
  }

  @Get('weekly-report')
  @ApiOperation({ summary: 'Generate weekly seat usage report' })
  @ApiResponse({ status: 200, description: 'Weekly report generated successfully', type: WeeklyReportDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async generateWeeklyReport(): Promise<WeeklyReportDto> {
    return await this.guardrailsService.generateWeeklyReport();
  }

  @Post('weekly-report/send')
  @ApiOperation({ summary: 'Send weekly seat usage report email' })
  @ApiResponse({ status: 200, description: 'Weekly report sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async sendWeeklyReport() {
    await this.guardrailsService.sendWeeklyReport();
    return { message: 'Weekly report sent successfully' };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get current guardrail configuration' })
  @ApiResponse({ status: 200, description: 'Guardrail configuration retrieved successfully', type: CostGuardrailConfigDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getGuardrailConfig(): Promise<CostGuardrailConfigDto> {
    return await this.guardrailsService.getGuardrailConfig();
  }

  @Post('config')
  @ApiOperation({ summary: 'Update guardrail configuration' })
  @ApiResponse({ status: 200, description: 'Guardrail configuration updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async updateGuardrailConfig(@Body() config: UpdateGuardrailConfigDto) {
    await this.guardrailsService.updateGuardrailConfig(config);
    return { message: 'Guardrail configuration updated successfully' };
  }

  @Get('trends/:tenantId')
  @ApiOperation({ summary: 'Get seat usage trends for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID to get trends for' })
  @ApiQuery({ name: 'days', description: 'Number of days to get trends for', required: false })
  @ApiResponse({ status: 200, description: 'Seat usage trends retrieved successfully', type: [SeatUsageTrendsDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @Roles('admin')
  async getSeatUsageTrends(
    @Param('tenantId') tenantId: string,
    @Query('days') days: number = 30,
  ): Promise<SeatUsageTrendsDto[]> {
    return await this.guardrailsService.getSeatUsageTrends(tenantId, days);
  }

  @Get('metrics/summary')
  @ApiOperation({ summary: 'Get summary metrics for cost guardrails' })
  @ApiResponse({ status: 200, description: 'Summary metrics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getSummaryMetrics() {
    const metrics = await this.guardrailsService.getSeatUsageMetrics();
    const alerts = await this.guardrailsService.checkGuardrailViolations();

    const totalTenants = new Set(metrics.map(m => m.tenantId)).size;
    const totalLicenses = metrics.length;
    const totalSeats = metrics.reduce((sum, m) => sum + m.totalSeats, 0);
    const activeSeats = metrics.reduce((sum, m) => sum + m.activeSeats, 0);
    const averageUsage = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.usagePercentage, 0) / metrics.length 
      : 0;

    const highUsageTenants = metrics.filter(m => m.usagePercentage >= 85).length;
    const criticalTenants = metrics.filter(m => m.usagePercentage >= 95).length;

    return {
      summary: {
        totalTenants,
        totalLicenses,
        totalSeats,
        activeSeats,
        averageUsage: Math.round(averageUsage * 100) / 100,
        highUsageTenants,
        criticalTenants,
        activeAlerts: alerts.length,
      },
      topTenants: metrics
        .sort((a, b) => b.usagePercentage - a.usagePercentage)
        .slice(0, 10),
      recentAlerts: alerts.slice(0, 5),
    };
  }

  @Get('dashboard/card/:tenantId')
  @ApiOperation({ summary: 'Get dashboard card data for a specific tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID to get card data for' })
  @ApiResponse({ status: 200, description: 'Dashboard card data retrieved successfully', type: DashboardCardDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @Roles('admin')
  async getDashboardCard(@Param('tenantId') tenantId: string): Promise<DashboardCardDto> {
    const metrics = await this.guardrailsService.getTenantSeatUsage(tenantId);
    
    if (metrics.length === 0) {
      return { message: 'No seat usage data found for this tenant' };
    }

    const totalActiveSeats = metrics.reduce((sum, m) => sum + m.activeSeats, 0);
    const totalSeats = metrics.reduce((sum, m) => sum + m.totalSeats, 0);
    const averageUsage = metrics.reduce((sum, m) => sum + m.usagePercentage, 0) / metrics.length;

    const alerts = await this.guardrailsService.checkGuardrailViolations();
    const tenantAlerts = alerts.filter(a => a.tenantId === tenantId);

    return {
      tenantId,
      tenantName: metrics[0]?.tenantName || 'Unknown',
      totalActiveSeats,
      totalSeats,
      averageUsage: Math.round(averageUsage * 100) / 100,
      usagePercentage: totalSeats > 0 ? Math.round((totalActiveSeats / totalSeats) * 10000) / 100 : 0,
      alerts: tenantAlerts,
      lastUpdated: new Date(),
    };
  }

  @Get('cost-analysis')
  @ApiOperation({ summary: 'Get cost analysis based on seat usage' })
  @ApiResponse({ status: 200, description: 'Cost analysis retrieved successfully', type: CostAnalysisDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getCostAnalysis(): Promise<CostAnalysisDto> {
    const metrics = await this.guardrailsService.getSeatUsageMetrics();
    
    // Calculate cost metrics (example with mock pricing)
    const costAnalysis = metrics.map(metric => {
      const basePrice = 100; // Mock base price per seat
      const totalCost = metric.totalSeats * basePrice;
      const activeCost = metric.activeSeats * basePrice;
      const unusedCost = (metric.totalSeats - metric.activeSeats) * basePrice;
      const costEfficiency = metric.usagePercentage;

      return {
        tenantId: metric.tenantId,
        tenantName: metric.tenantName,
        licenseType: metric.licenseType,
        totalCost,
        activeCost,
        unusedCost,
        costEfficiency,
        usagePercentage: metric.usagePercentage,
      };
    });

    const totalCost = costAnalysis.reduce((sum, c) => sum + c.totalCost, 0);
    const totalActiveCost = costAnalysis.reduce((sum, c) => sum + c.activeCost, 0);
    const totalUnusedCost = costAnalysis.reduce((sum, c) => sum + c.unusedCost, 0);
    const averageEfficiency = costAnalysis.reduce((sum, c) => sum + c.costEfficiency, 0) / costAnalysis.length;

    return {
      summary: {
        totalCost,
        totalActiveCost,
        totalUnusedCost,
        averageEfficiency: Math.round(averageEfficiency * 100) / 100,
        totalTenants: costAnalysis.length,
      },
      tenantBreakdown: costAnalysis,
      recommendations: this.generateCostRecommendations(costAnalysis),
    };
  }

  private generateCostRecommendations(costAnalysis: any[]): string[] {
    const recommendations: string[] = [];

    const lowEfficiencyTenants = costAnalysis.filter(c => c.costEfficiency < 50);
    const highEfficiencyTenants = costAnalysis.filter(c => c.costEfficiency > 85);

    if (lowEfficiencyTenants.length > 0) {
      recommendations.push(`Consider reducing seat allocation for ${lowEfficiencyTenants.length} tenants with low usage (<50%)`);
    }

    if (highEfficiencyTenants.length > 0) {
      recommendations.push(`Consider expanding seat allocation for ${highEfficiencyTenants.length} tenants with high usage (>85%)`);
    }

    const totalUnusedCost = costAnalysis.reduce((sum, c) => sum + c.unusedCost, 0);
    if (totalUnusedCost > 10000) { // Mock threshold
      recommendations.push('Significant unused capacity detected. Consider seat optimization strategies.');
    }

    return recommendations;
  }

  @Get('alerts/history')
  @ApiOperation({ summary: 'Get historical guardrail alerts' })
  @ApiQuery({ name: 'days', description: 'Number of days to look back', required: false })
  @ApiResponse({ status: 200, description: 'Alert history retrieved successfully', type: AlertHistoryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getAlertHistory(@Query('days') days: number = 30): Promise<AlertHistoryDto> {
    // This would typically query historical alert data
    // For now, return current alerts as a placeholder
    const alerts = await this.guardrailsService.checkGuardrailViolations();
    
    return {
      period: `${days} days`,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.alertType === 'CRITICAL').length,
      warningAlerts: alerts.filter(a => a.alertType === 'WARNING').length,
      alerts: alerts,
    };
  }
}
