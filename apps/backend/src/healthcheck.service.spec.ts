import { Test, TestingModule } from '@nestjs/testing';
import { HealthcheckService } from './healthcheck.service';
import { PrismaService } from './prisma.service';

describe('HealthcheckService', () => {
  let service: HealthcheckService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthcheckService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthcheckService>(HealthcheckService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should return health status with database connection success', async () => {
      // Mock successful database query
      mockPrismaService.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.checkHealth();

      expect(result.dbStatus).toBe('ok');
      expect(result.jwtSecretPresent).toBeDefined();
      expect(result.azureConfigPresent).toBeDefined();
      expect(result.databaseUrlPresent).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.nodeVersion).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.memoryUsage).toBeDefined();
    });

    it('should return health status with database connection failure', async () => {
      // Mock database query failure
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const result = await service.checkHealth();

      expect(result.dbStatus).toBe('error');
      expect(result.jwtSecretPresent).toBeDefined();
      expect(result.azureConfigPresent).toBeDefined();
      expect(result.databaseUrlPresent).toBeDefined();
    });

    it('should handle missing user table gracefully', async () => {
      // Mock successful basic query but failed user count
      mockPrismaService.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockPrismaService.user.count.mockRejectedValue(new Error('Table does not exist'));

      const result = await service.checkHealth();

      expect(result.dbStatus).toBe('ok'); // Basic connection still works
    });
  });
}); 