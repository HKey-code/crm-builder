import { Section } from './section.model';
import { PermissionRule } from './permission-rule.model';

export interface Page {
  id: string;
  name: string;
  slug: string;
  layoutId?: string;
  dataSourceId?: string;
  visibilityConditions?: Record<string, any>;
  tenantId: string;
  sections: Section[];
  permissionRules: PermissionRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePageInput {
  name: string;
  slug: string;
  layoutId?: string;
  dataSourceId?: string;
  visibilityConditions?: Record<string, any>;
  tenantId: string;
}

export interface UpdatePageInput {
  name?: string;
  slug?: string;
  layoutId?: string;
  dataSourceId?: string;
  visibilityConditions?: Record<string, any>;
} 