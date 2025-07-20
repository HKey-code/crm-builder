import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('dbStatus');
          expect(res.body).toHaveProperty('jwtSecretPresent');
          expect(res.body).toHaveProperty('azureConfigPresent');
          expect(res.body).toHaveProperty('databaseUrlPresent');
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('nodeVersion');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('memoryUsage');
        });
    });
  });

  describe('/healthcheck (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/healthcheck')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('dbStatus');
          expect(res.body).toHaveProperty('jwtSecretPresent');
          expect(res.body).toHaveProperty('azureConfigPresent');
          expect(res.body).toHaveProperty('databaseUrlPresent');
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('nodeVersion');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('memoryUsage');
        });
    });
  });
}); 