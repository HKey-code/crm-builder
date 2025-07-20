import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { HealthcheckService } from './healthcheck.service';

describe('AppController', () => {
  let controller: AppController;
  let healthcheckService: HealthcheckService;

  const mockHealthcheckService = {
    checkHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: HealthcheckService,
          useValue: mockHealthcheckService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    healthcheckService = module.get<HealthcheckService>(HealthcheckService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealthcheck', () => {
    it('should return health status successfully', async () => {
      const mockHealthStatus = {
        dbStatus: 'ok',
        jwtSecretPresent: true,
        azureConfigPresent: true,
        databaseUrlPresent: true,
        environment: 'test',
        nodeVersion: 'v22.0.0',
        uptime: 100,
        memoryUsage: {
          used: 50,
          total: 200,
          percentage: 25,
        },
      };

      mockHealthcheckService.checkHealth.mockResolvedValue(mockHealthStatus);

      const result = await controller.getHealthcheck();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        ...mockHealthStatus,
      });
      expect(healthcheckService.checkHealth).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockHealthcheckService.checkHealth.mockRejectedValue(error);

      await expect(controller.getHealthcheck()).rejects.toThrow();
    });
  });

  describe('getHealth', () => {
    it('should return the same result as getHealthcheck', async () => {
      const mockHealthStatus = {
        dbStatus: 'ok',
        jwtSecretPresent: true,
        azureConfigPresent: true,
        databaseUrlPresent: true,
        environment: 'test',
        nodeVersion: 'v22.0.0',
        uptime: 100,
        memoryUsage: {
          used: 50,
          total: 200,
          percentage: 25,
        },
      };

      mockHealthcheckService.checkHealth.mockResolvedValue(mockHealthStatus);

      const result = await controller.getHealth();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        ...mockHealthStatus,
      });
    });
  });
}); 