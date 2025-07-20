import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Tenant } from '@prisma/client';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Tenant => {
    if (ctx.getType() === 'http') {
      const request = ctx.switchToHttp().getRequest();
      return request.tenant;
    } else {
      const gqlContext = GqlExecutionContext.create(ctx);
      const request = gqlContext.getContext().req;
      return request.tenant;
    }
  },
); 