import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './filters';
import { LoggingInterceptor, ResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  await app.listen(port, () => {
    let runtime = process.versions.bun ? 'bun' : 'node';
    console.log(
      `Auth service is running on port ${port} in ${runtime} runtime`,
    );
  });
}
bootstrap();
