import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoleInput } from './dto/create-role.input';
import { Role } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany();
  }

  async findOne(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async create(data: CreateRoleInput): Promise<Role> {
    return this.prisma.role.create({
      data,
    });
  }

  async update(id: string, data: Partial<CreateRoleInput>): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Role> {
    return this.prisma.role.delete({
      where: { id },
    });
  }
} 