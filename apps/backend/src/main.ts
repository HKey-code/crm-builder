import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env from root directory only in development
if (process.env.NODE_ENV !== 'production') {
  config({ path: join(__dirname, '../../../.env') });
}

async function bootstrap() {
  console.log('Nest app booting...');
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on port: ${port}`);
  console.log(`🚀 Healthcheck available at: /health and /healthcheck`);
  
  // Test deployment trigger - Mon Jul 21 01:45:00 CDT 2025
  const dummyVar = 'workflow-trigger-test';
  console.log(`🔧 Dummy variable: ${dummyVar}`);
}
bootstrap();
// Placeholder for main.ts
// Deployment trigger
// Test trigger
