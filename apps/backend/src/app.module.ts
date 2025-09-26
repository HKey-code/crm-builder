


import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { UserModule } from './user/user.module';
import { TenantModule } from './tenant/tenant.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { Customer360Module } from './customer360/customer360.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { GDPRModule } from './gdpr/gdpr.module';
import { GuardrailsModule } from './guardrails/guardrails.module';
import { AppController } from './app.controller';
import { HealthcheckService } from './healthcheck.service';
import { PrismaService } from './prisma.service';
import { UiService } from './ui/ui.service';
import { AuditService } from './audit/audit.service';
import { ServiceController } from './service/service.controller';
import { SalesController } from './sales/sales.controller';
import { GuidanceModule } from './guidance/guidance.module';

@Module({
  imports: [
    UserModule,
    TenantModule,
    RoleModule,
    AuthModule,
    Customer360Module,
    MonitoringModule,
    GDPRModule,
    GuardrailsModule,
    GuidanceModule,
    // Temporarily disable GraphQL to fix startup issues
    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile: join(__dirname, 'schema.gql'),
    //   playground: true,
    // }),
  ],
  controllers: [AppController, ServiceController, SalesController],
  providers: [HealthcheckService, PrismaService, UiService, AuditService],
})
export class AppModule {}
