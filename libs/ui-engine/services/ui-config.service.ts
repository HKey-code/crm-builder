import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../apps/backend/src/prisma.service';
import { Page, CreatePageInput, UpdatePageInput } from '../models/page.model';
import { Layout, CreateLayoutInput, UpdateLayoutInput } from '../models/layout.model';
import { Section, CreateSectionInput, UpdateSectionInput } from '../models/section.model';
import { ComponentType, CreateComponentTypeInput, UpdateComponentTypeInput } from '../models/component-type.model';
import { ComponentInstance, CreateComponentInstanceInput, UpdateComponentInstanceInput } from '../models/component-instance.model';
import { DataSource, CreateDataSourceInput, UpdateDataSourceInput } from '../models/data-source.model';
import { FieldDefinition, CreateFieldDefinitionInput, UpdateFieldDefinitionInput } from '../models/field-definition.model';
import { BindingConfig, CreateBindingConfigInput, UpdateBindingConfigInput } from '../models/binding-config.model';
import { Interaction, CreateInteractionInput, UpdateInteractionInput } from '../models/interaction.model';

@Injectable()
export class UiConfigService {
  constructor(private prisma: PrismaService) {}

  // Page operations
  async getPages(tenantId: string): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: { tenantId },
      include: {
        sections: {
          include: {
            componentInstances: {
              include: {
                componentType: true,
                binding: true,
                interactions: true,
              },
            },
          },
        },
        layout: true,
        dataSource: true,
      },
    }) as unknown as Page[];
  }

  async getPage(id: string, tenantId: string): Promise<Page | null> {
    return this.prisma.page.findFirst({
      where: { id, tenantId },
      include: {
        sections: {
          include: {
            componentInstances: {
              include: {
                componentType: true,
                binding: true,
                interactions: true,
              },
            },
          },
        },
        layout: true,
        dataSource: true,
      },
    }) as unknown as Page | null;
  }

  async createPage(input: CreatePageInput): Promise<Page> {
    return this.prisma.page.create({
      data: input,
      include: {
        sections: {
          include: {
            componentInstances: {
              include: {
                componentType: true,
                binding: true,
                interactions: true,
              },
            },
          },
        },
        layout: true,
        dataSource: true,
      },
    }) as unknown as Page;
  }

  async updatePage(id: string, input: UpdatePageInput): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: input,
      include: {
        sections: {
          include: {
            componentInstances: {
              include: {
                componentType: true,
                binding: true,
                interactions: true,
              },
            },
          },
        },
        layout: true,
        dataSource: true,
      },
    }) as unknown as Page;
  }

  async deletePage(id: string): Promise<Page> {
    return this.prisma.page.delete({
      where: { id },
      include: {
        sections: {
          include: {
            componentInstances: {
              include: {
                componentType: true,
                binding: true,
                interactions: true,
              },
            },
          },
        },
        layout: true,
        dataSource: true,
      },
    }) as unknown as Page;
  }

  // Layout operations
  async getLayouts(tenantId: string): Promise<Layout[]> {
    return this.prisma.layout.findMany({
      where: { tenantId },
    }) as unknown as Layout[];
  }

  async createLayout(input: CreateLayoutInput): Promise<Layout> {
    return this.prisma.layout.create({
      data: input,
    }) as unknown as Layout;
  }

  // Component Type operations
  async getComponentTypes(tenantId: string): Promise<ComponentType[]> {
    return this.prisma.componentType.findMany({
      where: { tenantId },
    }) as unknown as ComponentType[];
  }

  async createComponentType(input: CreateComponentTypeInput): Promise<ComponentType> {
    return this.prisma.componentType.create({
      data: input,
    }) as unknown as ComponentType;
  }

  // Data Source operations
  async getDataSources(tenantId: string): Promise<DataSource[]> {
    return this.prisma.dataSource.findMany({
      where: { tenantId },
    }) as unknown as DataSource[];
  }

  async createDataSource(input: CreateDataSourceInput): Promise<DataSource> {
    return this.prisma.dataSource.create({
      data: input,
    }) as unknown as DataSource;
  }

  // Field Definition operations
  async getFieldDefinitions(tenantId: string): Promise<FieldDefinition[]> {
    return this.prisma.fieldDefinition.findMany({
      where: { tenantId },
    }) as unknown as FieldDefinition[];
  }

  async createFieldDefinition(input: CreateFieldDefinitionInput): Promise<FieldDefinition> {
    return this.prisma.fieldDefinition.create({
      data: input,
    }) as unknown as FieldDefinition;
  }
} 