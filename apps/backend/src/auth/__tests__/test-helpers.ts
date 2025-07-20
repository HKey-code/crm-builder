import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User, Tenant } from '@prisma/client';

export interface MockUserContext {
  user: User;
  tenant: Tenant;
  userRoles: string[];
  userPermissions: string[];
}

export const createMockUserContext = (overrides: Partial<MockUserContext> = {}): MockUserContext => ({
  user: {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    preferredLanguage: 'en',
    spokenLanguages: ['en'],
    roleId: 'role123',
    tenantId: 'tenant123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User,
  tenant: {
    id: 'tenant123',
    name: 'Test Tenant',
    supportedLocales: ['en'],
    defaultLocale: 'en',
    deploymentStack: null,
    isIsolated: false,
    appVersion: null,
    createdAt: new Date(),
  } as Tenant,
  userRoles: ['Admin'],
  userPermissions: ['Admin:read', 'Admin:write', 'Admin:configure'],
  ...overrides,
});

export const createMockExecutionContext = (
  context: MockUserContext,
  type: 'http' | 'graphql' = 'http'
): ExecutionContext => {
  if (type === 'http') {
    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          user: context.user,
          tenant: context.tenant,
          userRoles: context.userRoles,
          userPermissions: context.userPermissions,
        }),
      }),
    } as ExecutionContext;
  } else {
    return {
      getType: () => 'graphql',
    } as ExecutionContext;
  }
};

export const mockGqlExecutionContext = (context: MockUserContext) => {
  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ({
      req: {
        user: context.user,
        tenant: context.tenant,
        userRoles: context.userRoles,
        userPermissions: context.userPermissions,
      },
    }),
  } as any);
};

export const createMockGraphQLContext = (context: MockUserContext) => {
  mockGqlExecutionContext(context);
  return createMockExecutionContext(context, 'graphql');
};

export const createMockHTTPContext = (context: MockUserContext) => {
  return createMockExecutionContext(context, 'http');
}; 