import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SLOService } from './slo.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('monitoring')
@ApiBearerAuth()
@Controller('monitoring')
@UseGuards(RolesGuard)
export class SLOController {
  constructor(private readonly sloService: SLOService) {}

  @Get('slo/status')
  @ApiOperation({ summary: 'Get current SLO status for license checks' })
  @ApiResponse({ status: 200, description: 'Current SLO status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getSLOStatus() {
    return await this.sloService.getSLOStatus();
  }

  @Get('slo/metrics')
  @ApiOperation({ summary: 'Get SLO metrics for a time range' })
  @ApiQuery({ name: 'startTime', description: 'Start time (ISO string)', required: true })
  @ApiQuery({ name: 'endTime', description: 'End time (ISO string)', required: true })
  @ApiResponse({ status: 200, description: 'SLO metrics for the time range' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getSLOMetrics(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use ISO string format.');
    }

    if (start >= end) {
      throw new Error('Start time must be before end time.');
    }

    return await this.sloService.getSLOMetrics(start, end);
  }

  @Get('slo/errors')
  @ApiOperation({ summary: 'Get error spike analysis' })
  @ApiResponse({ status: 200, description: 'Error spike analysis' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getErrorSpikeAnalysis() {
    return await this.sloService.getErrorSpikeAnalysis();
  }

  @Get('slo/health')
  @ApiOperation({ summary: 'Get SLO health check' })
  @ApiResponse({ status: 200, description: 'SLO health status' })
  @ApiResponse({ status: 503, description: 'SLO health check failed' })
  async getSLOHealth() {
    const status = await this.sloService.getSLOStatus();
    
    if (!status.isHealthy) {
      return {
        status: 'unhealthy',
        message: 'SLO thresholds exceeded',
        details: {
          p99Latency: status.p99Latency,
          successRate: status.successRate,
          errorCount: status.errorCount,
          alerts: status.alerts,
        },
        timestamp: new Date(),
      };
    }

    return {
      status: 'healthy',
      message: 'All SLO thresholds met',
      details: {
        p99Latency: status.p99Latency,
        successRate: status.successRate,
        errorCount: status.errorCount,
      },
      timestamp: new Date(),
    };
  }
}
