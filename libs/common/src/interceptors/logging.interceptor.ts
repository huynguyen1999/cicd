import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Response } from '.';

@Injectable()
export class LoggingInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const type = context.getType();
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    let logMessage = `Handled in ${className}/${handlerName} - Type: ${type}`;

    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      logMessage += ` - HTTP Method: ${request.method} - Path: ${
        request.url
      } - Body: ${JSON.stringify(request.body)} - Params: ${JSON.stringify(
        request.query,
      )}`;
    } else if (type === 'ws') {
      const client = context.switchToWs().getClient();
      const data = context.switchToWs().getData();
      logMessage += ` - Client: ${client.id} - Data: ${JSON.stringify(data)}`;
    } else {
      const incomingMessage = context.switchToRpc().getData();
      logMessage += ` - From: ${incomingMessage.service || 'unknown'} - User: ${
        incomingMessage.user?._id || 'unknown'
      } - Data: ${JSON.stringify(incomingMessage.data)}`;
    }
    console.log(logMessage);
    return next.handle();
  }
}
