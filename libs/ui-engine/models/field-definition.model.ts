import { PermissionRule } from './permission-rule.model';

export interface FieldDefinition {
  id: string;
  name: string;
  dataType: string; // e.g., "string", "number", "date", "boolean"
  validationRules?: Record<string, any>;
  defaultValue?: any;
  isVisible: boolean;
  tenantId: string;
  permissionRules: PermissionRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFieldDefinitionInput {
  name: string;
  dataType: string;
  validationRules?: Record<string, any>;
  defaultValue?: any;
  isVisible?: boolean;
  tenantId: string;
}

export interface UpdateFieldDefinitionInput {
  name?: string;
  dataType?: string;
  validationRules?: Record<string, any>;
  defaultValue?: any;
  isVisible?: boolean;
} 