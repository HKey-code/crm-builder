import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { HealthcheckService } from './healthcheck.service';
import { LicenseType } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get()
  getHello() {
    return { message: 'CRM Backend is running!' };
  }

  @Get('healthcheck')
  async getHealthcheck() {
    try {
      const healthStatus = await this.healthcheckService.checkHealth();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        ...healthStatus,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  async getHealth() {
    // Alias for healthcheck
    return this.getHealthcheck();
  }

  @Get('health/license')
  async getLicenseHealth(
    @Query('tenantId') tenantId: string,
    @Query('licenseType') licenseType: LicenseType,
  ) {
    try {
      if (!tenantId || !licenseType) {
        throw new HttpException(
          {
            status: 'error',
            message: 'tenantId and licenseType are required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const licenseHealth = await this.healthcheckService.checkLicenseHealth(tenantId, licenseType);
      return {
        timestamp: new Date().toISOString(),
        ...licenseHealth,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health/license/summary')
  async getLicenseSummary() {
    try {
      const summary = await this.healthcheckService.getSystemLicenseSummary();
      return {
        timestamp: new Date().toISOString(),
        ...summary,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
