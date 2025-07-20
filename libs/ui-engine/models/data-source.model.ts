export interface DataSource {
  id: string;
  name: string;
  type: string; // e.g., "rest", "graphql", "prisma"
  query: string; // Query string or endpoint
  params?: Record<string, any>; // Query parameters
  authContext?: Record<string, any>; // Authentication context
  tenantId: string;
  pages: any[]; // Page[]
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDataSourceInput {
  name: string;
  type: string;
  query: string;
  params?: Record<string, any>;
  authContext?: Record<string, any>;
  tenantId: string;
}

export interface UpdateDataSourceInput {
  name?: string;
  type?: string;
  query?: string;
  params?: Record<string, any>;
  authContext?: Record<string, any>;
} 