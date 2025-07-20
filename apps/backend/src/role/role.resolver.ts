import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { RoleService } from './role.service';
import { CreateRoleInput } from './dto/create-role.input';
import { Role } from './entities/role.entity';

@Resolver(() => Role)
export class RoleResolver {
  constructor(private readonly roleService: RoleService) {}

  @Query(() => [Role])
  async getRoles(): Promise<Role[]> {
    const roles = await this.roleService.findAll();
    return roles as unknown as Role[];
  }

  @Query(() => Role, { nullable: true })
  async getRole(@Args('id', { type: () => ID }) id: string): Promise<Role | null> {
    const role = await this.roleService.findOne(id);
    return role as unknown as Role | null;
  }

  @Mutation(() => Role)
  async createRole(@Args('input') input: CreateRoleInput): Promise<Role> {
    const role = await this.roleService.create(input);
    return role as unknown as Role;
  }

  @Mutation(() => Role)
  async updateRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CreateRoleInput,
  ): Promise<Role> {
    const role = await this.roleService.update(id, input);
    return role as unknown as Role;
  }

  @Mutation(() => Role)
  async removeRole(@Args('id', { type: () => ID }) id: string): Promise<Role> {
    const role = await this.roleService.remove(id);
    return role as unknown as Role;
  }
} 