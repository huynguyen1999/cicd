import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from '.';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const haveResponse =
      (context.getType() === 'http' && context.getType() === 'ws') ||
      typeof context.switchToRpc().getContext()?.properties?.replyTo !==
        'undefined';

    if (haveResponse) {
      return next.handle().pipe(map((data) => ({ success: true, data })));
    } else {
      return next.handle();
    }
  }
}
