import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateOpenAPI() {
  console.log('🔧 Starting OpenAPI generation...');
  
  const app = await NestFactory.create(AppModule);
  
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
    .addTag('guardrails', 'Cost guardrails and monitoring')
    .addTag('monitoring', 'SLO monitoring and synthetic probes')
    .addTag('gdpr', 'GDPR compliance and data retention')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Save OpenAPI spec to file
  const outputPath = join(__dirname, '../../../openapi-spec.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log('✅ OpenAPI specification generated at:', outputPath);
  console.log('📊 API endpoints documented:', Object.keys(document.paths).length);
  
  await app.close();
  console.log('🎉 OpenAPI generation complete!');
}

generateOpenAPI().catch(console.error);
