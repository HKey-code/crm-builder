import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { LicenseMaintenanceService } from './license-maintenance.service';
import { LicenseErrorService } from './license-error.service';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { LicenseType } from '@prisma/client';
import {
  LicenseCheckQueryDto,
  AssignLicenseDto,
  AssignLicenseWithOverrideDto,
  RevokeLicenseDto,
  RenewLicenseDto,
  CreateTenantLicenseDto,
  LicenseResponseDto,
  SeatUsageDto,
  ExpiringLicenseDto,
  LicenseHealthDto,
  LicenseSummaryDto,
  ErrorResponseDto,
  SuccessResponseDto,
} from './dto/license.dto';

@ApiTags('licenses')
@ApiBearerAuth()
@Controller('licenses')
@UseGuards(RolesGuard)
export class LicenseController {
  constructor(
    private readonly licenseService: LicenseService,
    private readonly maintenanceService: LicenseMaintenanceService,
    private readonly errorService: LicenseErrorService,
  ) {}

  @Get('validate/:tenantId')
  @ApiOperation({ summary: 'Validate user access to a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID to validate access for' })
  @ApiResponse({ status: 200, description: 'Access validation result' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  @Roles('admin', 'user')
  async validateAccess(@Request() req, @Param('tenantId') tenantId: string) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException(
        this.errorService.createError('USER_NOT_FOUND', 'User not authenticated'),
        HttpStatus.UNAUTHORIZED
      );
    }

    const isValid = await this.licenseService.validateUserAccess(userId, tenantId);
    return { valid: isValid };
  }

