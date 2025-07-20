import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User as PrismaUser, Tenant } from '@prisma/client';

@Resolver(() => User)
@UseGuards(RolesGuard)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  @Roles('Admin', 'Manager')
  async findAll(
    @CurrentUser() user: PrismaUser,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User[]> {
    console.log(`GraphQL: User ${user.email} from tenant ${tenant.name} requested all users`);
    const users = await this.userService.findAll();
    return users as unknown as User[];
  }

  @Query(() => User, { name: 'user', nullable: true })
  @Roles('Admin', 'Manager')
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: PrismaUser,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User | null> {
    console.log(`GraphQL: User ${user.email} from tenant ${tenant.name} requested user ${id}`);
    const userResult = await this.userService.findOne(id);
    return userResult as unknown as User | null;
  }

  @Mutation(() => User)
  @Roles('Admin')
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @CurrentUser() user: PrismaUser,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User> {
    console.log(`GraphQL: User ${user.email} from tenant ${tenant.name} creating new user`);
    const newUser = await this.userService.create(createUserInput);
    return newUser as unknown as User;
  }

  @Mutation(() => User)
  @Roles('Admin')
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: PrismaUser,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User> {
    console.log(`GraphQL: User ${user.email} from tenant ${tenant.name} updating user`);
    const { id, ...data } = updateUserInput;
    const updatedUser = await this.userService.update(id, data);
    return updatedUser as unknown as User;
  }

  @Mutation(() => User)
  @Roles('Admin')
  async removeUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: PrismaUser,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User> {
    console.log(`GraphQL: User ${user.email} from tenant ${tenant.name} removing user ${id}`);
    const removedUser = await this.userService.remove(id);
    return removedUser as unknown as User;
  }
}