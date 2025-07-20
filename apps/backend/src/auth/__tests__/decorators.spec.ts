import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CurrentTenant } from '../decorators/current-tenant.decorator';

describe('Decorators', () => {
  describe('CurrentUser', () => {
    it('should extract user from HTTP request', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = { user: mockUser };
      
      const mockContext = {
        getType: () => 'http',
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = CurrentUser(undefined, mockContext);
      expect(result).toEqual(mockUser);
    });

    it('should extract user from GraphQL request', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = { user: mockUser };
      
      const mockContext = {
        getType: () => 'graphql',
      } as ExecutionContext;

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: mockRequest }),
      } as any);

      const result = CurrentUser(undefined, mockContext);
      expect(result).toEqual(mockUser);
    });
  });

  describe('CurrentTenant', () => {
    it('should extract tenant from HTTP request', () => {
      const mockTenant = { id: 'tenant123', name: 'Test Tenant' };
      const mockRequest = { tenant: mockTenant };
      
      const mockContext = {
        getType: () => 'http',
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = CurrentTenant(undefined, mockContext);
      expect(result).toEqual(mockTenant);
    });

    it('should extract tenant from GraphQL request', () => {
      const mockTenant = { id: 'tenant123', name: 'Test Tenant' };
      const mockRequest = { tenant: mockTenant };
      
      const mockContext = {
        getType: () => 'graphql',
      } as ExecutionContext;

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: mockRequest }),
      } as any);

      const result = CurrentTenant(undefined, mockContext);
      expect(result).toEqual(mockTenant);
    });
  });
}); 