  @Get('check')
  @ApiOperation({ summary: 'Check user license for specific license type' })
  @ApiQuery({ name: 'userId', description: 'User ID to check license for' })
  @ApiQuery({ name: 'tenantId', description: 'Tenant ID to check license for' })
  @ApiQuery({ name: 'licenseType', enum: LicenseType, description: 'License type to check' })
  @ApiResponse({ status: 200, description: 'License information', type: LicenseResponseDto })
  @ApiResponse({ status: 404, description: 'License not found', type: ErrorResponseDto })
  @Roles('admin', 'user')
  async checkUserLicense(
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
    @Query('licenseType') licenseType: LicenseType,
  ) {
    try {
      return await this.licenseService.checkUserLicense(userId, tenantId, licenseType);
    } catch (error) {
      throw new HttpException(
        this.errorService.createError('LICENSE_NOT_FOUND', error.message),
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get('user/:tenantId')
  @ApiOperation({ summary: 'Get all user licenses for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'User licenses', type: [LicenseResponseDto] })
  @ApiResponse({ status: 401, description: 'User not authenticated', type: ErrorResponseDto })
  @Roles('admin', 'user')
  async getUserLicenses(@Request() req, @Param('tenantId') tenantId: string) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException(
        this.errorService.createError('USER_NOT_FOUND', 'User not authenticated'),
        HttpStatus.UNAUTHORIZED
      );
    }

    const licenses = await this.licenseService.getUserLicenses(userId, tenantId);
    return { licenses };
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a license to a user' })
  @ApiResponse({ status: 201, description: 'License assigned successfully', type: LicenseResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'No seats available', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Admin not authenticated', type: ErrorResponseDto })
  @Roles('admin')
  async assignUserLicense(
    @Body() body: AssignLicenseDto,
    @Request() req,
  ) {
    try {
      const assignedBy = req.user?.id || body.assignedBy;
      if (!assignedBy) {
        throw new HttpException(
          this.errorService.createError('USER_NOT_FOUND', 'Admin not authenticated'),
          HttpStatus.UNAUTHORIZED
        );
      }

      const result = await this.licenseService.assignUserLicense({
        ...body,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        assignedBy,
      });

      return { success: true, license: result };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.message.includes('No seats available')) {
        throw new HttpException(
          this.errorService.createError('NO_SEATS_AVAILABLE', error.message),
          HttpStatus.CONFLICT
        );
      }
      
      throw new HttpException(
        this.errorService.createError('LICENSE_NOT_FOUND', error.message),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('assign/override')
  @ApiOperation({ summary: 'Assign a license with seat limit override' })
  @ApiResponse({ status: 201, description: 'License assigned with override', type: LicenseResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Admin not authenticated', type: ErrorResponseDto })
  @Roles('admin')
  async assignUserLicenseWithOverride(
    @Body() body: AssignLicenseWithOverrideDto,
    @Request() req,
  ) {
    try {
      const assignedBy = req.user?.id || body.assignedBy;
      if (!assignedBy) {
        throw new HttpException(
          this.errorService.createError('USER_NOT_FOUND', 'Admin not authenticated'),
          HttpStatus.UNAUTHORIZED
        );
      }

      const result = await this.licenseService.assignUserLicenseWithOverride({
        ...body,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        assignedBy,
      });

      return { success: true, license: result };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        this.errorService.createError('LICENSE_NOT_FOUND', error.message),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke a user license' })
  @ApiResponse({ status: 200, description: 'License revoked successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request', type: ErrorResponseDto })
  @Roles('admin')
  async revokeUserLicense(
    @Body() body: RevokeLicenseDto,
  ) {
    try {
      const result = await this.licenseService.revokeUserLicense(
        body.userId,
        body.tenantId,
        body.licenseType,
      );

      return { success: true, result };
    } catch (error) {
      throw new HttpException(
        this.errorService.createError('LICENSE_NOT_FOUND', error.message),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('renew')
  @ApiOperation({ summary: 'Renew a user license' })
  @ApiResponse({ status: 200, description: 'License renewed successfully', type: LicenseResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request', type: ErrorResponseDto })
  @Roles('admin')
  async renewUserLicense(
    @Body() body: RenewLicenseDto,
  ) {
    try {
      const result = await this.licenseService.renewUserLicense(
        body.userId,
        body.tenantId,
        body.licenseType,
        new Date(body.expiresAt),
      );

      return { success: true, license: result };
    } catch (error) {
      throw new HttpException(
        this.errorService.createError('LICENSE_NOT_FOUND', error.message),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all licenses for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant licenses' })
  @ApiResponse({ status: 404, description: 'Tenant not found', type: ErrorResponseDto })
  @Roles('admin')
  async getTenantLicenses(@Param('tenantId') tenantId: string) {
    try {
      const licenses = await this.licenseService.getTenantLicenses(tenantId);
      return { licenses };
    } catch (error) {
      throw new HttpException(
        this.errorService.createError('TENANT_NOT_FOUND', error.message),
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get('usage/:tenantId')
  @ApiOperation({ summary: 'Get license usage statistics for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'License usage statistics' })
  @ApiResponse({ status: 404, description: 'Tenant not found', type: ErrorResponseDto })
  @Roles('admin')
  async getLicenseUsage(@Param('tenantId') tenantId: string) {
    try {
      const usage = await this.licenseService.getLicenseUsage(tenantId);
      return { usage };
    } catch (error) {
      throw new HttpException(
        this.errorService.createError('TENANT_NOT_FOUND', error.message),
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get('seats/:tenantId')
  @ApiOperation({ summary: 'Get seat usage for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Seat usage information', type: [SeatUsageDto] })
  @ApiResponse({ status: 404, description: 'Tenant not found', type: ErrorResponseDto })
  @Roles('admin')
  async getSeatUsage(@Param('tenantId') tenantId: string) {
    try {
      const seats = await this.maintenanceService.getTenantSeatUsage(tenantId);
      return { seats };
    } catch (error) {
      throw new HttpException(
        this.errorService.createError('TENANT_NOT_FOUND', error.message),
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get('seats')
  @ApiOperation({ summary: 'Get seat usage for all tenants' })
  @ApiResponse({ status: 200, description: 'All seat usage information', type: [SeatUsageDto] })
  @Roles('admin')
  async getAllSeatUsage() {
    const seats = await this.maintenanceService.getSeatUsageStats();
    return { seats };
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring licenses grouped by day' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead', type: Number })
  @ApiResponse({ status: 200, description: 'Expiring licenses by day', type: [ExpiringLicenseDto] })
  @Roles('admin')
  async getExpiringLicenses(@Query('days') days = 90) {
    const expiring = await this.maintenanceService.getExpiringLicensesByDay(parseInt(days.toString()));
    return { expiring };
  }

  @Post('maintenance/expire')
  @ApiOperation({ summary: 'Manually expire expired licenses' })
  @ApiResponse({ status: 200, description: 'Expiration job completed', type: SuccessResponseDto })
  @Roles('admin')
  async expireLicenses() {
    const count = await this.maintenanceService.expireExpiredLicenses();
    return { success: true, expiredCount: count };
  }

  @Post('tenant')
  @ApiOperation({ summary: 'Create a new tenant license' })
  @ApiResponse({ status: 201, description: 'Tenant license created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request', type: ErrorResponseDto })
  @Roles('admin')
  async createTenantLicense(
    @Body() body: CreateTenantLicenseDto,
  ) {
    try {
      const result = await this.licenseService.createTenantLicense(
        body.tenantId,
        body.licenseType,
        body.status,
        new Date(body.activatedAt),
        body.expiresAt ? new Date(body.expiresAt) : undefined,
        body.metadata,
        body.totalSeats,
      );

      return { success: true, license: result };
    } catch (error) {
      throw new HttpException(
        this.errorService.createError('LICENSE_NOT_FOUND', error.message),
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
