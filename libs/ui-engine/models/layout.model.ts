export interface Layout {
  id: string;
  name: string;
  template: string; // JSON string defining the layout structure
  breakpoints: Record<string, any>; // Responsive breakpoint configuration
  tenantId: string;
  pages: any[]; // Page[]
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLayoutInput {
  name: string;
  template: string;
  breakpoints: Record<string, any>;
  tenantId: string;
}

export interface UpdateLayoutInput {
  name?: string;
  template?: string;
  breakpoints?: Record<string, any>;
} 