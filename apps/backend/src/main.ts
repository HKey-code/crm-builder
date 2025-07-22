import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env from root directory only in development
if (process.env.NODE_ENV !== 'production') {
  config({ path: join(__dirname, '../../../.env') });
}

async function bootstrap() {
  console.log('🚀 Bootstrap started...');
  console.log('🔧 Environment check:');
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   - PORT: ${process.env.PORT}`);
  console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
  
  console.log('📦 Creating NestJS app...');
  const app = await NestFactory.create(AppModule);
  console.log('✅ NestJS app created successfully');
  
  // Enable CORS for frontend
  console.log('🔧 Configuring CORS...');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  console.log('✅ CORS configured');

  const port = process.env.PORT || 3000;
  console.log(`🎯 Starting server on port: ${port}`);
  await app.listen(port);
  
  console.log(`🚀 Application is running on port: ${port}`);
  console.log(`🚀 Healthcheck available at: /health and /healthcheck`);
  
  // Test deployment trigger - Mon Jul 21 01:45:00 CDT 2025
  const dummyVar = 'workflow-trigger-test-v7';
  console.log(`🔧 Dummy variable: ${dummyVar}`);
  console.log('✅ Bootstrap completed successfully');
  console.log('🚀 Deployment test - Updated at: ' + new Date().toISOString());
  console.log('🎯 New deployment triggered - Fixed start.sh and removed deploy-app.yml');
  console.log('🚀 Clean deployment - No more deploy-app.yml conflicts');
}
bootstrap();
// Placeholder for main.ts
// Deployment trigger
// Test trigger
