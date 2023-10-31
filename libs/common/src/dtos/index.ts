import { User } from '@app/database';
export class RpcRequest<T> {
  user?: User;

  data?: T;

  signature: string;

  service: string;

  timestamp: number;
}
export * from './auth';
export * from './chat';
export * from './room';
export * from './sessions';
export * from './user';
