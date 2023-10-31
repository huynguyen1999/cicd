import { NestFactory } from '@nestjs/core';
import { ChatModule } from './chat.module';
import { ConfigService } from '@nestjs/config';
import { LoggingInterceptor, ResponseInterceptor } from '@app/common';
import { AllExceptionsFilter } from './filters';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(port, () => {
    let runtime = process.versions.bun ? 'bun' : 'node';
    console.log(
      `Chat service is running on port ${port} in ${runtime} runtime`,
    );
  });
}
bootstrap();
