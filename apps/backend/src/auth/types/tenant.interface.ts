export interface Tenant {
  id: string;
  name: string;
  supportedLocales: string[];
  defaultLocale: string;
  deploymentStack?: string;
  isIsolated: boolean;
  appVersion?: string;
  createdAt: Date;
  updatedAt: Date;
} 