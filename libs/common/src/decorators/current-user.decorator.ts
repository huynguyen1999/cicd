import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Room, User } from '@app/database';

export const getCurrentUserByContext = (
  context: ExecutionContext,
): Partial<User> => {
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

export const getCurrentRoomByContext = (
  context: ExecutionContext,
): Partial<Room> => {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest().room;
  }
  if (context.getType() === 'ws') {
    return context.switchToWs().getClient().handshake?.headers?.room;
  }
  return context.switchToRpc().getData().room;
};

export const CurrentRoom = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    return getCurrentRoomByContext(context);
  },
);
