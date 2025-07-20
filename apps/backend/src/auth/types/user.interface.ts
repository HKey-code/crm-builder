export interface User {
  id: string;
  email: string;
  name?: string;
  preferredLanguage?: string;
  spokenLanguages: string[];
  roleId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
} 