import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthcheckService } from './healthcheck.service';

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
}
