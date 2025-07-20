import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../apps/backend/src/prisma.service';
import {
  PermissionRule,
  CreatePermissionRuleInput,
  UpdatePermissionRuleInput,
  PermissionCheckInput,
  PermissionCheckResult,
  PermissionLevel,
  PermissionTargetType
} from '../models/permission-rule.model';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  // Permission Rule CRUD operations
  async getPermissionRules(tenantId: string): Promise<PermissionRule[]> {
    return this.prisma.permissionRule.findMany({
      where: { tenantId },
      include: {
        roles: true,
      },
    }) as unknown as PermissionRule[];
  }

  async getPermissionRule(id: string, tenantId: string): Promise<PermissionRule | null> {
    return this.prisma.permissionRule.findFirst({
      where: { id, tenantId },
      include: {
        roles: true,
      },
    }) as unknown as PermissionRule | null;
  }

  async createPermissionRule(input: CreatePermissionRuleInput): Promise<PermissionRule> {
    return this.prisma.permissionRule.create({
      data: input,
      include: {
        roles: true,
      },
    }) as unknown as PermissionRule;
  }

  async updatePermissionRule(id: string, input: UpdatePermissionRuleInput): Promise<PermissionRule> {
    return this.prisma.permissionRule.update({
      where: { id },
      data: input,
      include: {
        roles: true,
      },
    }) as unknown as PermissionRule;
  }

  async deletePermissionRule(id: string): Promise<PermissionRule> {
    return this.prisma.permissionRule.delete({
      where: { id },
      include: {
        roles: true,
      },
    }) as unknown as PermissionRule;
  }

  // Permission checking logic
  async checkPermission(input: PermissionCheckInput): Promise<PermissionCheckResult> {
    const { userId, tenantId, targetType, targetId, requiredPermission, context } = input;

    // Get user's role
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return {
        allowed: false,
        reason: 'User not found or not in tenant',
      };
    }

    // Get permission rules for the target
    const permissionRules = await this.prisma.permissionRule.findMany({
      where: {
        targetType,
        targetId,
        tenantId,
        roleIds: {
          has: user.roleId,
        },
      },
      include: {
        roles: true,
      },
    });

    if (permissionRules.length === 0) {
      // No specific rules found, check for default permissions
      return this.checkDefaultPermissions(user.role.name, requiredPermission);
    }

    // Check if any rule grants the required permission
    const effectivePermission = this.getEffectivePermission(permissionRules, context);
    
    if (this.hasPermission(effectivePermission, requiredPermission)) {
      return {
        allowed: true,
        effectivePermission,
      };
    }

    return {
      allowed: false,
      reason: `Insufficient permissions. Required: ${requiredPermission}, Effective: ${effectivePermission}`,
      effectivePermission,
    };
  }

  // Check permissions for multiple targets
  async checkMultiplePermissions(
    userId: string,
    tenantId: string,
    checks: Array<{ targetType: PermissionTargetType; targetId: string; requiredPermission: PermissionLevel }>
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {};

    for (const check of checks) {
      const key = `${check.targetType}:${check.targetId}`;
      results[key] = await this.checkPermission({
        userId,
        tenantId,
        targetType: check.targetType,
        targetId: check.targetId,
        requiredPermission: check.requiredPermission,
      });
    }

    return results;
  }

  // Get all permissions for a user on a specific target type
  async getUserPermissions(
    userId: string,
    tenantId: string,
    targetType: PermissionTargetType
  ): Promise<PermissionRule[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return [];
    }

    return this.prisma.permissionRule.findMany({
      where: {
        targetType,
        tenantId,
        roleIds: {
          has: user.roleId,
        },
      },
      include: {
        roles: true,
      },
    }) as unknown as PermissionRule[];
  }

  // Private helper methods
  private checkDefaultPermissions(roleName: string, requiredPermission: PermissionLevel): PermissionCheckResult {
    // Default permission logic based on role hierarchy
    const roleHierarchy: Record<string, PermissionLevel[]> = {
      'Admin': ['read', 'write', 'configure'],
      'Manager': ['read', 'write'],
      'Agent': ['read'],
    };

    const allowedPermissions = roleHierarchy[roleName] || ['read'];
    
    if (this.hasPermission(allowedPermissions, requiredPermission)) {
      return {
        allowed: true,
        effectivePermission: this.getHighestPermission(allowedPermissions),
      };
    }

    return {
      allowed: false,
      reason: `Role '${roleName}' does not have permission '${requiredPermission}'`,
      effectivePermission: this.getHighestPermission(allowedPermissions),
    };
  }

  private getEffectivePermission(
    rules: PermissionRule[],
    context?: Record<string, any>
  ): PermissionLevel {
    let highestPermission: PermissionLevel = 'read';

    for (const rule of rules) {
      // Check conditional logic if present
      if (rule.condition && context) {
        if (!this.evaluateCondition(rule.condition, context)) {
          continue;
        }
      }

      const permissionLevel = rule.permission as PermissionLevel;
      if (this.getPermissionLevel(permissionLevel) > this.getPermissionLevel(highestPermission)) {
        highestPermission = permissionLevel;
      }
    }

    return highestPermission;
  }

  private hasPermission(availablePermissions: PermissionLevel | PermissionLevel[], requiredPermission: PermissionLevel): boolean {
    if (Array.isArray(availablePermissions)) {
      return availablePermissions.some(perm => this.hasPermission(perm, requiredPermission));
    }

    const availableLevel = this.getPermissionLevel(availablePermissions);
    const requiredLevel = this.getPermissionLevel(requiredPermission);

    return availableLevel >= requiredLevel;
  }

  private getPermissionLevel(permission: PermissionLevel): number {
    const levels: Record<PermissionLevel, number> = {
      'read': 1,
      'write': 2,
      'configure': 3,
    };
    return levels[permission] || 0;
  }

  private getHighestPermission(permissions: PermissionLevel[]): PermissionLevel {
    return permissions.reduce((highest, current) => {
      return this.getPermissionLevel(current) > this.getPermissionLevel(highest) ? current : highest;
    }, 'read' as PermissionLevel);
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Simple condition evaluation - in production, use a proper expression evaluator
      // This is a basic implementation - consider using libraries like 'expr-eval' for production
      const sanitizedCondition = condition.replace(/[^a-zA-Z0-9._\s()=!<>]/g, '');
      
      // Replace variables with context values
      let evaluatedCondition = sanitizedCondition;
      for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value));
      }

      // Basic evaluation (use proper expression evaluator in production)
      return eval(evaluatedCondition);
    } catch (error) {
      console.warn('Failed to evaluate condition:', condition, error);
      return false;
    }
  }
} 