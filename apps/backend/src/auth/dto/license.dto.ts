import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { LicenseType, SeatStatus } from '@prisma/client';

// License Check DTOs
export class LicenseCheckQueryDto {
  @ApiProperty({ description: 'User ID to check license for' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Tenant ID to check license for' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'License type to check',
    enum: LicenseType,
    example: 'SMART_SERVICE'
  })
  @IsEnum(LicenseType)
  licenseType: LicenseType;
}

// License Assignment DTOs
export class AssignLicenseDto {
  @ApiProperty({ description: 'User ID to assign license to' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Tenant ID for the license' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'License type to assign',
    enum: LicenseType,
    example: 'SMART_SERVICE'
  })
  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @ApiProperty({ description: 'Role ID to assign with the license' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({ description: 'License expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Admin who assigned the license' })
  @IsOptional()
  @IsUUID()
  assignedBy?: string;

  @ApiPropertyOptional({ description: 'Notes about the license assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignLicenseWithOverrideDto extends AssignLicenseDto {
  @ApiProperty({ description: 'Reason for overriding seat limit' })
  @IsString()
  reason: string;
}

// License Revocation DTOs
export class RevokeLicenseDto {
  @ApiProperty({ description: 'User ID to revoke license from' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Tenant ID for the license' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'License type to revoke',
    enum: LicenseType,
    example: 'SMART_SERVICE'
  })
  @IsEnum(LicenseType)
  licenseType: LicenseType;
}

// License Renewal DTOs
export class RenewLicenseDto {
  @ApiProperty({ description: 'User ID to renew license for' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Tenant ID for the license' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'License type to renew',
    enum: LicenseType,
    example: 'SMART_SERVICE'
  })
  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @ApiProperty({ description: 'New expiration date' })
  @IsDateString()
  expiresAt: string;
}

// Tenant License Creation DTOs
export class CreateTenantLicenseDto {
  @ApiProperty({ description: 'Tenant ID for the license' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'License type to create',
    enum: LicenseType,
    example: 'SMART_SERVICE'
  })
  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @ApiProperty({ description: 'License status', example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'License activation date' })
  @IsDateString()
  activatedAt: string;

  @ApiPropertyOptional({ description: 'License expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'License metadata' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Total seats available' })
  @IsOptional()
  @IsNumber()
  totalSeats?: number;
}

// Response DTOs
export class LicenseResponseDto {
  @ApiProperty({ description: 'License ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Tenant license ID' })
  tenantLicenseId: string;

  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ 
    description: 'License status',
    enum: SeatStatus
  })
  status: SeatStatus;

  @ApiProperty({ description: 'Assignment date' })
  assignedAt: Date;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Assigned by user ID' })
  assignedBy?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    name?: string;
  };

  @ApiProperty({ description: 'Tenant license information' })
  tenantLicense: {
    id: string;
    licenseType: LicenseType;
    status: string;
    totalSeats?: number;
    tenant: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({ description: 'Role information' })
  role: {
    id: string;
    name: string;
  };
}

export class SeatUsageDto {
  @ApiProperty({ description: 'License type' })
  licenseType: LicenseType;

  @ApiPropertyOptional({ description: 'Total seats available' })
  totalSeats?: number;

  @ApiProperty({ description: 'Active seats' })
  activeSeats: number;

  @ApiPropertyOptional({ description: 'Available seats' })
  availableSeats?: number;

  @ApiPropertyOptional({ description: 'Usage percentage' })
  usagePercentage?: number;

  @ApiProperty({ description: 'License status' })
  status: string;

  @ApiPropertyOptional({ description: 'License expiration date' })
  expiresAt?: Date;
}

export class ExpiringLicenseDto {
  @ApiProperty({ description: 'Day of expiration' })
  day: string;

  @ApiProperty({ description: 'Number of licenses expiring' })
  count: number;

  @ApiProperty({ description: 'License details' })
  licenses: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    licenseType: LicenseType;
    tenantId: string;
    roleName: string;
    expiresAt: Date;
  }>;
}

export class LicenseHealthDto {
  @ApiProperty({ description: 'Health status' })
  status: 'healthy' | 'warning' | 'critical';

  @ApiProperty({ description: 'License type' })
  licenseType: LicenseType;

  @ApiProperty({ description: 'Total seats' })
  totalSeats: number;

  @ApiProperty({ description: 'Active seats' })
  activeSeats: number;

  @ApiProperty({ description: 'Available seats' })
  availableSeats: number;

  @ApiProperty({ description: 'Usage percentage' })
  usagePercentage: number;

  @ApiPropertyOptional({ description: 'Days until expiration' })
  daysUntilExpiration?: number;

  @ApiProperty({ description: 'Last checked timestamp' })
  lastChecked: Date;
}

export class LicenseSummaryDto {
  @ApiProperty({ description: 'Total tenants' })
  totalTenants: number;

  @ApiProperty({ description: 'Total licenses' })
  totalLicenses: number;

  @ApiProperty({ description: 'Total active seats' })
  totalActiveSeats: number;

  @ApiProperty({ description: 'Total available seats' })
  totalAvailableSeats: number;

  @ApiProperty({ description: 'Overall usage percentage' })
  overallUsagePercentage: number;

  @ApiProperty({ description: 'Licenses expiring soon' })
  licensesExpiringSoon: number;

  @ApiProperty({ description: 'System health status' })
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Error code' })
  code: string;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ description: 'Additional error details' })
  detail?: string;

  @ApiProperty({ description: 'Error timestamp' })
  timestamp: string;
}

export class SuccessResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: any;
}
