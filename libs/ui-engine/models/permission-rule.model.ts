export type PermissionTargetType = 'Page' | 'Section' | 'ComponentInstance' | 'FieldDefinition';
export type PermissionLevel = 'read' | 'write' | 'configure';

export interface PermissionRule {
  id: string;
  targetType: PermissionTargetType;
  targetId: string;
  roleIds: string[];
  permission: PermissionLevel;
  condition?: string; // Expression for contextual logic
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionRuleInput {
  targetType: PermissionTargetType;
  targetId: string;
  roleIds: string[];
  permission: PermissionLevel;
  condition?: string;
  tenantId: string;
}

export interface UpdatePermissionRuleInput {
  targetType?: PermissionTargetType;
  targetId?: string;
  roleIds?: string[];
  permission?: PermissionLevel;
  condition?: string;
}

export interface PermissionCheckInput {
  userId: string;
  tenantId: string;
  targetType: PermissionTargetType;
  targetId: string;
  requiredPermission: PermissionLevel;
  context?: Record<string, any>; // Additional context for conditional logic
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  effectivePermission?: PermissionLevel;
} 