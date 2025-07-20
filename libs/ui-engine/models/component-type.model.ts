export interface ComponentType {
  id: string;
  name: string;
  inputSchema: Record<string, any>; // JSON schema for component props
  defaultProps: Record<string, any>; // Default property values
  allowedDataTypes: string[]; // Array of allowed data types
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComponentTypeInput {
  name: string;
  inputSchema: Record<string, any>;
  defaultProps: Record<string, any>;
  allowedDataTypes: string[];
  tenantId: string;
}

export interface UpdateComponentTypeInput {
  name?: string;
  inputSchema?: Record<string, any>;
  defaultProps?: Record<string, any>;
  allowedDataTypes?: string[];
} 