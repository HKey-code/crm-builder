import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { GDPRService, AnonymizationRequest, GDPRConfig } from './gdpr.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  AnonymizationRequestDto,
  SoftDeleteUserDto,
  GDPRConfigDto,
  UserRequestDto,
  GDPRComplianceReportDto,
  UserDataExportDto,
  UserRightsDto,
  GDPRCleanupResultDto,
  GDPRAuditTrailDto,
  GDPRResponseDto,
} from './dto/gdpr.dto';

@ApiTags('gdpr')
@ApiBearerAuth()
@Controller('gdpr')
@UseGuards(RolesGuard)
export class GDPRController {
  constructor(private readonly gdprService: GDPRService) {}

  @Get('compliance-report')
  @ApiOperation({ summary: 'Get GDPR compliance report' })
  @ApiResponse({ status: 200, description: 'GDPR compliance report', type: GDPRComplianceReportDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getComplianceReport(): Promise<GDPRComplianceReportDto> {
    return await this.gdprService.getGDPRComplianceReport();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get GDPR configuration' })
  @ApiResponse({ status: 200, description: 'GDPR configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getGDPRConfig() {
    return await this.gdprService.getGDPRConfig();
  }

  @Post('config')
  @ApiOperation({ summary: 'Update GDPR configuration' })
  @ApiResponse({ status: 200, description: 'GDPR configuration updated', type: GDPRResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async updateGDPRConfig(@Body() config: GDPRConfigDto): Promise<GDPRResponseDto> {
    await this.gdprService.updateGDPRConfig(config);
    return { message: 'GDPR configuration updated successfully' };
  }

  @Post('anonymize-user')
  @ApiOperation({ summary: 'Anonymize user data for GDPR compliance' })
  @ApiResponse({ status: 200, description: 'User anonymized successfully', type: GDPRResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async anonymizeUser(@Body() request: AnonymizationRequestDto): Promise<GDPRResponseDto> {
    await this.gdprService.anonymizeUser(request.userId, request);
    return { message: 'User anonymized successfully' };
  }

  @Post('delete-user')
  @ApiOperation({ summary: 'Soft delete user for GDPR compliance' })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully', type: GDPRResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async softDeleteUser(@Body() body: SoftDeleteUserDto): Promise<GDPRResponseDto> {
    await this.gdprService.softDeleteUser(body.userId, body.reason, body.requestedBy);
    return { message: 'User soft deleted successfully' };
  }

  @Post('deletion-request')
  @ApiOperation({ summary: 'Process GDPR deletion request' })
  @ApiResponse({ status: 200, description: 'GDPR deletion request processed', type: GDPRResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async processDeletionRequest(@Body() request: AnonymizationRequestDto): Promise<GDPRResponseDto> {
    await this.gdprService.processGDPRDeletionRequest(request);
    return { message: 'GDPR deletion request processed successfully' };
  }

  @Get('export-user-data/:userId')
  @ApiOperation({ summary: 'Export user data for GDPR right to data portability' })
  @ApiParam({ name: 'userId', description: 'User ID to export data for' })
  @ApiResponse({ status: 200, description: 'User data exported', type: UserDataExportDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  async exportUserData(@Param('userId') userId: string): Promise<UserDataExportDto> {
    return await this.gdprService.exportUserData(userId);
  }

  @Post('cleanup-expired-data')
  @ApiOperation({ summary: 'Clean up expired data based on retention policies' })
  @ApiResponse({ status: 200, description: 'Data cleanup completed', type: GDPRCleanupResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async cleanupExpiredData(): Promise<GDPRCleanupResultDto> {
    return await this.gdprService.cleanupExpiredData();
  }

  @Get('retention-policy/:tableName')
  @ApiOperation({ summary: 'Get retention policy for a specific table' })
  @ApiParam({ name: 'tableName', description: 'Table name to get policy for' })
  @ApiResponse({ status: 200, description: 'Retention policy' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @Roles('admin')
  async getRetentionPolicy(@Param('tableName') tableName: string) {
    const policy = this.gdprService.getRetentionPolicy(tableName);
    if (!policy) {
      return { message: 'Retention policy not found for table' };
    }
    return policy;
  }

  @Get('user-rights/:userId')
  @ApiOperation({ summary: 'Get user GDPR rights summary' })
  @ApiParam({ name: 'userId', description: 'User ID to check rights for' })
  @ApiResponse({ status: 200, description: 'User GDPR rights', type: UserRightsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  async getUserRights(@Param('userId') userId: string): Promise<UserRightsDto> {
    // This would typically check what GDPR rights the user has
    // For now, return a basic rights summary
    return {
      userId,
      rights: {
        rightToAccess: true,
        rightToRectification: true,
        rightToErasure: true,
        rightToDataPortability: true,
        rightToRestriction: true,
        rightToObject: true,
      },
      dataRetention: {
        userData: '30 days',
        auditLogs: '90 days',
        metrics: '30 days',
        alerts: '90 days',
      },
    };
  }

  @Post('user-request/:userId')
  @ApiOperation({ summary: 'Process user GDPR request' })
  @ApiParam({ name: 'userId', description: 'User ID making the request' })
  @ApiResponse({ status: 200, description: 'User request processed', type: GDPRResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async processUserRequest(
    @Param('userId') userId: string,
    @Body() body: UserRequestDto,
  ): Promise<GDPRResponseDto | UserDataExportDto> {
    // Process different types of GDPR requests
    switch (body.requestType) {
      case 'data_export':
        return await this.gdprService.exportUserData(userId);
      case 'data_deletion':
        await this.gdprService.processGDPRDeletionRequest({
          userId,
          reason: body.reason || 'User request',
          requestedBy: userId,
          anonymizeData: true,
          deleteData: true,
        });
        return { message: 'Data deletion request processed' };
      case 'data_anonymization':
        await this.gdprService.anonymizeUser(userId, {
          userId,
          reason: body.reason || 'User request',
          requestedBy: userId,
          anonymizeData: true,
          deleteData: false,
        });
        return { message: 'Data anonymization request processed' };
      default:
        return { message: 'Unknown request type' };
    }
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'Get GDPR audit trail' })
  @ApiQuery({ name: 'startDate', description: 'Start date (ISO string)', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'GDPR audit trail', type: GDPRAuditTrailDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getGDPRAuditTrail(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<GDPRAuditTrailDto> {
    // This would typically query audit logs for GDPR-related activities
    // For now, return a mock audit trail
    return {
      auditTrail: [
        {
          timestamp: new Date(),
          action: 'GDPR_DATA_EXPORT',
          userId: 'user-123',
          details: 'User data exported for GDPR compliance',
        },
        {
          timestamp: new Date(),
          action: 'USER_ANONYMIZED',
          userId: 'user-456',
          details: 'User data anonymized for GDPR compliance',
        },
      ],
      totalRecords: 2,
    };
  }
}
