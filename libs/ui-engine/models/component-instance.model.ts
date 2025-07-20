import { ComponentType } from './component-type.model';
import { BindingConfig } from './binding-config.model';
import { Interaction } from './interaction.model';
import { PermissionRule } from './permission-rule.model';

export interface ComponentInstance {
  id: string;
  componentTypeId: string;
  componentType: ComponentType;
  props: Record<string, any>;
  binding?: BindingConfig;
  interactions: Interaction[];
  sectionId: string;
  permissionRules: PermissionRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComponentInstanceInput {
  componentTypeId: string;
  props: Record<string, any>;
  sectionId: string;
}

export interface UpdateComponentInstanceInput {
  props?: Record<string, any>;
} 