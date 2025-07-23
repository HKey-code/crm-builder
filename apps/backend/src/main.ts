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
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });
  console.log('✅ CORS configured');

  const port = process.env.PORT || 8080;
  console.log(`🎯 Starting server on port: ${port}`);
  console.log(`🔧 Binding to 0.0.0.0:${port} for Azure App Service compatibility`);
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on port: ${port}`);
  console.log(`🚀 Healthcheck available at: /health and /healthcheck`);
  
          // Test deployment trigger - Mon Jul 21 01:45:00 CDT 2025
        const dummyVar = 'workflow-trigger-test-v23';
        console.log(`🔧 Dummy variable: ${dummyVar}`);
        console.log('✅ Bootstrap completed successfully');
        console.log('🚀 Deployment test - Updated at: ' + new Date().toISOString());
        console.log('🎯 New deployment triggered - Using clean Oryx approach');
        console.log('🚀 Clean Oryx deployment - Source files only, let Oryx build');
        console.log('🔑 Publish profile configured - Ready for deployment');
        console.log('🔧 Port binding fixed for Azure App Service (8080)');
        console.log('🧪 Health check test fixed for port 8080');
        console.log('🔍 Debugging deployment issues - checking environment variables');
        console.log('🚀 Force deployment - Testing port 8080 fix');
        console.log('📦 Clean deployment - Only src/ and config files for Oryx');
        console.log('📄 Package.json with all dependencies and correct scripts');
        console.log('🚀 FORCE DEPLOYMENT - Testing clean Oryx approach with fixes');
        console.log('🔧 Fixed: Safe file moving, proper cleanup, PORT environment variable');
        console.log('🔧 Improved: Exclude dotfiles, keep libs/ in place');
        console.log('🔧 NEW: Clean deployment structure - Let Oryx handle build');
        console.log('🔧 CRITICAL FIX: Package.json main=dist/main.js, start=node dist/main.js');
}
bootstrap();
// Placeholder for main.ts
// Deployment trigger
// Test trigger
