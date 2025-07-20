import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantInput } from './dto/create-tenant.input';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Post()
  async create(@Body() createTenantInput: CreateTenantInput) {
    return this.tenantService.create(createTenantInput);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTenantInput: CreateTenantInput) {
    return this.tenantService.update(id, updateTenantInput);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
} 