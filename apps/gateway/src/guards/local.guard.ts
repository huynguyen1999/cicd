import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';

@Injectable()
export class LocalGuard implements CanActivate {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authentication = this.getAuthentication(context);
    const user = await this.rabbitmqService.requestFromRPC(
      {
        authentication: authentication,
      },
      'auth.validate',
    );
    if (!user) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
    this.addUser(user, context);
    return true;
  }

  private getAuthentication(context: ExecutionContext) {
    let authentication: string;
    if (context.getType() === 'rpc') {
      authentication = context.switchToRpc().getData().authentication;
    } else if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      authentication =
        request.cookies?.authentication ?? request.headers?.authentication;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      authentication = client.handshake.headers.authentication;
    }

    if (authentication?.includes('Bearer')) {
      authentication = authentication.split(' ')?.[1];
    }

    if (!authentication) {
      throw new UnauthorizedException(
        'No value was provided for authentication',
      );
    }
    return authentication;
  }

  private addUser(user: any, context: ExecutionContext) {
    if (context.getType() === 'rpc') {
      context.switchToRpc().getData().user = user;
    } else if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      client.handshake.headers.user = user;
    }
  }
}
