import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { User, Role, Tenant } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  roles?: string[];
  tenantId?: string;
  tenantName?: string;
  aud: string; // Audience
  iss: string; // Issuer
  exp: number; // Expiration
  iat: number; // Issued at
}

export interface IdentityContext {
  user: User;
  tenant: Tenant;
  roles: string[];
  permissions: string[];
}

export interface AzureAdConfig {
  tenantId: string;
  clientId: string;
  audience: string;
  issuer: string;
  jwksUri: string;
}

@Injectable()
export class IdentityProviderService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Parse and verify JWT token from Azure AD/B2C
   */
  async parseAndVerifyToken(token: string): Promise<JwtPayload> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      
      // Verify and decode the JWT
      const payload = await this.jwtService.verifyAsync<JwtPayload>(cleanToken, {
        audience: process.env.AZURE_AD_AUDIENCE,
        issuer: process.env.AZURE_AD_ISSUER,
      });

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract user identity from JWT payload and sync with local DB
   */
  async extractAndSyncUser(payload: JwtPayload): Promise<IdentityContext> {
    const { sub: externalUserId, email, name, roles = [], tenantId, tenantName } = payload;

    // Resolve tenant
    const tenant = await this.resolveTenant(tenantId, tenantName);
    if (!tenant) {
      throw new ForbiddenException('Invalid tenant or tenant not found');
    }

    // Find or create user
    const user = await this.findOrCreateUser({
      externalUserId,
      email,
      name,
      tenantId: tenant.id,
      roles,
    });

    // Get user's effective roles and permissions
    const userRoles = await this.getUserRoles(user.id, tenant.id);
    const permissions = await this.getUserPermissions(user.id, tenant.id);

    return {
      user,
      tenant,
      roles: userRoles,
      permissions,
    };
  }

  /**
   * Resolve tenant from JWT or fallback to default
   */
  private async resolveTenant(tenantId?: string, tenantName?: string): Promise<Tenant | null> {
    if (tenantId) {
      return this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
    }

    if (tenantName) {
      return this.prisma.tenant.findFirst({
        where: { name: tenantName },
      });
    }

    // Fallback to default tenant if configured
    const defaultTenantId = process.env.DEFAULT_TENANT_ID;
    if (defaultTenantId) {
      return this.prisma.tenant.findUnique({
        where: { id: defaultTenantId },
      });
    }

    return null;
  }

  /**
   * Find existing user or create new one
   */
  private async findOrCreateUser(userData: {
    externalUserId: string;
    email: string;
    name?: string;
    tenantId: string;
    roles: string[];
  }): Promise<User> {
    const { externalUserId, email, name, tenantId, roles } = userData;

    // Try to find user by external ID first
    let user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      // Create new user
      const defaultRole = await this.getDefaultRole(tenantId);
      
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          preferredLanguage: 'en',
          spokenLanguages: ['en'],
          roleId: defaultRole.id,
          tenantId,
        },
        include: {
          role: true,
          tenant: true,
        },
      });

      // Assign additional roles if specified
      if (roles.length > 0) {
        await this.assignRolesToUser(user.id, roles, tenantId);
      }
    } else {
      // Update existing user if needed
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          preferredLanguage: user.preferredLanguage || 'en',
          spokenLanguages: user.spokenLanguages.length > 0 ? user.spokenLanguages : ['en'],
        },
        include: {
          role: true,
          tenant: true,
        },
      });
    }

    return user;
  }

  /**
   * Get default role for new users
   */
  private async getDefaultRole(tenantId: string): Promise<Role> {
    const defaultRole = await this.prisma.role.findFirst({
      where: {
        name: 'Agent',
      },
    });

    if (!defaultRole) {
      throw new Error(`Default role not found for tenant ${tenantId}`);
    }

    return defaultRole;
  }

  /**
   * Assign roles to user
   */
  private async assignRolesToUser(userId: string, roleNames: string[], tenantId: string): Promise<void> {
    if (!roleNames || roleNames.length === 0) {
      return;
    }

    const roles = await this.prisma.role.findMany({
      where: {
        name: {
          in: roleNames,
        },
      },
    });

    if (!roles || roles.length === 0) {
      return;
    }

    // Create role assignments
    const roleAssignments = roles.map(role => ({
      userId,
      tenantId,
      roleId: role.id,
      scope: 'global',
      label: `Auto-assigned from JWT`,
    }));

    await this.prisma.roleAssignment.createMany({
      data: roleAssignments,
      skipDuplicates: true,
    });
  }

  /**
   * Get user's effective roles
   */
  private async getUserRoles(userId: string, tenantId: string): Promise<string[]> {
    const roleAssignments = await this.prisma.roleAssignment.findMany({
      where: {
        userId,
        tenantId,
      },
      include: {
        role: true,
      },
    });

    return roleAssignments.map(assignment => assignment.role.name);
  }

  /**
   * Get user's effective permissions
   */
  private async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Collect all permissions from user's roles
    const permissions = new Set<string>();
    
    // Add permissions from primary role
    if (user.role) {
      permissions.add(`${user.role.name}:read`);
      permissions.add(`${user.role.name}:write`);
    }

    // Add permissions from role assignments
    user.roleAssignments.forEach(assignment => {
      permissions.add(`${assignment.role.name}:read`);
      permissions.add(`${assignment.role.name}:write`);
    });

    return Array.from(permissions);
  }

  /**
   * Validate user access to specific resource
   */
  async validateAccess(
    userId: string,
    tenantId: string,
    resource: string,
    action: 'read' | 'write' | 'configure'
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.tenantId !== tenantId) {
      return false;
    }

    // Check primary role
    if (user.role && this.hasPermission(user.role.name, action)) {
      return true;
    }

    // Check role assignments
    return user.roleAssignments.some(assignment => 
      this.hasPermission(assignment.role.name, action)
    );
  }

  /**
   * Check if role has specific permission
   */
  private hasPermission(roleName: string, action: string): boolean {
    const rolePermissions: Record<string, string[]> = {
      'Admin': ['read', 'write', 'configure'],
      'Manager': ['read', 'write'],
      'Agent': ['read'],
    };

    return rolePermissions[roleName]?.includes(action) || false;
  }

  /**
   * Get user context for testing
   */
  async createTestUserContext(tenantId: string, roleName: string = 'Agent'): Promise<IdentityContext> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const role = await this.prisma.role.findFirst({
      where: {
        name: roleName,
      },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found in tenant ${tenantId}`);
    }

    const user = await this.prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: `Test User`,
        preferredLanguage: 'en',
        spokenLanguages: ['en'],
        roleId: role.id,
        tenantId,
      },
      include: {
        role: true,
        tenant: true,
      },
    });

    const roles = await this.getUserRoles(user.id, tenant.id);
    const permissions = await this.getUserPermissions(user.id, tenant.id);

    return {
      user,
      tenant,
      roles,
      permissions,
    };
  }
} 