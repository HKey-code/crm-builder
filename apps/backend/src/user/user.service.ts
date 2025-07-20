

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        roleId: data.roleId,
      },
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateUserInput>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
      include: {
        role: true,
        tenant: true,
      },
    });
  }
}
