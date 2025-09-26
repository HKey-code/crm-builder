

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
        tenant: true,
        userLicenses: {
          include: {
            role: true,
            tenantLicense: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        userLicenses: {
          include: {
            role: true,
            tenantLicense: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        tenantId: data.tenantId,
        isSystemUser: data.isSystemUser || false,
        userType: data.userType || 'HUMAN',
        status: data.status || 'active',
      },
      include: {
        tenant: true,
        userLicenses: {
          include: {
            role: true,
            tenantLicense: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<CreateUserInput>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        tenantId: data.tenantId,
        isSystemUser: data.isSystemUser,
        userType: data.userType,
        status: data.status,
      },
      include: {
        tenant: true,
        userLicenses: {
          include: {
            role: true,
            tenantLicense: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
      include: {
        tenant: true,
        userLicenses: {
          include: {
            role: true,
            tenantLicense: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        userLicenses: {
          include: {
            role: true,
            tenantLicense: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });
  }

  async getSystemUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isSystemUser: true },
      include: {
        tenant: true,
        userLicenses: {
          include: {
            role: true,
            tenantLicense: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });
  }
}
