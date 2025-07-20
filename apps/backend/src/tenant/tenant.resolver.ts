import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TenantService } from './tenant.service';
import { CreateTenantInput } from './dto/create-tenant.input';
import { Tenant } from './entities/tenant.entity';
import { Tenant as PrismaTenant } from '@prisma/client';

@Resolver(() => Tenant)
export class TenantResolver {
  constructor(private readonly tenantService: TenantService) {}

  @Query(() => [Tenant])
  async tenants(): Promise<Tenant[]> {
    const tenants = await this.tenantService.findAll();
    return tenants as unknown as Tenant[];
  }

  @Query(() => Tenant, { nullable: true })
  async tenant(@Args('id', { type: () => ID }) id: string): Promise<Tenant | null> {
    const tenant = await this.tenantService.findOne(id);
    return tenant as unknown as Tenant | null;
  }

  @Mutation(() => Tenant)
  async createTenant(@Args('input') input: CreateTenantInput): Promise<Tenant> {
    const tenant = await this.tenantService.create(input);
    return tenant as unknown as Tenant;
  }

  @Mutation(() => Tenant)
  async updateTenant(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CreateTenantInput,
  ): Promise<Tenant> {
    const tenant = await this.tenantService.update(id, input);
    return tenant as unknown as Tenant;
  }

  @Mutation(() => Tenant)
  async removeTenant(@Args('id', { type: () => ID }) id: string): Promise<Tenant> {
    const tenant = await this.tenantService.remove(id);
    return tenant as unknown as Tenant;
  }
} 