import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTenantInput } from './dto/create-tenant.input';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async create(data: CreateTenantInput): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        ...data,
        defaultLocale: data.defaultLocale || 'en',
        isIsolated: data.isIsolated || false,
      },
    });
  }

  async update(id: string, data: Partial<CreateTenantInput>): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Tenant> {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}