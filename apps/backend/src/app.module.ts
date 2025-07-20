


import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { UserModule } from './user/user.module';
import { TenantModule } from './tenant/tenant.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { Customer360Module } from './customer360/customer360.module';
import { AppController } from './app.controller';
import { HealthcheckService } from './healthcheck.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    UserModule,
    TenantModule,
    RoleModule,
    AuthModule,
    Customer360Module,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(__dirname, 'schema.gql'), // ✅ Use __dirname here
      playground: true,
    }),
  ],
  controllers: [AppController],
  providers: [HealthcheckService, PrismaService],
})
export class AppModule {}
