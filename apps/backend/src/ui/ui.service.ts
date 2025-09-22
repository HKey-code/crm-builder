import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UiService {
  constructor(private prisma: PrismaService) {}

  // Menu Management
  async createMenu(data: { label: string; type: string }) {
    return this.prisma.menu.create({
      data,
      include: {
        items: true,
      },
    });
  }

  async getMenus() {
    return this.prisma.menu.findMany({
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async getMenuById(id: string) {
    return this.prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async updateMenu(id: string, data: { label?: string; type?: string }) {
    return this.prisma.menu.update({
      where: { id },
      data,
      include: {
        items: true,
      },
    });
  }

  async deleteMenu(id: string) {
    return this.prisma.menu.delete({
      where: { id },
    });
  }

  // MenuItem Management
  async createMenuItem(data: {
    menuId: string;
    label: string;
    icon?: string;
    pageId: string;
    order?: number;
    visibleIfRole?: string;
    visibleIfLicense?: string;
  }) {
    return this.prisma.menuItem.create({
      data,
    });
  }

  async updateMenuItem(id: string, data: {
    label?: string;
    icon?: string;
    pageId?: string;
    order?: number;
    visibleIfRole?: string;
    visibleIfLicense?: string;
  }) {
    return this.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async deleteMenuItem(id: string) {
    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  // StyleTemplate Management
  async createStyleTemplate(data: { name: string; tokens: any }) {
    return this.prisma.styleTemplate.create({
      data,
    });
  }

  async getStyleTemplates() {
    return this.prisma.styleTemplate.findMany();
  }

  async getStyleTemplateById(id: string) {
    return this.prisma.styleTemplate.findUnique({
      where: { id },
    });
  }

  async updateStyleTemplate(id: string, data: { name?: string; tokens?: any }) {
    return this.prisma.styleTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteStyleTemplate(id: string) {
    return this.prisma.styleTemplate.delete({
      where: { id },
    });
  }

  // UIConfig Management
  async createUIConfig(data: { roleId: string; configJson: any }) {
    return this.prisma.uIConfig.create({
      data,
      include: {
        role: true,
      },
    });
  }

  async getUIConfigByRoleId(roleId: string) {
    return this.prisma.uIConfig.findUnique({
      where: { roleId },
      include: {
        role: true,
      },
    });
  }

  async updateUIConfig(roleId: string, data: { configJson: any }) {
    return this.prisma.uIConfig.update({
      where: { roleId },
      data,
      include: {
        role: true,
      },
    });
  }

  async deleteUIConfig(roleId: string) {
    return this.prisma.uIConfig.delete({
      where: { roleId },
    });
  }

  // PermissionSet Management
  async createPermissionSet(data: { name: string; description?: string }) {
    return this.prisma.permissionSet.create({
      data,
    });
  }

  async getPermissionSets() {
    return this.prisma.permissionSet.findMany({
      include: {
        roleLinks: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async assignPermissionSetToRole(roleId: string, permissionSetId: string) {
    return this.prisma.rolePermissionSet.create({
      data: {
        roleId,
        permissionSetId,
      },
      include: {
        role: true,
        permissionSet: true,
      },
    });
  }

  async removePermissionSetFromRole(roleId: string, permissionSetId: string) {
    return this.prisma.rolePermissionSet.delete({
      where: {
        roleId_permissionSetId: {
          roleId,
          permissionSetId,
        },
      },
    });
  }
}
