import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, Min, Max } from 'class-validator';

export class SeatUsageMetricsDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'Tenant name' })
  @IsString()
  tenantName: string;

  @ApiProperty({ description: 'License type' })
  @IsString()
  licenseType: string;

  @ApiProperty({ description: 'Number of active seats' })
  @IsNumber()
  activeSeats: number;

  @ApiProperty({ description: 'Total number of seats' })
  @IsNumber()
  totalSeats: number;

  @ApiProperty({ description: 'Usage percentage' })
  @IsNumber()
  usagePercentage: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}

export class GuardrailAlertDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'Tenant name' })
  @IsString()
  tenantName: string;

  @ApiProperty({ description: 'License type' })
  @IsString()
  licenseType: string;

  @ApiProperty({ description: 'Current usage percentage' })
  @IsNumber()
  currentUsage: number;

  @ApiProperty({ description: 'Threshold percentage' })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Alert type (WARNING or CRITICAL)', enum: ['WARNING', 'CRITICAL'] })
  @IsString()
  alertType: 'WARNING' | 'CRITICAL';

  @ApiProperty({ description: 'Alert message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Alert timestamp' })
  timestamp: Date;
}

export class CostGuardrailConfigDto {
  @ApiProperty({ description: 'Warning threshold percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  warningThreshold: number;

  @ApiProperty({ description: 'Critical threshold percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  criticalThreshold: number;

  @ApiProperty({ description: 'Whether email alerts are enabled' })
  @IsBoolean()
  emailEnabled: boolean;

  @ApiProperty({ description: 'Whether weekly reports are enabled' })
  @IsBoolean()
  weeklyReportEnabled: boolean;

  @ApiProperty({ description: 'List of email addresses to send alerts to' })
  @IsArray()
  @IsString({ each: true })
  alertRecipients: string[];
}

export class UpdateGuardrailConfigDto {
  @ApiProperty({ description: 'Warning threshold percentage', required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  warningThreshold?: number;

  @ApiProperty({ description: 'Critical threshold percentage', required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  criticalThreshold?: number;

  @ApiProperty({ description: 'Whether email alerts are enabled', required: false })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiProperty({ description: 'Whether weekly reports are enabled', required: false })
  @IsOptional()
  @IsBoolean()
  weeklyReportEnabled?: boolean;

  @ApiProperty({ description: 'List of email addresses to send alerts to', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alertRecipients?: string[];
}

export class DashboardDataDto {
  @ApiProperty({ description: 'Total number of tenants' })
  @IsNumber()
  totalTenants: number;

  @ApiProperty({ description: 'Total number of licenses' })
  @IsNumber()
  totalLicenses: number;

  @ApiProperty({ description: 'Average usage percentage' })
  @IsNumber()
  averageUsage: number;

  @ApiProperty({ description: 'Number of tenants with high usage' })
  @IsNumber()
  highUsageCount: number;

  @ApiProperty({ description: 'Number of tenants with critical usage' })
  @IsNumber()
  criticalCount: number;

  @ApiProperty({ description: 'Recent guardrail alerts', type: [GuardrailAlertDto] })
  recentAlerts: GuardrailAlertDto[];
}

export class DashboardCardDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'Tenant name' })
  @IsString()
  tenantName: string;

  @ApiProperty({ description: 'Total active seats' })
  @IsNumber()
  totalActiveSeats: number;

  @ApiProperty({ description: 'Total seats' })
  @IsNumber()
  totalSeats: number;

  @ApiProperty({ description: 'Average usage percentage' })
  @IsNumber()
  averageUsage: number;

  @ApiProperty({ description: 'Usage percentage' })
  @IsNumber()
  usagePercentage: number;

  @ApiProperty({ description: 'Guardrail alerts for this tenant', type: [GuardrailAlertDto] })
  alerts: GuardrailAlertDto[];

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}

export class CostAnalysisDto {
  @ApiProperty({ description: 'Cost analysis summary' })
  summary: {
    totalCost: number;
    totalActiveCost: number;
    totalUnusedCost: number;
    averageEfficiency: number;
    totalTenants: number;
  };

  @ApiProperty({ description: 'Cost breakdown by tenant' })
  tenantBreakdown: Array<{
    tenantId: string;
    tenantName: string;
    licenseType: string;
    totalCost: number;
    activeCost: number;
    unusedCost: number;
    costEfficiency: number;
    usagePercentage: number;
  }>;

  @ApiProperty({ description: 'Cost optimization recommendations' })
  recommendations: string[];
}

export class WeeklyReportDto {
  @ApiProperty({ description: 'Report date' })
  reportDate: Date;

  @ApiProperty({ description: 'Total number of tenants' })
  @IsNumber()
  totalTenants: number;

  @ApiProperty({ description: 'Total number of licenses' })
  @IsNumber()
  totalLicenses: number;

  @ApiProperty({ description: 'Average usage percentage' })
  @IsNumber()
  averageUsage: number;

  @ApiProperty({ description: 'High usage tenants', type: [SeatUsageMetricsDto] })
  highUsageTenants: SeatUsageMetricsDto[];

  @ApiProperty({ description: 'Guardrail alerts', type: [GuardrailAlertDto] })
  alerts: GuardrailAlertDto[];
}

export class SeatUsageTrendsDto {
  @ApiProperty({ description: 'Date' })
  @IsString()
  date: string;

  @ApiProperty({ description: 'Number of active seats' })
  @IsNumber()
  activeSeats: number;

  @ApiProperty({ description: 'Total number of seats' })
  @IsNumber()
  totalSeats: number;

  @ApiProperty({ description: 'Usage percentage' })
  @IsNumber()
  usagePercentage: number;
}

export class AlertHistoryDto {
  @ApiProperty({ description: 'Time period' })
  @IsString()
  period: string;

  @ApiProperty({ description: 'Total number of alerts' })
  @IsNumber()
  totalAlerts: number;

  @ApiProperty({ description: 'Number of critical alerts' })
  @IsNumber()
  criticalAlerts: number;

  @ApiProperty({ description: 'Number of warning alerts' })
  @IsNumber()
  warningAlerts: number;

  @ApiProperty({ description: 'List of alerts', type: [GuardrailAlertDto] })
  alerts: GuardrailAlertDto[];
}
