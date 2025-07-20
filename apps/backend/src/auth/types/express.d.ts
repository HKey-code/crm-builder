import { User, Tenant } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenant?: Tenant;
      userRoles?: string[];
      userPermissions?: string[];
    }
  }
} 