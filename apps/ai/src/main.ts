import { NestFactory } from '@nestjs/core';
import { AiModule } from './ai.module';
import { ConfigService } from '@nestjs/config';
import {
  LoggingInterceptor,
  MicroserviceFilter,
  ResponseInterceptor,
} from '@app/common';


async function bootstrap() {
  const app = await NestFactory.create(AiModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new MicroserviceFilter());
  await app.listen(port, () => {
    let runtime = process.versions.bun ? 'bun' : 'node';
    console.log(`AI service is running on port ${port} in ${runtime} runtime`);
  });
}
bootstrap();
