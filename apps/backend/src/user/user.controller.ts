

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, Tenant } from '@prisma/client';

@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('Admin', 'Manager')
  async findAll(
    @CurrentUser() user: User,
    @CurrentTenant() tenant: Tenant,
  ) {
    console.log(`User ${user.email} from tenant ${tenant.name} requested all users`);
    return this.userService.findAll();
  }

  @Post()
  @Roles('Admin')
  async create(
    @Body() createUserInput: CreateUserInput,
    @CurrentUser() user: User,
    @CurrentTenant() tenant: Tenant,
  ) {
    console.log(`User ${user.email} from tenant ${tenant.name} creating new user`);
    return this.userService.create(createUserInput);
  }
}
