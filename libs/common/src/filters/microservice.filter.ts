import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch()
export class MicroserviceFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    return {
      success: false,
      error: exception,
    };
  }
}
