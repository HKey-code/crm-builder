import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { IdentityProviderService, JwtPayload, IdentityContext } from '../identity-provider.service';
import { PrismaService } from '../../prisma.service';

// Mock environment variables
const mockEnv = {
  AZURE_AD_AUDIENCE: 'test-audience',
  AZURE_AD_ISSUER: 'test-issuer',
  DEFAULT_TENANT_ID: 'default-tenant',
};

// Mock process.env
Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true,
});

describe('IdentityProviderService', () => {
  let service: IdentityProviderService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  // Mock JWT service with comprehensive Azure AD/B2C behavior
  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  // Mock Prisma service with all required methods
  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    roleAssignment: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  // Mock data for consistent testing
  const mockJwtPayload: JwtPayload = {
    sub: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['Admin', 'Agent'],
    tenantId: 'tenant123',
    tenantName: 'Test Tenant',
    aud: 'test-audience',
    iss: 'test-issuer',
    exp: Date.now() + 3600000, // 1 hour from now
    iat: Date.now(),
  };

  const mockTenant = {
    id: 'tenant123',
    name: 'Test Tenant',
    supportedLocales: ['en'],
    defaultLocale: 'en',
    isIsolated: false,
    createdAt: new Date(),
  };

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    tenantId: 'tenant123',
    role: { id: 'role123', name: 'Agent' },
    tenant: mockTenant,
    preferredLanguage: 'en',
    spokenLanguages: ['en'],
    roleId: 'role123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityProviderService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<IdentityProviderService>(IdentityProviderService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAndVerifyToken', () => {
    it('should parse and verify valid JWT token from Azure AD', async () => {
      // Mock successful JWT verification (Azure AD behavior)
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);

      const result = await service.parseAndVerifyToken('valid.jwt.token');

      expect(result).toEqual(mockJwtPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', {
        audience: process.env.AZURE_AD_AUDIENCE,
        issuer: process.env.AZURE_AD_ISSUER,
      });
    });

    it('should remove Bearer prefix from token (Azure AD standard)', async () => {
      // Mock successful JWT verification
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);

      await service.parseAndVerifyToken('Bearer valid.jwt.token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', expect.any(Object));
    });

    it('should handle case-insensitive Bearer prefix', async () => {
      // Mock successful JWT verification
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);

      await service.parseAndVerifyToken('bearer valid.jwt.token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', expect.any(Object));
    });

    it('should throw UnauthorizedException for invalid token (Azure AD error)', async () => {
      // Mock JWT verification failure (simulating Azure AD rejection)
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.parseAndVerifyToken('invalid.token')).rejects.toThrow(UnauthorizedException);
      await expect(service.parseAndVerifyToken('invalid.token')).rejects.toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Mock JWT verification failure for expired token
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(service.parseAndVerifyToken('expired.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for malformed token', async () => {
      // Mock JWT verification failure for malformed token
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Malformed token'));

      await expect(service.parseAndVerifyToken('malformed.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error during JWT verification
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Network error'));

      await expect(service.parseAndVerifyToken('network.error.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should handle Azure AD 403 errors gracefully', async () => {
      // Mock Azure AD 403 error
      const azureError = new Error('Forbidden: Insufficient permissions');
      azureError.name = 'ForbiddenError';
      mockJwtService.verifyAsync.mockRejectedValue(azureError);

      await expect(service.parseAndVerifyToken('forbidden.token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('extractAndSyncUser', () => {
    it('should create new user when user does not exist (Azure AD first-time login)', async () => {
      // Mock Azure AD user data and database responses
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.role.findFirst.mockResolvedValue({ id: 'role123', name: 'Agent' });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      const result = await service.extractAndSyncUser(mockJwtPayload);

      expect(result.user).toEqual(mockUser);
      expect(result.tenant).toEqual(mockTenant);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          preferredLanguage: 'en',
          spokenLanguages: ['en'],
          roleId: 'role123',
          tenantId: 'tenant123',
        },
        include: {
          role: true,
          tenant: true,
        },
      });
    });

    it('should update existing user when user exists (Azure AD subsequent login)', async () => {
      // Mock existing user found in database
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      const result = await service.extractAndSyncUser(mockJwtPayload);

      expect(result.user).toEqual(mockUser);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should handle user without name in JWT payload', async () => {
      const payloadWithoutName = { ...mockJwtPayload, name: undefined };
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.role.findFirst.mockResolvedValue({ id: 'role123', name: 'Agent' });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      await service.extractAndSyncUser(payloadWithoutName);

      // Should use email prefix as name
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'test', // email.split('@')[0]
        }),
        include: expect.any(Object),
      });
    });

    it('should assign additional roles from JWT payload', async () => {
      // Mock role assignments for Azure AD roles
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.role.findFirst.mockResolvedValue({ id: 'role123', name: 'Agent' });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.role.findMany.mockResolvedValue([
        { id: 'role1', name: 'Admin' },
        { id: 'role2', name: 'Agent' },
      ]);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      await service.extractAndSyncUser(mockJwtPayload);

      // Should create role assignments for Azure AD roles
      expect(mockPrismaService.roleAssignment.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user123',
            tenantId: 'tenant123',
            roleId: 'role1',
            scope: 'global',
            label: 'Auto-assigned from JWT',
          },
          {
            userId: 'user123',
            tenantId: 'tenant123',
            roleId: 'role2',
            scope: 'global',
            label: 'Auto-assigned from JWT',
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should throw ForbiddenException when tenant not found (Azure AD tenant mismatch)', async () => {
      // Mock tenant not found in database
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);

      await expect(service.extractAndSyncUser(mockJwtPayload)).rejects.toThrow(ForbiddenException);
      await expect(service.extractAndSyncUser(mockJwtPayload)).rejects.toThrow('Invalid tenant or tenant not found');
    });

    it('should fallback to default tenant when tenant not specified in JWT', async () => {
      const payloadWithoutTenant = { ...mockJwtPayload, tenantId: undefined, tenantName: undefined };
      
      // Mock default tenant lookup
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.role.findFirst.mockResolvedValue({ id: 'role123', name: 'Agent' });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      const result = await service.extractAndSyncUser(payloadWithoutTenant);

      expect(result.tenant).toEqual(mockTenant);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'default-tenant' },
      });
    });

    it('should handle Azure AD network errors gracefully', async () => {
      // Mock network error during tenant resolution
      mockPrismaService.tenant.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.extractAndSyncUser(mockJwtPayload)).rejects.toThrow();
    });
  });

  describe('validateAccess', () => {
    const mockUserWithRoles = {
      id: 'user123',
      email: 'test@example.com',
      tenantId: 'tenant123',
      role: { name: 'Admin' },
      roleAssignments: [
        { role: { name: 'Admin' } },
        { role: { name: 'Agent' } },
      ],
    };

    it('should return true for admin user with configure permission (Azure AD admin role)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithRoles);

      const result = await service.validateAccess('user123', 'tenant123', 'pages', 'configure');

      expect(result).toBe(true);
    });

    it('should return true for agent user with read permission', async () => {
      const agentUser = { ...mockUserWithRoles, role: { name: 'Agent' } };
      mockPrismaService.user.findUnique.mockResolvedValue(agentUser);

      const result = await service.validateAccess('user123', 'tenant123', 'pages', 'read');

      expect(result).toBe(true);
    });

    it('should return false for agent user with configure permission (insufficient permissions)', async () => {
      const agentUser = { 
        ...mockUserWithRoles, 
        role: { name: 'Agent' },
        roleAssignments: [] // No additional role assignments
      };
      mockPrismaService.user.findUnique.mockResolvedValue(agentUser);

      const result = await service.validateAccess('user123', 'tenant123', 'pages', 'configure');

      expect(result).toBe(false);
    });

    it('should return false for user not in tenant (Azure AD tenant isolation)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUserWithRoles,
        tenantId: 'different-tenant',
      });

      const result = await service.validateAccess('user123', 'tenant123', 'pages', 'read');

      expect(result).toBe(false);
    });

    it('should return false for non-existent user (Azure AD user not synced)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateAccess('user123', 'tenant123', 'pages', 'read');

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.validateAccess('user123', 'tenant123', 'pages', 'read')).rejects.toThrow('Database error');
    });
  });

  describe('createTestUserContext', () => {
    const mockTenant = {
      id: 'tenant123',
      name: 'Test Tenant',
    };

    const mockRole = {
      id: 'role123',
      name: 'Agent',
    };

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      tenantId: 'tenant123',
      role: mockRole,
      tenant: mockTenant,
    };

    it('should create test user context successfully (for testing scenarios)', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.role.findFirst.mockResolvedValue(mockRole);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      const result = await service.createTestUserContext('tenant123', 'Agent');

      expect(result.user).toBeDefined();
      expect(result.tenant).toEqual(mockTenant);
      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual(['Agent:read', 'Agent:write']);
    });

    it('should throw error when tenant not found (Azure AD tenant validation)', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.createTestUserContext('tenant123')).rejects.toThrow('Tenant tenant123 not found');
    });

    it('should throw error when role not found (Azure AD role validation)', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      await expect(service.createTestUserContext('tenant123', 'NonExistentRole')).rejects.toThrow('Role NonExistentRole not found in tenant tenant123');
    });

    it('should use default role when no role specified', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.role.findFirst.mockResolvedValue(mockRole);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      const result = await service.createTestUserContext('tenant123');

      expect((result.user as any).role?.name).toBe('Agent');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty roles array from Azure AD', async () => {
      const payloadWithEmptyRoles = { ...mockJwtPayload, roles: [] };
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.role.findFirst.mockResolvedValue({ id: 'role123', name: 'Agent' });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      const result = await service.extractAndSyncUser(payloadWithEmptyRoles);

      expect(result.user).toBeDefined();
      expect(mockPrismaService.roleAssignment.createMany).not.toHaveBeenCalled();
    });

    it('should handle malformed JWT payload gracefully', async () => {
      const malformedPayload = { ...mockJwtPayload, sub: 'malformed-user-id' };
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.role.findFirst.mockResolvedValue({ id: 'role123', name: 'Agent' });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.roleAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        roleAssignments: [],
      });

      const result = await service.extractAndSyncUser(malformedPayload);

      expect(result.user).toBeDefined();
    });

    it('should handle Azure AD rate limiting gracefully', async () => {
      // Mock Azure AD rate limiting error
      const rateLimitError = new Error('Too many requests');
      rateLimitError.name = 'RateLimitError';
      mockJwtService.verifyAsync.mockRejectedValue(rateLimitError);

      await expect(service.parseAndVerifyToken('rate.limited.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should handle Azure AD service unavailable gracefully', async () => {
      // Mock Azure AD service unavailable
      const serviceUnavailableError = new Error('Service unavailable');
      serviceUnavailableError.name = 'ServiceUnavailableError';
      mockJwtService.verifyAsync.mockRejectedValue(serviceUnavailableError);

      await expect(service.parseAndVerifyToken('service.unavailable.token')).rejects.toThrow(UnauthorizedException);
    });
  });
}); 