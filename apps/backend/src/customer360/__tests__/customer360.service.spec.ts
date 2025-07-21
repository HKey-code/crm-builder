import { Test, TestingModule } from '@nestjs/testing';
import { Customer360Service } from '../customer360.service';
import { PrismaService } from '../../prisma.service';
import { NotFoundException } from '@nestjs/common';
import { User } from '../../auth/types/user.interface';
import { Tenant } from '../../auth/types/tenant.interface';

describe('Customer360Service', () => {
  let service: Customer360Service;
  let prismaService: PrismaService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    preferredLanguage: 'en',
    spokenLanguages: ['en'],
    roleId: 'role-1',
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTenant: Tenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    supportedLocales: ['en'],
    defaultLocale: 'en',
    deploymentStack: 'test',
    isIsolated: false,
    appVersion: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContact = {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    title: 'Manager',
    department: 'Sales',
    isPrimary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-1',
      name: 'Acme Corp',
    },
  };

  const mockModuleLicenses = [
    {
      id: 'license-1',
      moduleName: 'sales',
      isActive: true,
      expiresAt: null,
      tenantId: 'tenant-1',
    },
    {
      id: 'license-2',
      moduleName: 'service',
      isActive: true,
      expiresAt: null,
      tenantId: 'tenant-1',
    },
  ];

  const mockRoleAssignments = [
    {
      id: 'assignment-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: {
        id: 'role-1',
        name: 'sales_manager',
      },
    },
    {
      id: 'assignment-2',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: {
        id: 'role-2',
        name: 'service_manager',
      },
    },
  ];

  const mockPrismaService = {
    contact: {
      findFirst: jest.fn(),
    },
    moduleLicense: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    roleAssignment: {
      findMany: jest.fn(),
    },
    opportunity: {
      findMany: jest.fn(),
    },
    case: {
      findMany: jest.fn(),
    },
    marketingCampaign: {
      findMany: jest.fn(),
    },
    portalActivity: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Customer360Service,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<Customer360Service>(Customer360Service);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('aggregateCustomerView', () => {
    it('should return aggregated customer data when contact exists and user has access', async () => {
      // Mock contact lookup
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);

      // Mock module licenses
      mockPrismaService.moduleLicense.findMany.mockResolvedValue(mockModuleLicenses);

      // Mock role assignments
      mockPrismaService.roleAssignment.findMany.mockResolvedValue(mockRoleAssignments);

      // Mock module data
      mockPrismaService.opportunity.findMany.mockResolvedValue([
        {
          id: 'opp-1',
          name: 'Deal 1',
          amount: 10000,
          stage: 'prospecting',
          probability: 25,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockPrismaService.case.findMany.mockResolvedValue([
        {
          id: 'case-1',
          caseNumber: 'CASE-001',
          subject: 'Support Request',
          priority: 'medium',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockPrismaService.marketingCampaign.findMany.mockResolvedValue([]);
      mockPrismaService.portalActivity.findMany.mockResolvedValue([]);

      const result = await service.aggregateCustomerView(
        'contact-1',
        mockUser,
        mockTenant,
      );

      expect(result).toEqual({
        id: 'contact-1',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        title: 'Manager',
        department: 'Sales',
        opportunities: [
          {
            id: 'opp-1',
            name: 'Deal 1',
            amount: 10000,
            stage: 'prospecting',
            probability: 25,
            expectedCloseDate: undefined,
            actualCloseDate: undefined,
            description: undefined,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
        cases: [
          {
            id: 'case-1',
            caseNumber: 'CASE-001',
            subject: 'Support Request',
            description: undefined,
            priority: 'medium',
            status: 'open',
            assignedTo: undefined,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            resolvedAt: undefined,
          },
        ],
        marketingCampaigns: [],
        portalActivity: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when contact does not exist', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.aggregateCustomerView('non-existent', mockUser, mockTenant),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only return data from modules user has access to', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);

      // Mock only sales module license
      mockPrismaService.moduleLicense.findMany.mockResolvedValue([
        {
          id: 'license-1',
          moduleName: 'sales',
          isActive: true,
          expiresAt: null,
          tenantId: 'tenant-1',
        },
      ]);

      mockPrismaService.roleAssignment.findMany.mockResolvedValue(mockRoleAssignments);

      // Mock only sales data
      mockPrismaService.opportunity.findMany.mockResolvedValue([
        {
          id: 'opp-1',
          name: 'Deal 1',
          amount: 10000,
          stage: 'prospecting',
          probability: 25,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.aggregateCustomerView(
        'contact-1',
        mockUser,
        mockTenant,
      );

      expect(result.opportunities).toHaveLength(1);
      expect(result.cases).toHaveLength(0);
      expect(result.marketingCampaigns).toHaveLength(0);
      expect(result.portalActivity).toHaveLength(0);
    });
  });

  describe('getAvailableModules', () => {
    it('should return list of available modules for tenant', async () => {
      mockPrismaService.moduleLicense.findMany.mockResolvedValue(mockModuleLicenses);

      const result = await service.getAvailableModules('tenant-1');

      expect(result).toEqual(['sales', 'service']);
    });

    it('should return empty array when no modules are licensed', async () => {
      mockPrismaService.moduleLicense.findMany.mockResolvedValue([]);

      const result = await service.getAvailableModules('tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('validateModuleAccess', () => {
    it('should return true when user has license and role access', async () => {
      mockPrismaService.moduleLicense.findFirst.mockResolvedValue({
        id: 'license-1',
        moduleName: 'sales',
        isActive: true,
        expiresAt: null,
        tenantId: 'tenant-1',
      });

      mockPrismaService.roleAssignment.findMany.mockResolvedValue(mockRoleAssignments);

      const result = await service.validateModuleAccess(
        'user-1',
        'tenant-1',
        'sales',
      );

      expect(result).toBe(true);
    });

    it('should return false when module is not licensed', async () => {
      mockPrismaService.moduleLicense.findFirst.mockResolvedValue(null);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue(mockRoleAssignments);

      const result = await service.validateModuleAccess(
        'user-1',
        'tenant-1',
        'marketing',
      );

      expect(result).toBe(false);
    });

    it('should return false when user lacks role access', async () => {
      mockPrismaService.moduleLicense.findFirst.mockResolvedValue({
        id: 'license-1',
        moduleName: 'sales',
        isActive: true,
        expiresAt: null,
        tenantId: 'tenant-1',
      });

      mockPrismaService.roleAssignment.findMany.mockResolvedValue([
        {
          id: 'assignment-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          role: {
            id: 'role-1',
            name: 'portal_user', // Wrong role for sales module
          },
        },
      ]);

      const result = await service.validateModuleAccess(
        'user-1',
        'tenant-1',
        'sales',
      );

      expect(result).toBe(false);
    });
  });
}); 