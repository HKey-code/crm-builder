import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CurrentTenant } from '../decorators/current-tenant.decorator';

// TODO: Fix decorator tests - these decorators return functions, not values
// They need to be tested in actual NestJS context, not called directly
describe('Decorators', () => {
  describe('CurrentUser', () => {
    it.skip('should extract user from HTTP request', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = { user: mockUser };
      
      const mockContext = {
        getType: () => 'http',
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Call the decorator function directly
      const result = CurrentUser(undefined, mockContext);
      expect(result).toEqual(mockUser);
    });

    it.skip('should extract user from GraphQL request', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockRequest = { user: mockUser };
      
      const mockContext = {
        getType: () => 'graphql',
      } as ExecutionContext;

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: mockRequest }),
      } as any);

      // Call the decorator function directly
      const result = CurrentUser(undefined, mockContext);
      expect(result).toEqual(mockUser);
    });
  });

  describe('CurrentTenant', () => {
    it.skip('should extract tenant from HTTP request', () => {
      const mockTenant = { id: 'tenant123', name: 'Test Tenant' };
      const mockRequest = { tenant: mockTenant };
      
      const mockContext = {
        getType: () => 'http',
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Call the decorator function directly
      const result = CurrentTenant(undefined, mockContext);
      expect(result).toEqual(mockTenant);
    });

    it.skip('should extract tenant from GraphQL request', () => {
      const mockTenant = { id: 'tenant123', name: 'Test Tenant' };
      const mockRequest = { tenant: mockTenant };
      
      const mockContext = {
        getType: () => 'graphql',
      } as ExecutionContext;

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: mockRequest }),
      } as any);

      // Call the decorator function directly
      const result = CurrentTenant(undefined, mockContext);
      expect(result).toEqual(mockTenant);
    });
  });
}); 