export interface BindingConfig {
  id: string;
  sourceField: string; // Field name from data source
  targetProp: string; // Component property to bind to
  transform?: Record<string, any>; // Transformation function
  defaultFallback?: any; // Default value if binding fails
  componentInstanceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBindingConfigInput {
  sourceField: string;
  targetProp: string;
  transform?: Record<string, any>;
  defaultFallback?: any;
  componentInstanceId: string;
}

export interface UpdateBindingConfigInput {
  sourceField?: string;
  targetProp?: string;
  transform?: Record<string, any>;
  defaultFallback?: any;
} 