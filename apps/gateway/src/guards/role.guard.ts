import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY, UserRole } from '@app/common';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const user = this.getUser(context);
    if (!user) {
      return false;
    }
    return requiredRoles.includes(user.role);
  }

  private getUser(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest().user;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      return client.handshake.headers.user;
    }
    return context.switchToRpc().getData().user;
  }
}
