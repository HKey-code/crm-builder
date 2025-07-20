import { ComponentInstance } from './component-instance.model';
import { PermissionRule } from './permission-rule.model';

export interface Section {
  id: string;
  name: string;
  position: number;
  layoutArea: string; // e.g., "header", "sidebar", "main", "footer"
  visibilityConditions?: Record<string, any>;
  pageId: string;
  componentInstances: ComponentInstance[];
  permissionRules: PermissionRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionInput {
  name: string;
  position: number;
  layoutArea: string;
  visibilityConditions?: Record<string, any>;
  pageId: string;
}

export interface UpdateSectionInput {
  name?: string;
  position?: number;
  layoutArea?: string;
  visibilityConditions?: Record<string, any>;
} 