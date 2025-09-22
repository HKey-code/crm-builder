import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum GDPRRequestType {
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  DATA_ANONYMIZATION = 'data_anonymization',
  DATA_RECTIFICATION = 'data_rectification',
  DATA_RESTRICTION = 'data_restriction',
  DATA_OBJECTION = 'data_objection',
}

export enum RetentionPeriod {
  DAYS_7 = 7,
  DAYS_30 = 30,
  DAYS_90 = 90,
  DAYS_365 = 365,
}

export class AnonymizationRequestDto {
  @ApiProperty({ description: 'User ID to anonymize' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Reason for anonymization' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'ID of user making the request' })
  @IsString()
  requestedBy: string;

  @ApiProperty({ description: 'Whether to anonymize the data' })
  @IsBoolean()
  anonymizeData: boolean;

  @ApiProperty({ description: 'Whether to delete the data' })
  @IsBoolean()
  deleteData: boolean;
}

export class SoftDeleteUserDto {
  @ApiProperty({ description: 'User ID to soft delete' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Reason for deletion' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'ID of user making the request' })
  @IsString()
  requestedBy: string;
}

export class GDPRConfigDto {
  @ApiPropertyOptional({ description: 'Audit log retention days', default: 90 })
  @IsOptional()
  @IsNumber()
  auditLogRetentionDays?: number;

  @ApiPropertyOptional({ description: 'User data retention days', default: 30 })
  @IsOptional()
  @IsNumber()
  userDataRetentionDays?: number;

  @ApiPropertyOptional({ description: 'Enable soft delete', default: true })
  @IsOptional()
  @IsBoolean()
  softDeleteEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable anonymization', default: true })
  @IsOptional()
  @IsBoolean()
  anonymizationEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable auto cleanup', default: true })
  @IsOptional()
  @IsBoolean()
  autoCleanupEnabled?: boolean;
}

export class UserRequestDto {
  @ApiProperty({ description: 'Type of GDPR request', enum: GDPRRequestType })
  @IsEnum(GDPRRequestType)
  requestType: GDPRRequestType;

  @ApiPropertyOptional({ description: 'Reason for the request' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RetentionPolicyDto {
  @ApiProperty({ description: 'Table name' })
  @IsString()
  tableName: string;

  @ApiProperty({ description: 'Retention period in days' })
  @IsNumber()
  retentionDays: number;

  @ApiProperty({ description: 'Enable soft delete' })
  @IsBoolean()
  softDelete: boolean;

  @ApiProperty({ description: 'Anonymize on delete' })
  @IsBoolean()
  anonymizeOnDelete: boolean;
}

export class GDPRComplianceReportDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Number of anonymized users' })
  anonymizedUsers: number;

  @ApiProperty({ description: 'Number of deleted users' })
  deletedUsers: number;

  @ApiProperty({ description: 'Number of audit logs' })
  auditLogsCount: number;

  @ApiProperty({ description: 'Retention policies', type: [RetentionPolicyDto] })
  retentionPolicies: RetentionPolicyDto[];

  @ApiProperty({ description: 'GDPR configuration' })
  config: GDPRConfigDto;
}

export class UserDataExportDto {
  @ApiProperty({ description: 'User information' })
  user: any;

  @ApiProperty({ description: 'User licenses' })
  licenses: any[];

  @ApiProperty({ description: 'Audit logs' })
  auditLogs: any[];

  @ApiProperty({ description: 'SLO metrics' })
  metrics: any[];
}

export class UserRightsDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'GDPR rights' })
  rights: {
    rightToAccess: boolean;
    rightToRectification: boolean;
    rightToErasure: boolean;
    rightToDataPortability: boolean;
    rightToRestriction: boolean;
    rightToObject: boolean;
  };

  @ApiProperty({ description: 'Data retention periods' })
  dataRetention: {
    userData: string;
    auditLogs: string;
    metrics: string;
    alerts: string;
  };
}

export class GDPRCleanupResultDto {
  @ApiProperty({ description: 'Number of audit logs cleaned' })
  auditLogsCleaned: number;

  @ApiProperty({ description: 'Number of users cleaned' })
  usersCleaned: number;

  @ApiProperty({ description: 'Number of metrics cleaned' })
  metricsCleaned: number;

  @ApiProperty({ description: 'Number of alerts cleaned' })
  alertsCleaned: number;
}

export class GDPRAuditTrailDto {
  @ApiProperty({ description: 'Audit trail entries' })
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    userId: string;
    details: string;
  }>;

  @ApiProperty({ description: 'Total number of records' })
  totalRecords: number;
}

export class GDPRResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;
}
