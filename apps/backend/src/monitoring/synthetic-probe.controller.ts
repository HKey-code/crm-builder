import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SyntheticProbeService, ProbeConfig } from './synthetic-probe.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('monitoring')
@ApiBearerAuth()
@Controller('monitoring/probes')
@UseGuards(RolesGuard)
export class SyntheticProbeController {
  constructor(private readonly probeService: SyntheticProbeService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get synthetic probe statistics' })
  @ApiResponse({ status: 200, description: 'Probe statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getProbeStats() {
    return await this.probeService.getProbeStats();
  }

  @Get('results')
  @ApiOperation({ summary: 'Get probe results for a time range' })
  @ApiQuery({ name: 'startTime', description: 'Start time (ISO string)', required: true })
  @ApiQuery({ name: 'endTime', description: 'End time (ISO string)', required: true })
  @ApiResponse({ status: 200, description: 'Probe results for the time range' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async getProbeResults(
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

    return await this.probeService.getProbeResults(start, end);
  }

  @Post('run')
  @ApiOperation({ summary: 'Run synthetic probes manually' })
  @ApiResponse({ status: 200, description: 'Probe execution results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async runProbes() {
    return await this.probeService.runManualProbe();
  }

  @Post('add')
  @ApiOperation({ summary: 'Add a custom probe configuration' })
  @ApiResponse({ status: 201, description: 'Probe configuration added' })
  @ApiResponse({ status: 400, description: 'Invalid probe configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async addProbe(@Body() config: ProbeConfig) {
    await this.probeService.addProbe(config);
    return { message: 'Probe configuration added successfully' };
  }

  @Delete('remove')
  @ApiOperation({ summary: 'Remove a probe configuration' })
  @ApiQuery({ name: 'endpoint', description: 'Endpoint to remove', required: true })
  @ApiResponse({ status: 200, description: 'Probe configuration removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async removeProbe(@Query('endpoint') endpoint: string) {
    await this.probeService.removeProbe(endpoint);
    return { message: 'Probe configuration removed successfully' };
  }

  @Delete('clear-history')
  @ApiOperation({ summary: 'Clear probe results history' })
  @ApiResponse({ status: 200, description: 'Probe history cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles('admin')
  async clearProbeHistory() {
    await this.probeService.clearProbeHistory();
    return { message: 'Probe history cleared successfully' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get probe health status' })
  @ApiResponse({ status: 200, description: 'Probe health status' })
  async getProbeHealth() {
    const stats = await this.probeService.getProbeStats();
    
    const isHealthy = stats.successRate >= 0.95; // 95% success rate threshold
    
    if (isHealthy) {
      return {
        status: 'healthy',
        message: 'Synthetic probes are running normally',
        details: {
          successRate: stats.successRate,
          averageLatency: stats.averageLatency,
          totalProbes: stats.totalProbes,
        },
        timestamp: new Date(),
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Synthetic probes are failing',
        details: {
          successRate: stats.successRate,
          averageLatency: stats.averageLatency,
          totalProbes: stats.totalProbes,
          failedProbes: stats.failedProbes,
        },
        timestamp: new Date(),
      };
    }
  }
}
