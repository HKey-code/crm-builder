import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Customer360Service } from './customer360.service';
import { Customer360Dto, Customer360Input } from './dto/customer360.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/types/user.interface';
import { Tenant } from '../auth/types/tenant.interface';

@Resolver(() => Customer360Dto)
@UseGuards(RolesGuard)
export class Customer360Resolver {
  constructor(private customer360Service: Customer360Service) {}

  @Query(() => Customer360Dto, {
    description: 'Get a unified 360-degree view of a customer across all modules',
  })
  @Roles('admin', 'sales_manager', 'sales_rep', 'service_manager', 'service_rep', 'marketing_manager', 'marketing_rep', 'portal_user')
  async customer360(
    @Args('input') input: Customer360Input,
    @CurrentUser() currentUser: User,
    @CurrentTenant() currentTenant: Tenant,
  ): Promise<Customer360Dto> {
    return this.customer360Service.aggregateCustomerView(
      input.id,
      currentUser,
      currentTenant,
    );
  }

  @Query(() => [String], {
    description: 'Get available modules for the current tenant',
  })
  @Roles('admin')
  async availableModules(
    @CurrentTenant() currentTenant: Tenant,
  ): Promise<string[]> {
    return this.customer360Service.getAvailableModules(currentTenant.id);
  }
} 