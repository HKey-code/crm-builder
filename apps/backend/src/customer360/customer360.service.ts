import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Customer360Dto, OpportunityDto, CaseDto, MarketingCampaignDto, PortalActivityDto } from './dto/customer360.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { User } from '../auth/types/user.interface';
import { Tenant } from '../auth/types/tenant.interface';

@Injectable()
export class Customer360Service {
  constructor(private prisma: PrismaService) {}

  /**
   * Aggregates customer data across all modules based on user permissions and module licenses
   */
  async aggregateCustomerView(
    contactId: string,
    currentUser: User,
    currentTenant: Tenant
  ): Promise<Customer360Dto> {
    // Verify contact exists and user has access
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: currentTenant.id,
      },
      include: {
        customer: true,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Get user's module licenses and permissions
    const userModuleAccess = await this.getUserModuleAccess(currentUser.id, currentTenant.id);

    // Aggregate data from each module based on access
    const aggregatedData = await this.aggregateModuleData(contactId, currentTenant.id, userModuleAccess);

    return {
      id: contact.id,
      fullName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone || undefined,
      title: contact.title || undefined,
      department: contact.department || undefined,
      opportunities: aggregatedData.opportunities,
      cases: aggregatedData.cases,
      marketingCampaigns: aggregatedData.marketingCampaigns,
      portalActivity: aggregatedData.portalActivities,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  /**
   * Gets user's access to different modules based on licenses and roles
   */
  private async getUserModuleAccess(userId: string, tenantId: string) {
    const [moduleLicenses, userRoles] = await Promise.all([
      this.prisma.moduleLicense.findMany({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
      this.prisma.roleAssignment.findMany({
        where: {
          userId,
          tenantId,
        },
        include: {
          role: true,
        },
      }),
    ]);

    const moduleAccess: Record<string, boolean> = {};
    const availableModules = ['sales', 'service', 'marketing', 'portal'];

    for (const module of availableModules) {
      const license = moduleLicenses.find(l => l.moduleName === module);
      const hasLicense = license && license.isActive;
      
      // Check if user has role-based access to this module
      const hasRoleAccess = userRoles.some(assignment => {
        const role = assignment.role;
        // Define role-based module access rules
        const moduleAccessRules: Record<string, string[]> = {
          'sales': ['sales_manager', 'sales_rep', 'admin'],
          'service': ['service_manager', 'service_rep', 'admin'],
          'marketing': ['marketing_manager', 'marketing_rep', 'admin'],
          'portal': ['portal_user', 'admin'],
        };
        
        return moduleAccessRules[module]?.includes(role.name) || role.name === 'admin';
      });

      moduleAccess[module] = Boolean(hasLicense && hasRoleAccess);
    }

    return moduleAccess;
  }

  /**
   * Aggregates data from all modules the user has access to
   */
  private async aggregateModuleData(
    contactId: string,
    tenantId: string,
    moduleAccess: Record<string, boolean>
  ) {
    const aggregationPromises: Promise<any>[] = [];

    // Sales module data
    if (moduleAccess.sales) {
      aggregationPromises.push(
        this.prisma.opportunity.findMany({
          where: {
            contactId,
            tenantId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    } else {
      aggregationPromises.push(Promise.resolve([]));
    }

    // Service module data
    if (moduleAccess.service) {
      aggregationPromises.push(
        this.prisma.case.findMany({
          where: {
            contactId,
            tenantId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    } else {
      aggregationPromises.push(Promise.resolve([]));
    }

    // Marketing module data
    if (moduleAccess.marketing) {
      aggregationPromises.push(
        this.prisma.marketingCampaign.findMany({
          where: {
            contacts: {
              some: {
                id: contactId,
              },
            },
            tenantId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    } else {
      aggregationPromises.push(Promise.resolve([]));
    }

    // Portal module data
    if (moduleAccess.portal) {
      aggregationPromises.push(
        this.prisma.portalActivity.findMany({
          where: {
            contactId,
            tenantId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    } else {
      aggregationPromises.push(Promise.resolve([]));
    }

    const [opportunities, cases, marketingCampaigns, portalActivities] = await Promise.all(aggregationPromises);

    return {
      opportunities: opportunities.map(this.mapOpportunityToDto),
      cases: cases.map(this.mapCaseToDto),
      marketingCampaigns: marketingCampaigns.map(this.mapMarketingCampaignToDto),
      portalActivities: portalActivities.map(this.mapPortalActivityToDto),
    };
  }

  /**
   * Maps Prisma Opportunity to DTO
   */
  private mapOpportunityToDto(opportunity: any): OpportunityDto {
    return {
      id: opportunity.id,
      name: opportunity.name,
      amount: Number(opportunity.amount),
      stage: opportunity.stage,
      probability: opportunity.probability,
      expectedCloseDate: opportunity.expectedCloseDate,
      actualCloseDate: opportunity.actualCloseDate,
      description: opportunity.description,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    };
  }

  /**
   * Maps Prisma Case to DTO
   */
  private mapCaseToDto(case_: any): CaseDto {
    return {
      id: case_.id,
      caseNumber: case_.caseNumber,
      subject: case_.subject,
      description: case_.description,
      priority: case_.priority,
      status: case_.status,
      assignedTo: case_.assignedTo,
      createdAt: case_.createdAt,
      updatedAt: case_.updatedAt,
      resolvedAt: case_.resolvedAt,
    };
  }

  /**
   * Maps Prisma MarketingCampaign to DTO
   */
  private mapMarketingCampaignToDto(campaign: any): MarketingCampaignDto {
    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget ? Number(campaign.budget) : undefined,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  /**
   * Maps Prisma PortalActivity to DTO
   */
  private mapPortalActivityToDto(activity: any): PortalActivityDto {
    return {
      id: activity.id,
      activityType: activity.activityType,
      description: activity.description,
      metadata: activity.metadata,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      createdAt: activity.createdAt,
    };
  }

  /**
   * Gets available modules for a tenant
   */
  async getAvailableModules(tenantId: string): Promise<string[]> {
    const licenses = await this.prisma.moduleLicense.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return licenses.map(license => license.moduleName);
  }

  /**
   * Validates if a user can access a specific module
   */
  async validateModuleAccess(
    userId: string,
    tenantId: string,
    moduleName: string
  ): Promise<boolean> {
    const [license, userRoles] = await Promise.all([
      this.prisma.moduleLicense.findFirst({
        where: {
          tenantId,
          moduleName,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
      this.prisma.roleAssignment.findMany({
        where: {
          userId,
          tenantId,
        },
        include: {
          role: true,
        },
      }),
    ]);

    if (!license) {
      return false;
    }

    // Check role-based access
    const moduleAccessRules: Record<string, string[]> = {
      'sales': ['sales_manager', 'sales_rep', 'admin'],
      'service': ['service_manager', 'service_rep', 'admin'],
      'marketing': ['marketing_manager', 'marketing_rep', 'admin'],
      'portal': ['portal_user', 'admin'],
    };

    return userRoles.some(assignment => {
      const role = assignment.role;
      return moduleAccessRules[moduleName]?.includes(role.name) || role.name === 'admin';
    });
  }
} 