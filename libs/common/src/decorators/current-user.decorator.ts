import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@app/database';

export const getCurrentUserByContext = (context: ExecutionContext): User => {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest().user;
  }
  if (context.getType() === 'ws') {
    return context.switchToWs().getClient().handshake?.headers?.user;
  }
  return context.switchToRpc().getData().user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    return getCurrentUserByContext(context);
  },
);
