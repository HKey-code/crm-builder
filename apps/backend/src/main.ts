import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { join } from 'path';
import * as appInsights from 'applicationinsights';




// Initialize Application Insights if connection string is provided
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  console.log('🔍 Initializing Application Insights...');
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setSendLiveMetrics(true)
    .start();
  
  // Log a test trace to verify initialization
  appInsights.defaultClient.trackTrace({ message: 'Application Insights initialized successfully' });
  console.log('✅ Application Insights initialized');
} else {
  console.log('⚠️  APPLICATIONINSIGHTS_CONNECTION_STRING not set - skipping Application Insights initialization');
}

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

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('CRM License System API')
    .setDescription('Complete CRM license management system with tenant isolation, seat tracking, and audit trails')
    .setVersion('1.0')
    .addTag('licenses', 'License management operations')
    .addTag('health', 'Health monitoring endpoints')
    .addTag('service', 'Service module endpoints (requires SMART_SERVICE license)')
    .addTag('sales', 'Sales module endpoints (requires SMART_SALES license)')
    .addTag('users', 'User management operations')
    .addTag('tenants', 'Tenant management operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  console.log('✅ OpenAPI documentation configured at /api');

  const port = process.env.PORT || 8080;
  console.log(`🎯 Starting server on port: ${port}`);
  console.log(`🔧 Binding to 0.0.0.0:${port} for Azure App Service compatibility`);
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on port: ${port}`);
  console.log(`🚀 Healthcheck available at: /health and /healthcheck`);
  
  // Application Insights tracking after app starts
  console.log('🔍 Insights connection:', process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackTrace({ message: '✅ NestJS app has started' });
    console.log('✅ Application Insights trace sent');
  } else {
    console.log('⚠️  Application Insights client not available');
  }
  
          // Test deployment trigger - Mon Jul 21 01:45:00 CDT 2025
        const dummyVar = 'workflow-trigger-test-v42';
        console.log(`🔧 Dummy variable: ${dummyVar}`);
        console.log('✅ Bootstrap completed successfully');
        console.log('🚀 Deployment test - Updated at: ' + new Date().toISOString());
        console.log('🎯 New deployment triggered - Using flat Oryx structure');
        console.log('🚀 Flat Oryx deployment - main.ts at root, compiled to main.js');
        console.log('🔑 Publish profile configured - Ready for deployment');
        console.log('🔧 Port binding fixed for Azure App Service (8080)');
        console.log('🧪 Health check test fixed for port 8080');
        console.log('🔍 Enhanced logging and validation throughout workflow');
        console.log('🚀 Force deployment - Testing flat Oryx approach');
        console.log('📦 Flat deployment - main.ts at root, tsc compiles to main.js');
        console.log('📄 Package.json with main=main.js, start=node main.js');
        console.log('🚀 FORCE DEPLOYMENT - Testing flat Oryx structure');
        console.log('🔧 Fixed: Safe file moving, proper cleanup, PORT environment variable');
        console.log('🔧 Improved: Exclude dotfiles, keep libs/ in place');
        console.log('🔧 NEW: Flat Oryx structure - main.ts at root');
        console.log('🔧 CRITICAL FIX: Package.json main=main.js, start=node main.js');
        console.log('🔧 FLAT STRUCTURE: Oryx expects main.ts -> main.js at root');
        console.log('🔧 FIXED: Azure login before cleanup operations');
        console.log('🔧 FIXED: JavaScript syntax error in package.json modification');
        console.log('🔧 FIXED: SCM container restart delay - 20 second wait');
        console.log('🔧 FIXED: Remove restart command to avoid SCM conflicts');
        console.log('🔧 FIXED: Move @nestjs/cli to dependencies for production');
        console.log('🚀 FORCE DEPLOYMENT TRIGGER - Testing all fixes');
}
bootstrap();
// Placeholder for main.ts
// Deployment trigger
// Test trigger
